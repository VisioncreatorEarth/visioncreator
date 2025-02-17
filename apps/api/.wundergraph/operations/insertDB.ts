import { createOperation, z } from "../generated/wundergraph.factory";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

// IMPORTANT !!! IMPORTANT !!! IMPORTANT
// Please always exchange the $cid of our schema $id with the generated one from our db, when udpating the metaschema.
// IMPORTANT !!! IMPORTANT !!! IMPORTANT

const metaSchema = {
  $id: "https://alpha.ipfs.homin.io/QmPSYA3hz2HEpWgai9DkcM2YG5Yf17WBgbYeYYtF8duqF8",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "Meta Schema",
  description: "A schema for defining other schemas",
  properties: {
    $id: {
      type: "string",
      format: "uri",
      description: "The unique identifier for this schema",
    },
    $schema: {
      type: "string",
      format: "uri",
      description: "The JSON Schema version being used",
    },
    type: {
      type: "string",
      enum: [
        "object",
        "array",
        "string",
        "number",
        "integer",
        "boolean",
        "null",
      ],
      description: "The type of the schema",
    },
    author: {
      type: "string",
      description: "The author of the schema",
    },
    prev: {
      type: ["string", "null"],
      format: "uri",
      description: "The previous version of this schema, if any",
    },
    version: {
      type: "integer",
      minimum: 0,
      description: "The version number of this schema",
    },
    title: {
      type: "string",
      description: "The title of the schema",
    },
    description: {
      type: "string",
      description: "A description of the schema",
    },
    properties: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          type: {
            type: ["string", "array"],
            items: {
              type: "string",
              enum: [
                "object",
                "array",
                "string",
                "number",
                "integer",
                "boolean",
                "null",
              ],
            },
            minItems: 1,
            uniqueItems: true,
          },
          title: { type: "string" },
          description: { type: "string" },
          minimum: { type: "number" },
          maximum: { type: "number" },
          pattern: { type: "string" },
          properties: { $ref: "#/properties/properties" },
          required: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        required: ["type", "title", "description"],
      },
    },
    required: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
      description: "The required properties for this schema",
    },
    additionalProperties: {
      type: "boolean",
      description: "Whether additional properties are allowed",
    },
  },
  required: [
    "$schema",
    "$id",
    "prev",
    "author",
    "version",
    "title",
    "description",
    "properties",
    "required",
  ],
  additionalProperties: false,
};

function generateRandomSchema() {
  return {
    type: "object",
    schema_id: "00000000-0000-0000-0000-000000000001", // References root meta schema
    title: `User Schema ${Math.floor(Math.random() * 10000)}`,
    description: `Schema for user profile data ${Math.random()}`,
    version: 1,
    author: "HominioAlpha",
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

async function insertSchema(context, operations, schema, isMetaSchema = false) {
  const calcCIDResult = await operations.mutate({
    operationName: "calculateCID",
    input: { json: schema },
  });

  if (!calcCIDResult.data?.success) {
    throw new Error(
      "Failed to calculate CID: " +
      (calcCIDResult.data?.error || "Unknown error")
    );
  }

  const schemaWithId = calcCIDResult.data.json;

  if (!isMetaSchema) {
    const validate = ajv.compile(metaSchema);
    const valid = validate(schemaWithId);

    if (!valid) {
      throw new Error("Validation error: " + ajv.errorsText(validate.errors));
    }
  } else {
    // For metaSchema, we'll just validate it as a valid JSON Schema
    try {
      ajv.compile(schemaWithId);
    } catch (error) {
      throw new Error("Invalid JSON Schema: " + error.message);
    }
  }

  const { data, error } = await context.supabase
    .from("db")
    .insert({ json: schemaWithId })
    .select();

  if (error) {
    throw new Error("Database insert error: " + error.message);
  }

  return data[0];
}

export default createOperation.mutation({
  input: z.object({}),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["admin"],
  },
  handler: async ({ context }) => {
    try {
      const randomSchema = generateRandomSchema();

      // Insert the schema and get its ID
      const { data, error } = await context.supabase
        .from("db")
        .insert({ json: randomSchema })
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
