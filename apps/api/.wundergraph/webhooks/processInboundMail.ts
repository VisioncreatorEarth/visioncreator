import { createWebhook } from "../generated/wundergraph.webhooks";

// Hardcoded credentials (replace these with secure values in production)
const WEBHOOK_USERNAME = "postmark";
const WEBHOOK_PASSWORD = "your_secure_password_here";

interface PostmarkPayload {
  // ... (keep the existing interface)
}

export default createWebhook({
  handler: async (event, context) => {
    // Basic authentication check
    const authHeader =
      event.headers["authorization"] || event.headers["Authorization"];
    if (!authHeader) {
      return {
        statusCode: 401,
        body: { message: "Authorization header is missing" },
      };
    }

    const [authType, authValue] = authHeader.split(" ");
    if (authType.toLowerCase() !== "basic") {
      return {
        statusCode: 401,
        body: { message: "Authorization type must be Basic" },
      };
    }

    const [username, password] = Buffer.from(authValue, "base64")
      .toString()
      .split(":");
    if (username !== WEBHOOK_USERNAME || password !== WEBHOOK_PASSWORD) {
      return {
        statusCode: 401,
        body: { message: "Invalid credentials" },
      };
    }

    // If authentication passes, proceed with the existing logic
    const payload = event.body as PostmarkPayload;

    console.log("Received inbound email:");
    console.log("From:", payload.FromFull.Email);
    console.log("Subject:", payload.Subject);
    console.log("Text Body:", payload.TextBody);

    // ... (keep the rest of the existing code)

    try {
      const result = await context.operations.mutate({
        operationName: "saveMail",
        input: input,
      });

      console.log("saveMail operation result:", result);

      return {
        statusCode: 200,
        body: {
          message: "Inbound email processed and saved successfully",
          sender: payload.FromFull.Email,
          subject: payload.Subject,
        },
      };
    } catch (error) {
      console.error("Error processing inbound email:", error);
      return {
        statusCode: 500,
        body: {
          message: "Error processing inbound email",
          error: error.message,
        },
      };
    }
  },
});
