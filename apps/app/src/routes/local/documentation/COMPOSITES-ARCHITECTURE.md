# Visioncreator Content Architecture

## Overview

This document describes the complete architecture of how content editing and version control works in Visioncreator. The system uses RFC 6902 JSON Patch operations for tracking changes and TipTap/ProseMirror for rich content structure, all operating within a composite-based content management system.

## 1. Content Structure

### Rich Text Format (TipTap/ProseMirror)

Content in Visioncreator is stored using a rich text format compatible with TipTap and ProseMirror editors:

```json
{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [{ "type": "text", "text": "Example Heading" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Example paragraph text" }]
      }
    ]
  },
  "title": "Document Title",
  "metadata": { ... }
}
```

This structure supports:
- Rich text formatting (bold, italic, etc.)
- Hierarchical document structure
- Lists, tables, and other complex elements
- Custom metadata

## 2. User Interaction in the Frontend

When a user edits content in our application, the following happens:

1. **Initial Editing**: The user modifies content in either:
   - Content view (TipTap rich text editing, abstracted for simplicity)
   - JSON view (direct JSON structure editing)

2. **Change Detection**: The system:
   - Caches the original content state when editing begins
   - Tracks changes as they occur
   - Uses fast-json-patch to compute RFC 6902 operations when saved

3. **Save Triggered**: When the user clicks "Save Changes":
   - The frontend compares the new state with the original
   - Generates a minimal set of JSON Patch operations
   - Sends only the operations to the API, not the entire document

4. **Operation Generation**: Client-side processing:
   ```javascript
   const patchOperations = jsonpatch.compare(originalJson, newJson);
   ```

5. **API Call**: The frontend makes a call to the `editDB` mutation with:
   - Content ID (which document to modify)
   - Composite ID (container/project it belongs to)
   - The operations array (not the full document)
   - Creation variation flag (typically false for edits)

## 3. API Layer Processing

1. **Request Handling**: The WunderGraph API receives:
   ```typescript
   {
     id: "content-uuid",
     compositeId: "composite-uuid",
     operations: [
       { op: "replace", path: "/content/title", value: "New Title" },
       { op: "add", path: "/metadata/tags/0", value: "new-tag" }
     ],
     createVariation: false
   }
   ```

2. **Validation**: The API validates:
   - Required parameters exist
   - Operations follow RFC 6902 format
   - User has appropriate permissions

3. **Supabase Function Call**: The API calls either:
   - `process_json_patch` (for standard edits)
   - `edit_content_with_validation` (maintains backward compatibility)

4. **Response Processing**: The API:
   - Returns success/failure information
   - Includes the patch request ID for tracking

## 4. Database Structure

The system uses several tables to manage content and changes:

1. **db**: Stores content snapshots
   - Each record is an immutable version of content
   - Contains the full JSON content with TipTap structure
   - Has schema reference for validation

2. **composites**: Container objects for content
   - References a specific content version via compose_id
   - Maintains relationships between content versions
   - Supports variations and branching

3. **patch_requests**: Manages proposed changes
   - Links to the composite being modified
   - Tracks old_version_id and new_version_id
   - Has status (pending, approved, rejected)
   - Contains metadata about the change

4. **json_patch_operations**: RFC 6902 operations
   - Each record is a single JSON Patch operation
   - Contains operation_type (add, remove, replace, move, copy)
   - Stores path, from_path, value, and old_value
   - Links to the patch_request_id

## 5. Database Processing

### Content Editing Flow

1. **Operation Receipt**: The database receives RFC 6902 operations from API:
   ```
   p_content_id: UUID of content to modify
   p_operations: Array of RFC 6902 operations
   p_user_id: User making the changes
   p_composite_id: Optional composite container ID
   p_create_variation: Whether to create a new variation
   ```

2. **Content and Schema Retrieval**:
   - The current content is retrieved from the `db` table
   - Content schema is fetched for validation
   - Schema restrictions are enforced

3. **Patch Operations Application**:
   - The `apply_json_patch` function applies operations to content
   - This creates a new document state without modifying the original

4. **Schema Validation**:
   - `validate_json_against_schema` validates the new state
   - Ensures document still conforms to the schema
   - Rejects invalid operations with detailed errors

5. **Patch Request Creation**:
   - Creates a new patch request record
   - Sets status to "pending"
   - Links to original content version

6. **Operation Storage**:
   - Each operation is stored in the `json_patch_operations` table
   - Operations include full path information and values
   - Original values are preserved for history/reverting

## 6. Approval Flow

1. **Review**: Users with appropriate permissions:
   - View pending patch requests in the UI
   - See each operation with clear before/after values
   - Decide to approve or reject

2. **Approval Process**:
   - `approve_patch_request` function handles approval
   - Creates a new content version by applying the operations
   - Updates composite to reference the new version
   - Updates patch request status to "approved"

3. **Frontend Update**:
   - UI refreshes to show the approved changes
   - Patch request appears in history with "approved" status

## 7. Variation and Branch Creation

1. **Creating Variations**:
   - Uses same operation-based approach
   - Creates a new composite that references new content
   - Establishes a "variation_of" relationship with parent

2. **Three-Way Merging**:
   - System supports merging variations using JSON Patch operations
   - Finds common ancestor between branches
   - Applies both sets of operations
   - Detects and resolves conflicts based on path and timing

## 8. Operation Types

Following RFC 6902, the system supports these operation types:

1. **Add**: Adds a value to an object or inserts into an array
   ```json
   { "op": "add", "path": "/metadata/tags/0", "value": "new-tag" }
   ```

2. **Remove**: Removes a value from an object or array
   ```json
   { "op": "remove", "path": "/metadata/tags/2" }
   ```

3. **Replace**: Replaces a value
   ```json
   { "op": "replace", "path": "/title", "value": "New Title" }
   ```

4. **Move**: Relocates a value from one path to another
   ```json
   { "op": "move", "from": "/metadata/oldTags/0", "path": "/metadata/newTags/0" }
   ```

5. **Copy**: Copies a value from one path to another
   ```json
   { "op": "copy", "from": "/metadata/tags/0", "path": "/content/title" }
   ```

## 9. Benefits of This Architecture

1. **Efficient Network Usage**: Only operations are transmitted, not entire documents
2. **Detailed Change Tracking**: Each atomic change is recorded and preserved
3. **Standard Compliance**: Uses RFC 6902 JSON Patch throughout the stack
4. **Rich Content Model**: TipTap/ProseMirror provides structured content editing
5. **Conflict Resolution**: Three-way merging with clear conflict identification
6. **Versioning**: Complete history of all content changes with operation details
7. **Collaboration**: Multiple users can work on the same content using branches
8. **Schema Validation**: Content always validated against its schema
9. **Performance**: Client-side diffing reduces server load 