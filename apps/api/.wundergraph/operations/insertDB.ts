import { createOperation, z } from "../generated/wundergraph.factory";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// Initialize Ajv with formats
const ajv = new Ajv();
addFormats(ajv);

function generateRandomSchema() {
  return {
    type: "object",
    schema_id: "00000000-0000-0000-0000-000000000001",
    title: `User Schema ${Math.floor(Math.random() * 10000)}`,
    description: `Schema for user profile data ${Math.random()}`,
    properties: {
      schema_id: {
        type: "string",
        format: "uuid",
        title: "Schema ID",
        description: "Reference to the schema this object conforms to"
      },
      username: {
        type: "string",
        title: "Username",
        description: "The user's chosen username",
        minLength: 3,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9_-]+$"
      },
      email: {
        type: "string",
        title: "Email",
        description: "The user's email address",
        format: "email"
      },
      profile: {
        type: "object",
        title: "User Profile",
        description: "Additional profile information",
        properties: {
          fullName: {
            type: "string",
            title: "Full Name",
            description: "The user's full name"
          },
          birthDate: {
            type: "string",
            title: "Birth Date",
            description: "The user's birth date",
            format: "date"
          }
        },
        required: ["fullName"]
      }
    },
    required: ["schema_id", "username", "email", "profile"]
  };
}

async function validateAgainstMetaSchema(schema: any, context: any) {
  // Fetch the meta schema from the database
  const { data: metaSchemaData, error: metaSchemaError } = await context.supabase
    .from("db")
    .select("json")
    .eq("id", "00000000-0000-0000-0000-000000000001")
    .single();

  if (metaSchemaError) {
    throw new Error("Failed to fetch meta schema: " + metaSchemaError.message);
  }

  const validate = ajv.compile(metaSchemaData.json);
  const valid = validate(schema);

  if (!valid) {
    throw new Error("Validation error: " + ajv.errorsText(validate.errors));
  }
}

export default createOperation.mutation({
  input: z.object({}),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ context, user }) => {
    try {
      if (!user?.customClaims?.id) {
        throw new Error("User not authenticated");
      }

      const randomSchema = generateRandomSchema();

      // Insert the schema with version and author
      const { data, error } = await context.supabase
        .from("db")
        .insert({
          json: randomSchema,
          author: user.customClaims.id,
          version: 1
        })
        .select();

      if (error) {
        throw new Error("Database insert error: " + error.message);
      }

      return {
        success: true,
        insertedData: data[0]
      };
    } catch (error) {
      console.error("Error in insertDB:", error);
      return {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
