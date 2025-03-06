# Visioncreator Content Edit Flow

## Overview

This document describes the complete flow of how content edits work in Visioncreator, from the user interface through the API to the database and back. This is core to our version control and composite system that allows for collaborative content management.

## 1. User Interaction in the Frontend

When a user edits content in our application, the following happens:

1. **Initial Editing**: The user modifies content in either:
   - Content view (markdown/text editing)
   - JSON view (direct JSON editing)

2. **Save Triggered**: The user clicks "Save Changes" button

3. **JSON Preparation**: The frontend:
   - Validates input format
   - Prepares the complete JSON object
   - For content tab: Updates only the `content` field while preserving other JSON fields
   - For JSON tab: Uses the entire modified JSON

4. **API Call**: The frontend makes a call to the `editDB` mutation with:
   - Content ID (which document to modify)
   - Composite ID (container/project it belongs to)
   - The new JSON object
   - Whether to create a variation (typically false for edits)

## 2. API Layer Processing

1. **Request Handling**: The WunderGraph API receives the request with the new JSON

2. **Basic Validation**: The API checks:
   - Required parameters exist
   - JSON is valid

3. **Supabase Function Call**: The API calls the Supabase RPC function `edit_content_with_validation` with:
   - Content ID
   - The new JSON object
   - Create variation flag
   - Composite ID

4. **Response Processing**: The API:
   - Handles any errors from the database
   - Returns success/failure and relevant information back to the frontend

## 3. Database Processing

1. **Security Check**: The database function verifies the user has permission

2. **Content Retrieval**: The system fetches the current content from the database

3. **Diff Generation**: The `generate_diff` function compares:
   - The current stored JSON
   - The new JSON from the user
   - Produces a diff with "added", "changed", and "removed" sections

4. **Patch Request Creation**: A new patch request record is created:
   - Linked to the composite
   - Status set to "pending"
   - Author set to current user
   - References the original content (old_version_id)

5. **Operations Generation**: The `generate_operations_from_diff` function:
   - Takes the diff object
   - Creates individual operation records for every change
   - Each operation has a type (add, remove, replace)
   - Operations include path, old value, new value
   - All operations are linked to the patch request

6. **Completion**: The database returns success information with the patch request ID

## 4. Approval Flow (When Ready)

1. **Review**: User with appropriate permissions reviews the patch request
   - Views operations in the PatchRequests component
   - Decides to approve or reject

2. **Approval Action**: On approval, the `approve_patch_request` function:
   - Updates patch request status to "approved"
   - Retrieves all operations for the patch request
   - Fetches the current content
   - Applies all operations to create a new content version
   - Creates a new content record with the updated JSON
   - Updates the patch request with the new_version_id

3. **Content Update**: The composite now references the new content version

## 5. Frontend Update

1. **Notification**: The frontend receives success notification
   - Refreshes data from the server
   - Updates the UI to show the latest content

2. **UI Reset**: The editing state is reset
   - Changes flag is cleared
   - Edit content is updated to match the saved content

## Database Structure

The system uses several tables to manage this flow:

1. **db**: Stores content snapshots
   - Each record represents a specific version of content
   - Contains the full JSON content
   - Has a unique snapshot_id

2. **composites**: Container objects for content
   - References a specific content version via compose_id
   - Maintains relationships with other composites
   - Tracks authorship and metadata

3. **patch_requests**: Manages proposed changes
   - Links to the composite being modified
   - Tracks old_version_id and new_version_id
   - Has a status (pending, approved, rejected)
   - Records author information

4. **db_operations**: Records granular changes
   - Each record represents a single atomic change
   - Contains operation_type (add, remove, replace)
   - Includes path information
   - Stores old_value and new_value
   - Links to the patch_request_id

## Key Functions

1. **edit_content_with_validation**: Entry point for content editing
2. **process_content_update**: Main content processing function
3. **generate_diff**: Compares old and new JSON to create a diff
4. **generate_operations_from_diff**: Creates operation records from diff
5. **approve_patch_request**: Applies changes when approved

## Benefits of This Architecture

1. **Versioning**: Complete history of all content changes
2. **Collaboration**: Multiple users can propose changes
3. **Review Process**: Changes can be reviewed before applying
4. **Granularity**: Detailed tracking of every modification
5. **Transparency**: Clear record of who changed what and when 


# Refactoring Plan: Moving Diffing to Frontend

This section outlines the plan to refactor our current implementation to move the diffing logic from the backend to the frontend using fast-json-patch, while fully adopting the JSON Patch standard (RFC 6902) throughout the system.

### Goals

1. **Reduce Server Load**: Move computationally intensive diffing to client
2. **Improve Network Efficiency**: Send only operations instead of full JSON
3. **Standardize Operations**: Use RFC 6902 JSON Patch standard across the entire stack
4. **Preserve User Experience**: Keep all existing UI components and workflows intact
5. **Complete Migration**: Fully replace custom diffing with standardized JSON Patch

### Changes Required

#### 1. Frontend Changes

1. **Add fast-json-patch Library**:
   ```bash
   npm install fast-json-patch --save
   ```

2. **Modify ComposeProposal.svelte**:
   - Import fast-json-patch and use its `compare()` function
   - Cache original content for comparison
   - Generate JSON Patch operations client-side
   - Send operations instead of full JSON

3. **Update editDBMutation Call**:
   ```javascript
   // New approach - send operations directly
   const result = await $editDBMutation.mutateAsync({
     id: currentComposeId,
     compositeId: compositeIdToUse,
     operations: patchOperations, // Standard RFC 6902 operations
     createVariation: false
   });
   ```

#### 2. API Layer Changes (editDB.ts)

1. **Update Input Schema**:
   - Replace `json` parameter with `operations` array
   - Add schema definition for JSON Patch operations
   - Validate basic operation format according to RFC 6902
   - Remove need for client-side schema validation of content

2. **Simplify API Handler**:
   - Update handler to process operations instead of full JSON
   - Pass operations directly to the database for validation and processing
   - Let PostgreSQL handle schema validation and operation application

3. **Error Handling**:
   - Forward database validation errors to the client
   - Maintain consistent error format for client consumption

#### 3. Database Changes

1. **Modify db_operations Table**:
   - Update the table structure to directly store RFC 6902 operations
   - Add columns for `op`, `path`, `from`, and `value`
   - Maintain links to patch_request_id

2. **Implement PostgreSQL-Based JSON Schema Validation**:
   - Use PostgreSQL's native JSON capabilities for validation
   - Create a new validation function that validates against schema
   - Implement JSON Patch application using PostgreSQL functions
   - Ensure validation happens during patch request creation before snapshot creation

3. **Create New Processing Function**:
   ```sql
   CREATE OR REPLACE FUNCTION public.process_json_patch_operations(
     p_content_id uuid,
     p_operations jsonb,
     p_composite_id uuid,
     p_create_variation boolean DEFAULT false
   ) RETURNS jsonb AS $$
   DECLARE
     v_current_content jsonb;
     v_schema_id uuid;
     v_schema_json jsonb;
     v_new_content jsonb;
     v_validation_result jsonb;
     v_patch_request_id uuid;
   BEGIN
     -- Get current content and schema ID
     SELECT compose_json, schema INTO v_current_content, v_schema_id 
     FROM public.db 
     WHERE id = p_content_id;
     
     -- Get schema definition
     SELECT compose_json INTO v_schema_json 
     FROM public.db 
     WHERE id = v_schema_id;
     
     -- Apply operations to get new content
     v_new_content := apply_json_patch(v_current_content, p_operations);
     
     -- Validate new content against schema
     v_validation_result := validate_json_against_schema(v_new_content, v_schema_json);
     
     -- If validation fails, return error
     IF NOT (v_validation_result->>'valid')::boolean THEN
       RETURN jsonb_build_object(
         'success', false,
         'error', 'Schema validation failed',
         'details', v_validation_result
       );
     END IF;
     
     -- Create patch request
     INSERT INTO patch_requests(...)
     RETURNING id INTO v_patch_request_id;
     
     -- Store operations
     -- Process operations
     
     RETURN jsonb_build_object(
       'success', true,
       'patch_request_id', v_patch_request_id
     );
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Create JSON Schema Validation Functions**:
   ```sql
   CREATE OR REPLACE FUNCTION public.validate_json_against_schema(
     p_json jsonb,
     p_schema jsonb
   ) RETURNS jsonb AS $$
   BEGIN
     -- Use PostgreSQL JSON validation functions
     -- Return validation result with errors
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE OR REPLACE FUNCTION public.apply_json_patch(
     p_base_json jsonb,
     p_operations jsonb
   ) RETURNS jsonb AS $$
   DECLARE
     v_result jsonb := p_base_json;
     v_op jsonb;
   BEGIN
     -- Apply each operation in sequence
     -- Handle all RFC 6902 operations (add, remove, replace, move, copy, test)
     -- Return resulting JSON
   END;
   $$ LANGUAGE plpgsql;
   ```

5. **Clean Up Deprecated Diffing Code**:
   - Remove `generate_diff` function 
   - Remove `generate_operations_from_diff` function
   - Remove custom diff-related logic
   - Replace with direct JSON Patch operation processing

6. **Update Approval Workflow**:
   - Modify `approve_patch_request` to handle RFC 6902 operations
   - Revalidate the resulting document during approval as a safety check
   - Only create new content version if validation passes

#### 4. Integration Points and Maintaining User Flows

1. **PatchRequests.svelte Adaptations**:
   - Update to display RFC 6902 operations properly
   - Maintain same visual format for operation display 
   - Ensure operation visualization is consistent with current UI

2. **Approval Workflow Preservation**:
   - Keep same approval UI and flow
   - Maintain same permissions and access control
   - Ensure operation application works exactly as before

3. **Merge Functionality Preservation**:
   - Update merge functions to work with JSON Patch operations
   - Ensure conflicts are detected and displayed properly
   - Maintain merge workflows and user experience

4. **Critical UI Flow Preservation**:
   - Maintain exact same user experience for content editing
   - Keep variation/branch creation workflows identical
   - Preserve all visualization of changes and operations

### Implementation Phases

#### Phase 1: Frontend Implementation
1. Add fast-json-patch library
2. Update ComposeProposal.svelte to generate and send JSON Patch operations
3. Add client-side logging to verify operations

#### Phase 2: Database Schema Validation
1. Create PostgreSQL functions for JSON schema validation
2. Create functions for applying JSON Patch operations
3. Test validation with various schemas and operations

#### Phase 3: API Layer Updates
1. Update editDB.ts to accept operations only
2. Remove client-side validation logic
3. Pass operations to new database functions

#### Phase 4: Database Structure Changes
1. Modify db_operations table to align with RFC 6902
2. Create database migration script
3. Add utility functions for JSON Patch processing

#### Phase 5: Database Function Updates
1. Create new operations-based processing function with validation
2. Update approval and merge workflows
3. Remove deprecated diffing code and functions

#### Phase 6: UI Adaptation
1. Update PatchRequests.svelte for RFC 6902 operations
2. Ensure operation visualization is correct
3. Test all UI flows with the new operation format

#### Phase 7: Testing and Finalization
1. Comprehensive testing of all user flows
2. Performance benchmarking
3. Fix any issues with operation processing
4. Finalize documentation

### Expected Benefits

1. **Performance Improvements**:
   - Reduced server load for diffing operations
   - More efficient network usage (only sending changes)
   - Faster response times for large documents
   - Improved database efficiency without custom diffing

2. **Developer Experience**:
   - Standardized operation format (RFC 6902) throughout the stack
   - Better tooling support and integration with libraries
   - Easier debugging of changes with standard format
   - Simpler codebase without custom diffing

3. **Maintainability**:
   - Cleaner database functions without complex diffing
   - Reduced SQL complexity
   - Standard operation format in database
   - Direct compatibility with JSON Patch libraries

4. **Data Integrity**:
   - Schema validation happens at the database level
   - Validation occurs before storing operations
   - Revalidation during approval process
   - Consistent enforcement of schema rules

5. **Scalability**:
   - Distributes computational load to clients for diffing
   - Leverages PostgreSQL's optimized JSON functions for validation and operations
   - Reduces database CPU usage
   - More efficient operation storage and processing

### Key Database Functions to Update

The following functions in `20250220000004_db_operations.sql` will need to be updated:

1. **Functions to Remove**:
   - `generate_diff`
   - `generate_operations_from_diff` 
   - Other custom diff-related helper functions

2. **Functions to Create**:
   - `validate_json_against_schema`: Validate JSON against a schema using PostgreSQL
   - `apply_json_patch`: Apply RFC 6902 operations using PostgreSQL
   - `process_json_patch_operations`: Main entry point for operations-based editing

3. **Functions to Modify**:
   - `process_content_update`: Update to handle RFC 6902 operations directly
   - `approve_patch_request`: Ensure proper handling of JSON Patch operations
   - Any merge-related functions: Update to work with standard operations

### Next Steps

1. Create a detailed technical specification for database validation functions
2. Research PostgreSQL JSON schema validation capabilities and extensions
3. Develop a proof-of-concept with fast-json-patch in the frontend
4. Create database migration scripts for table and function updates
5. Implement and test validation functions with sample schemas
6. Update UI components to work with new operation format 