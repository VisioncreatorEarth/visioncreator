# Supabase Migration Best Practices

This guide outlines the essential security practices and patterns to follow when creating database migrations in Supabase.

## Core Security Principles

1. **Row Level Security (RLS) is Mandatory**
   - Enable RLS on ALL tables without exception
   - Use `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
   - Never disable RLS, even temporarily

2. **Service Role Privileges**
   - Grant full access ONLY to the service role
   - No other role should have any other permissions
   - Example policy pattern:
     ```sql
     CREATE POLICY "service_role_full_access" ON your_table
     FOR ALL
     TO authenticated
     USING (auth.jwt()->>'role' = 'service_role');
     ```

3. **Function Security**
   - Set `SECURITY DEFINER` only when absolutely necessary
   - Always specify `SECURITY INVOKER` as default
   - Restrict function execution to service role:
     ```sql
     REVOKE ALL ON FUNCTION your_function FROM PUBLIC;
     GRANT EXECUTE ON FUNCTION your_function TO service_role;
     ```

4. **Trigger Security**
   - Create triggers with `SECURITY DEFINER` when they need elevated privileges
   - Ensure trigger functions can only be executed by service role
   - Example:
     ```sql
     CREATE TRIGGER your_trigger
     BEFORE INSERT ON your_table
     FOR EACH ROW
     EXECUTE FUNCTION your_trigger_function();
     
     REVOKE ALL ON your_table FROM PUBLIC;
     GRANT USAGE ON your_table TO service_role;
     ```

## Migration Checklist

✅ Enable RLS on new table
✅ Create service role policy
✅ Revoke public access
✅ Set function security
✅ Configure trigger permissions
✅ Test with service role
✅ Test with any other regular user (should fail)

## Common Patterns

### Basic Table Creation with RLS
```sql
-- Create table
CREATE TABLE your_table (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Grant service role access
GRANT ALL ON your_table TO service_role;

-- Create service role policy
CREATE POLICY "service_role_full_access" ON your_table
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'service_role');
```

### Function Creation with Security
```sql
CREATE OR REPLACE FUNCTION your_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Function logic here
  RETURN NEW;
END;
$$;

-- Restrict access to service role
REVOKE ALL ON FUNCTION your_function FROM PUBLIC;
GRANT EXECUTE ON FUNCTION your_function TO service_role;
```

## Security Verification

After creating migrations, verify:

1. RLS is enabled on all tables:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. Policies are correctly set:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. Function permissions:
   ```sql
   SELECT p.proname, pg_get_userbyid(p.proowner) as owner,
          CASE WHEN p.prosecdef THEN 'definer' ELSE 'invoker' END as security
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public';
   ```

## Common Pitfalls to Avoid

❌ Never disable RLS
❌ Never grant PUBLIC access to tables
❌ Avoid using SECURITY DEFINER unless absolutely necessary
❌ Don't create policies that allow broad access
❌ Don't forget to test with both service role and regular users

Remember: Security is not optional. Always err on the side of being more restrictive and grant additional permissions only when necessary and justified.
