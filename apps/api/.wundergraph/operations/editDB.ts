import { createOperation, z } from '../../generated/wundergraph.factory';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export default createOperation.mutation({
    input: z.object({
        id: z.string(),
        json: z.any(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, operations }) => {
        try {
            // First get the current record to archive
            const currentRecord = await operations.query({
                operationName: 'queryDB',
                input: { id: input.id }
            });

            if (!currentRecord?.data?.db?.[0]) {
                return {
                    success: false,
                    details: 'Record not found'
                };
            }

            const record = currentRecord.data.db[0];

            // Get the schema if it exists
            if (record.schema) {
                const schemaResult = await operations.query({
                    operationName: 'queryDB',
                    input: { id: record.schema }
                });

                const schema = schemaResult?.data?.db?.[0]?.json;
                if (schema) {
                    // Validate against schema
                    const validate = ajv.compile(schema);
                    const valid = validate(input.json);

                    if (!valid) {
                        return {
                            success: false,
                            details: `Schema validation failed: ${ajv.errorsText(validate.errors)}`
                        };
                    }
                }
            }

            // Archive current version
            const archiveResult = await operations.mutation({
                operationName: 'archiveDB',
                input: { id: record.id }
            });

            if (!archiveResult?.data?.archive_db?.[0]) {
                return {
                    success: false,
                    details: 'Failed to archive current version'
                };
            }

            // Create new version
            const insertResult = await operations.mutation({
                operationName: 'insertDB',
                input: {
                    json: input.json,
                    author: record.author,
                    schema: record.schema,
                    version: record.version + 1,
                    variation: record.variation,
                    prev: record.id
                }
            });

            if (!insertResult?.data?.insert_db?.[0]) {
                return {
                    success: false,
                    details: 'Failed to create new version'
                };
            }

            return {
                success: true,
                details: 'Successfully updated record'
            };
        } catch (error) {
            console.error("Error in editDB:", error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    },
}); 