-- Migration: Add metadata column to patch_requests table
-- Description: Adds metadata and operation_type columns to support merge operations

-- Add metadata column to patch_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patch_requests' 
                  AND column_name = 'metadata') THEN
        ALTER TABLE public.patch_requests ADD COLUMN metadata jsonb;
    END IF;
END $$;

-- Add operation_type column to patch_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patch_requests' 
                  AND column_name = 'operation_type') THEN
        ALTER TABLE public.patch_requests ADD COLUMN operation_type text;
    END IF;
END $$;

-- Create index for faster querying with operation_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM pg_indexes 
                  WHERE tablename = 'patch_requests' 
                  AND indexname = 'patch_requests_operation_type_idx') THEN
        CREATE INDEX patch_requests_operation_type_idx ON public.patch_requests (operation_type);
    END IF;
END $$;

COMMENT ON COLUMN public.patch_requests.metadata IS 'JSON metadata for the patch request, including merge-specific data';
COMMENT ON COLUMN public.patch_requests.operation_type IS 'Type of operation, e.g. edit, merge, branch'; 