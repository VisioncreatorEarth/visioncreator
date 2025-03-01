create extension if not exists "wrappers" with schema "extensions";

-- First, check if the db table exists before trying to drop triggers on it
DO $$
BEGIN
    -- Check if the table exists before trying to drop triggers
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'db') THEN
        -- Drop triggers and functions only if the table exists
        DROP TRIGGER IF EXISTS on_db_update_archive ON public.db CASCADE;
        DROP TRIGGER IF EXISTS check_author_permissions ON public.db CASCADE;
        DROP FUNCTION IF EXISTS public.update_db_version CASCADE;
        DROP FUNCTION IF EXISTS public.archive_db_version CASCADE;
        DROP FUNCTION IF EXISTS public.check_author_permissions CASCADE;
        DROP FUNCTION IF EXISTS public.handle_content_update CASCADE;
        DROP FUNCTION IF EXISTS public.edit_content_with_validation CASCADE;
        DROP FUNCTION IF EXISTS public.process_content_update CASCADE;
    END IF;
END
$$;

-- Drop tables if they exist (this will also drop their constraints)
DROP TABLE IF EXISTS "public"."db_archive" CASCADE;
DROP TABLE IF EXISTS "public"."db" CASCADE;

-- Create a single consolidated db table without archive flags
create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb,
    "author" uuid,
    "schema" uuid,  -- Self-referential constraint added later
    "created_at" timestamptz not null default now(),
    "last_modified_at" timestamptz not null default now(),
    "snapshot_id" uuid not null default gen_random_uuid(),
    constraint "db_pkey" primary key ("id"),
    constraint "db_author_fkey" foreign key ("author") references profiles(id) on delete set null
);

-- First drop existing constraints if they exist
ALTER TABLE "public"."db" DROP CONSTRAINT IF EXISTS "db_schema_fkey";

-- Create a function to validate schema references
CREATE OR REPLACE FUNCTION public.validate_schema_reference() 
RETURNS trigger AS $$
BEGIN
  -- Allow self-reference for root schema
  IF NEW.id = '00000000-0000-0000-0000-000000000001' AND 
     NEW.schema = '00000000-0000-0000-0000-000000000001' THEN
    RETURN NEW;
  END IF;

  -- Check if the schema exists in the db table (active or archived)
  IF EXISTS (SELECT 1 FROM public.db WHERE id = NEW.schema) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Referenced schema % not found in db', NEW.schema;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate schema references
CREATE TRIGGER validate_schema_ref_db
  BEFORE INSERT OR UPDATE ON public.db
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_schema_reference();

-- Create indexes
CREATE INDEX idx_db_author ON public.db(author);
CREATE INDEX idx_db_schema ON public.db(schema);
CREATE INDEX idx_db_snapshot_id ON public.db(snapshot_id);

-- Create function to handle content updates with permissions check
CREATE OR REPLACE FUNCTION public.handle_content_update(
    p_id uuid,
    p_json jsonb,
    p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_is_author boolean;
    v_current_item record;
    v_composite record;
    v_result jsonb;
    v_new_json jsonb;
BEGIN
    -- Initialize the result
    v_result := jsonb_build_object('success', false);
    
    -- Check if the item exists
    SELECT * INTO v_current_item
    FROM public.db
    WHERE id = p_id;
    
    IF v_current_item IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item not found',
            'details', format('Could not find content with id %s', p_id)
        );
    END IF;
    
    -- Check if the current user is the author
    v_is_author := (v_current_item.author = p_user_id);
    
    -- Clean the JSON input
    v_new_json := p_json;
    -- Remove any system fields if they were accidentally included
    v_new_json := v_new_json - 'created_at';
    v_new_json := v_new_json - 'author';
    v_new_json := v_new_json - 'schema';
    v_new_json := v_new_json - 'snapshot_id';
    v_new_json := v_new_json - 'last_modified_at';

    -- Find the composite that uses this content
    SELECT * INTO v_composite
    FROM public.composites
    WHERE compose_id = p_id
    LIMIT 1;
    
    IF v_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No composite found for this content',
            'details', format('Content with id %s is not referenced by any composite', p_id)
        );
    END IF;
    
    -- If the user is not the author, create a variation instead
    IF NOT v_is_author THEN
        -- Create a variation using the same function for both cases
        RETURN public.create_composite_variation(
            p_user_id,
            v_composite.id,
            v_new_json
        );
    END IF;
    
    -- For content where user is the author, process the edit
    RETURN public.process_edit(p_id, v_new_json, p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to generate diff between two JSON objects
CREATE OR REPLACE FUNCTION public.generate_diff(
    p_old_json jsonb,
    p_new_json jsonb
) RETURNS jsonb AS $$
DECLARE
    v_diff jsonb;
    v_operations jsonb := '[]'::jsonb;
    v_key text;
    v_old_value jsonb;
    v_new_value jsonb;
BEGIN
    -- Handle simple case of completely new or deleted objects
    IF p_old_json IS NULL AND p_new_json IS NOT NULL THEN
        RETURN jsonb_build_object(
            'operations', jsonb_build_array(
                jsonb_build_object(
                    'op', 'add',
                    'path', '/',
                    'value', p_new_json
                )
            )
        );
    END IF;
    
    IF p_old_json IS NOT NULL AND p_new_json IS NULL THEN
        RETURN jsonb_build_object(
            'operations', jsonb_build_array(
                jsonb_build_object(
                    'op', 'remove',
                    'path', '/'
                )
            )
        );
    END IF;
    
    -- For each key in the new JSON
    FOR v_key, v_new_value IN SELECT * FROM jsonb_each(p_new_json) LOOP
        -- Check if key exists in old JSON
        IF p_old_json ? v_key THEN
            v_old_value := p_old_json -> v_key;
            
            -- If values are different, add a replace operation
            IF v_old_value IS DISTINCT FROM v_new_value THEN
                -- For nested objects, recursively generate diff
                IF jsonb_typeof(v_old_value) = 'object' AND jsonb_typeof(v_new_value) = 'object' THEN
                    v_diff := public.generate_diff(v_old_value, v_new_value);
                    
                    -- Add path prefix to nested operations
                    IF v_diff -> 'operations' IS NOT NULL THEN
                        FOR i IN 0..jsonb_array_length(v_diff -> 'operations') - 1 LOOP
                            v_operations := v_operations || jsonb_build_array(
                                jsonb_set(
                                    v_diff -> 'operations' -> i,
                                    '{path}',
                                    to_jsonb('/' || v_key || (v_diff -> 'operations' -> i ->> 'path'))
                                )
                            );
                        END LOOP;
                    END IF;
                ELSE
                    -- Simple value replacement
                    v_operations := v_operations || jsonb_build_array(
                        jsonb_build_object(
                            'op', 'replace',
                            'path', '/' || v_key,
                            'old_value', v_old_value,
                            'value', v_new_value
                        )
                    );
                END IF;
            END IF;
        ELSE
            -- Key doesn't exist in old JSON, add an add operation
            v_operations := v_operations || jsonb_build_array(
                jsonb_build_object(
                    'op', 'add',
                    'path', '/' || v_key,
                    'value', v_new_value
                )
            );
        END IF;
    END LOOP;
    
    -- For each key in the old JSON that's not in the new JSON
    FOR v_key, v_old_value IN SELECT * FROM jsonb_each(p_old_json) LOOP
        IF NOT p_new_json ? v_key THEN
            -- Key exists in old but not in new, add a remove operation
            v_operations := v_operations || jsonb_build_array(
                jsonb_build_object(
                    'op', 'remove',
                    'path', '/' || v_key,
                    'old_value', v_old_value
                )
            );
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object('operations', v_operations);
END;
$$ LANGUAGE plpgsql;

-- Create function to update vector clock for tracking changes
CREATE OR REPLACE FUNCTION public.update_vector_clock(
    p_vector_clock jsonb,
    p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_current_timestamp bigint;
    v_user_key text;
BEGIN
    -- Convert UUID to text for use as a JSON key
    v_user_key := p_user_id::text;
    
    -- Get current Unix timestamp in milliseconds
    v_current_timestamp := (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint;
    
    -- Return updated vector clock with this user's timestamp updated
    IF p_vector_clock IS NULL THEN
        RETURN jsonb_build_object(v_user_key, v_current_timestamp);
    ELSE
        RETURN jsonb_set(p_vector_clock, ARRAY[v_user_key], to_jsonb(v_current_timestamp));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Process edit function that generates operations and patch requests
CREATE OR REPLACE FUNCTION public.process_edit(
    p_id uuid,
    p_json jsonb,
    p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_old_content record;
    v_new_content_id uuid := gen_random_uuid();
    v_new_snapshot_id uuid := gen_random_uuid();
    v_vector_clock jsonb := '{}'::jsonb;
    v_patch_request_id uuid;
    v_operation_ids uuid[] := ARRAY[]::uuid[];
    v_composite record;
    v_diff jsonb;
    v_operations jsonb;
    v_op jsonb;
    v_op_id uuid;
BEGIN
    -- 1. Get the current content
    SELECT * INTO v_old_content
    FROM public.db
    WHERE id = p_id;
    
    IF v_old_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', format('Content with id %s not found', p_id)
        );
    END IF;
    
    -- 2. Get the composite that references this content
    SELECT * INTO v_composite
    FROM public.composites
    WHERE compose_id = p_id
    LIMIT 1;
    
    IF v_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No composite found for this content',
            'details', format('Content with id %s is not referenced by any composite', p_id)
        );
    END IF;
    
    -- 3. Create a patch request
    INSERT INTO public.patch_requests (
        title,
        description,
        author,
        old_version_id,
        new_version_id,
        composite_id
    ) VALUES (
        'Update to ' || v_composite.title,
        'Content update for ' || v_composite.title,
        p_user_id,
        p_id,
        v_new_content_id,
        v_composite.id
    )
    RETURNING id INTO v_patch_request_id;
    
    -- 4. Generate diff
    v_diff := public.generate_diff(v_old_content.json, p_json);
    v_operations := v_diff -> 'operations';
    
    -- 5. Update vector clock and create operations from diff
    v_vector_clock := public.update_vector_clock(v_vector_clock, p_user_id);
    
    FOR i IN 0..jsonb_array_length(v_operations) - 1 LOOP
        BEGIN
            v_op := v_operations -> i;
            
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                vector_clock,
                metadata
            ) VALUES (
                v_patch_request_id,
                v_op ->> 'op',
                string_to_array(substring((v_op ->> 'path'), 2), '/'),  -- Remove leading '/' and split
                CASE WHEN v_op ? 'old_value' THEN v_op -> 'old_value' ELSE NULL END,
                CASE WHEN v_op ? 'value' THEN v_op -> 'value' ELSE NULL END,
                p_user_id,
                v_composite.id,
                v_new_content_id,
                v_vector_clock,
                jsonb_build_object(
                    'timestamp', now(),
                    'snapshot_id', v_new_snapshot_id
                )
            )
            RETURNING id INTO v_op_id;
            
            -- Add to operation IDs array
            v_operation_ids := array_append(v_operation_ids, v_op_id);
        END;
    END LOOP;
    
    -- 6. Create new content snapshot
    INSERT INTO public.db (
        id,
        json,
        author,
        schema,
        created_at,
        last_modified_at,
        snapshot_id
    ) VALUES (
        v_new_content_id,
        p_json,
        p_user_id,
        v_old_content.schema,
        now(),
        now(),
        v_new_snapshot_id
    );
    
    -- 7. Update composite to point to new content
    UPDATE public.composites
    SET compose_id = v_new_content_id,
        updated_at = now()
    WHERE id = v_composite.id;
    
    -- 8. Auto-approve the patch request (since it's the author's own edit)
    UPDATE public.patch_requests
    SET status = 'approved',
        updated_at = now()
    WHERE id = v_patch_request_id;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Content updated successfully',
        'newContentId', v_new_content_id,
        'patchRequestId', v_patch_request_id,
        'operationCount', array_length(v_operation_ids, 1),
        'snapshotId', v_new_snapshot_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create RPC wrapper function to validate and edit content
CREATE OR REPLACE FUNCTION public.edit_content_with_validation(
    p_id uuid,
    p_json jsonb,
    p_user_id uuid,
    p_composite_id uuid DEFAULT NULL,
    p_create_variation boolean DEFAULT false,
    p_variation_title text DEFAULT NULL,
    p_variation_description text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_current_item record;
    v_schema_id uuid;
    v_validation_result jsonb;
    v_is_meta_schema boolean := false;
    v_composite record;
BEGIN
    -- Check if the item exists in db
    SELECT * INTO v_current_item
    FROM public.db
    WHERE id = p_id;
    
    IF v_current_item IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item not found',
            'details', format('Could not find content with id %s', p_id)
        );
    END IF;
    
    -- Get the schema ID
    v_schema_id := v_current_item.schema;
    
    -- Check if this is the meta-schema
    IF v_schema_id = '00000000-0000-0000-0000-000000000001' THEN
        v_is_meta_schema := true;
    END IF;
    
    -- Validate content against schema
    -- First check if the validate_content_against_schema function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_content_against_schema') THEN
        v_validation_result := public.validate_content_against_schema(p_json, v_schema_id);
        
        IF NOT (v_validation_result->>'valid')::boolean THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Validation failed',
                'details', v_validation_result
            );
        END IF;
    END IF;
    
    -- If validation passes and create_variation is true, create a variation
    IF p_create_variation THEN
        -- If composite ID is provided, use it; otherwise find the composite that uses this content
        IF p_composite_id IS NOT NULL THEN
            SELECT * INTO v_composite
            FROM public.composites
            WHERE id = p_composite_id;
            
            IF v_composite IS NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Specified composite not found',
                    'details', format('Composite with id %s not found', p_composite_id)
                );
            END IF;
        ELSE
            SELECT * INTO v_composite
            FROM public.composites
            WHERE compose_id = p_id
            LIMIT 1;
            
            IF v_composite IS NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'No composite found for this content',
                    'details', format('Content with id %s is not referenced by any composite', p_id)
                );
            END IF;
        END IF;
        
        -- Create a variation
        RETURN public.create_composite_variation(
            p_user_id,
            v_composite.id,
            p_json,
            p_variation_title,
            p_variation_description
        );
    ELSE
        -- Modify handle_content_update function to use the composite_id parameter if available
        IF p_composite_id IS NOT NULL THEN
            -- Find the specified composite
            SELECT * INTO v_composite
            FROM public.composites
            WHERE id = p_composite_id;
            
            IF v_composite IS NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Specified composite not found',
                    'details', format('Composite with id %s not found', p_composite_id)
                );
            END IF;
            
            -- Override the content ID to match the composite's content
            IF v_composite.compose_id != p_id THEN
                RAISE NOTICE 'Warning: Content ID (%) does not match the provided composite''s content ID (%). Using composite''s content ID.', p_id, v_composite.compose_id;
            END IF;
            
            -- Pass the composite ID through to handle_content_update (extending it)
            -- Since we can't modify handle_content_update now, we'll follow its logic here for the specific composite
            
            -- Similar to handle_content_update but for a specific composite
            DECLARE
                v_is_author boolean;
                v_is_archived boolean := false;
                v_result jsonb;
                v_new_json jsonb;
            BEGIN
                -- Check if the current user is the author
                v_is_author := (v_composite.author = p_user_id);
                
                -- Clean the JSON input
                v_new_json := p_json;
                v_new_json := v_new_json - 'created_at';
                v_new_json := v_new_json - 'author';
                v_new_json := v_new_json - 'schema';
                v_new_json := v_new_json - 'snapshot_id';
                v_new_json := v_new_json - 'last_modified_at';
                
                -- If the user is not the author, create a variation
                IF NOT v_is_author THEN
                    RETURN public.create_composite_variation(
                        p_user_id,
                        v_composite.id,
                        v_new_json
                    );
                END IF;
                
                -- For active content where user is the author, process the edit
                RETURN public.process_edit(v_composite.compose_id, v_new_json, p_user_id);
            END;
        ELSE
            -- Use the old behavior if no composite_id is provided
            RETURN public.handle_content_update(p_id, p_json, p_user_id);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE "public"."db" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE "public"."db" TO service_role;

-- RLS Policies
CREATE POLICY "service_role_all" ON "public"."db"
AS PERMISSIVE FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Insert root schema
INSERT INTO "public"."db" (id, json, author, schema) VALUES 
('00000000-0000-0000-0000-000000000001', 
'{ 
  "type": "object",
  "title": "Meta Schema",
  "description": "Root schema for defining all other schemas",
  "additionalProperties": false,
  "properties": {
    "type": {
      "type": "string",
      "enum": ["object", "array", "string", "number", "integer", "boolean", "null"],
      "title": "Type",
      "description": "The type of the schema",
      "isMetadata": true
    },
    "title": {
      "type": "string",
      "title": "Title",
      "description": "The title of the schema",
      "isMetadata": true
    },
    "description": {
      "type": "string",
      "title": "Description", 
      "description": "A description of the schema"
    },
    "display_field": {
      "type": "string",
      "title": "Display Field",
      "description": "The field to use for displaying the object"
    },
    "properties": {
      "type": "object",
      "title": "Properties",
      "description": "Schema properties definition"
    },
    "required": {
      "type": "array",
      "items": {"type": "string"},
      "title": "Required Fields",
      "description": "List of required properties"
    },
    "additionalProperties": {
      "type": "boolean",
      "title": "Allow Additional Properties",
      "description": "Whether to allow properties not defined in the schema",
      "default": false
    }
  },
  "required": ["type", "title", "description", "properties"]
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user ID for root schema
'00000000-0000-0000-0000-000000000001'   -- Self-reference for meta schema
);

