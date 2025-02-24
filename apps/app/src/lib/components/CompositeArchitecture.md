# VisionCreator Platform: Version Control Architecture

## System Overview

The VisionCreator Platform implements a sophisticated version control system that combines concepts from Git, database versioning, and collaborative editing workflows. The system allows for content creation, versioning, collaborative editing, and governance through a proposal and approval process.

## Core Components

### 1. Content Storage and Versioning System

The platform uses a dual-table approach to version management:

- **Active Content (`db` table)**: Stores current versions of content
- **Archive (`db_archive` table)**: Stores historical versions when content is updated
- **Version History**: Maintains links between versions via the `prev` field

```
Current Version (db) → Previous Version (db_archive) → Earlier Version (db_archive)
```

When content is updated, the current version is archived, and a new version becomes the active one. This creates an immutable history of all changes.

### 2. Composites System

Composites provide a layer of metadata and organization above the raw content:

- **Composites**: Associate content versions with metadata (title, description, author)
- **Composite Relationships**: Define connections between composites (variations, forks, etc.)
- **Proposals**: Can reference composites as their content container

This structure allows for:
- Multiple variations of the same content
- Hierarchical relationships between content
- Metadata for improved searchability and organization

### 3. Patch Request System

The platform implements a Git-like pull request system for content changes:

- **Patch Requests**: Track proposed changes between versions
- **Approval Workflow**: Changes must be approved before becoming the current version
- **Automated Generation**: Created automatically when content is updated

### 4. Operation-Based Tracking System

The platform now implements a Yjs-like operation-based tracking system for granular changes:

- **DB Operations**: Track individual property changes (add, remove, replace, etc.)
- **Granular Tracking**: Each property change is recorded separately
- **Conflict Detection**: Enables detection and resolution of concurrent edits
- **Automatic Merging**: Supports automatic merging of non-conflicting changes

This approach provides:
- Better concurrent editing capabilities
- More precise conflict detection and resolution
- Improved visualization of changes
- Support for selective application of changes

## Key Workflows

### 1. Content Creation and Editing

1. User edits content through the UI
2. The `editDB.ts` operation validates content against its schema
3. The `update_db_version` database function:
   - Creates a new version in the `db` table
   - Archives the old version in `db_archive`
   - Maintains version links
4. The `generate_operations_from_diff` function:
   - Analyzes the differences between old and new versions
   - Creates individual operations for each property change
   - Associates operations with the patch request
5. A patch request is automatically generated
6. Reviewers can approve or reject the change

### 2. Patch Request Management

1. Reviewers view pending patch requests in the `EditRequests` component
2. They can see individual operations that make up the change
3. When approved:
   - The composite is updated to point to the new version
   - The patch request is marked as approved
4. When rejected:
   - The composite keeps pointing to the current version
   - The patch request is marked as rejected

### 3. Composite Variations Management

Users can create and manage variations of content:

1. Content can have multiple variations (designs, visions, alternatives)
2. Relationships track connections between variations
3. The UI allows switching between variations
4. Each variation has its own version history and patch requests

### 4. Concurrent Editing and Conflict Resolution

The operation-based approach enables better handling of concurrent edits:

1. Multiple users can edit the same content simultaneously
2. Changes are tracked at the property level
3. Non-conflicting changes can be automatically merged
4. Conflicts are detected and presented for manual resolution
5. The `detect_operation_conflicts` function identifies conflicts between operations

## Technical Implementation

### Database Schema

The system uses several interconnected tables:

- **`db` and `db_archive`**: Store content versions with JSON data
- **`composites`**: Associate content with metadata
- **`composite_relationships`**: Define connections between composites
- **`patch_requests`**: Track proposed changes between versions
- **`db_operations`**: Store granular operations for each property change

### Database Functions

- **`update_db_version`**: Creates a new version and archives the old one
- **`generate_patch_request`**: Creates patch requests for version changes
- **`generate_operations_from_diff`**: Creates granular operations for each property change
- **`approve_patch_request`**: Updates composites to point to new versions when approved
- **`reject_patch_request`**: Marks patch requests as rejected
- **`apply_operations`**: Applies a set of operations to a JSON object
- **`detect_operation_conflicts`**: Identifies conflicts between operations

### API Layer

WunderGraph operations provide:

- **Content Manipulation**: `editDB.ts` handles content updates with validation
- **Data Fetching**: `queryComposeProposal.ts` and `queryPatchRequests.ts` fetch related data
- **Patch Management**: Operations to approve/reject patch requests

### UI Components

Svelte components provide a user interface:

- **`ComposeProposal.svelte`**: Main interface for viewing and editing composites
- **`EditRequests.svelte`**: Interface for managing patch requests and viewing operations
- **`JsonEditor.svelte`**: Component for editing JSON content

## Schema Validation

The system uses JSON Schema validation:

1. All content must conform to its schema
2. Schemas themselves are stored in the system
3. Special handling exists for schema updates
4. Validation occurs before any content changes are accepted

## Example Flow: Editing Content and Approving Changes

1. User selects a composite to edit in the `ComposeProposal` component
2. User makes changes and clicks "Save"
3. The `editDB` operation validates the content and creates a new version
4. The old version is archived, and a new version becomes active
5. Individual operations are generated for each property change
6. A patch request is automatically generated
7. Reviewers see the pending request in the `EditRequests` component
8. Reviewers can expand to see individual operations
9. Reviewer approves the request
10. The composite is updated to point to the new version

## Special Considerations

- **Schema Updates**: Have special validation against the meta-schema
- **Archived Content**: When editing archived content, a new clone is created first
- **Relationships**: Content can have complex relationships with related content
- **UI Integration**: Components work together to provide a seamless experience
- **Concurrent Edits**: The operation-based approach enables better handling of concurrent edits

## Database Schema Details

### Master DB Schema

The core schema includes:
- `db` table for active content versions
- `db_archive` table for historical versions
- Self-referential constraints for schema validation
- Functions for version handling and validation

### Proposal Composer

The proposal composer extends the system with:
- `composites` table for content metadata
- `composite_relationships` for content connections
- Integration with the proposals system
- Example data for markdown content

### Patch Requests

The patch requests system adds:
- `patch_requests` table for change tracking
- Triggers for automatic patch request generation
- Functions for approval and rejection
- Indexes for performance optimization

### DB Operations

The operations system adds:
- `db_operations` table for granular change tracking
- Support for different operation types (add, remove, replace, etc.)
- Functions for generating operations from diffs
- Functions for applying operations and detecting conflicts
