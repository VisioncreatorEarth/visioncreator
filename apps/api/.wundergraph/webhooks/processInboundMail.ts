import { createWebhook } from "../generated/wundergraph.webhooks";

const WEBHOOK_USERNAME = process.env.POSTMARK_WEBHOOK_USERNAME;
const WEBHOOK_PASSWORD = process.env.POSTMARK_WEBHOOK_PASSWORD;

interface PostmarkPayload {
  FromFull: {
    Email: string;
    Name: string;
  };
  ToFull: Array<{
    Email: string;
    Name: string;
    MailboxHash: string;
  }>;
  CcFull?: Array<{
    Email: string;
    Name: string;
    MailboxHash: string;
  }>;
  BccFull?: Array<{
    Email: string;
    Name: string;
    MailboxHash: string;
  }>;
  Subject: string;
  MessageID: string;
  Date: string;
  TextBody: string;
  HtmlBody: string;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentLength: number;
  }>;
}

export default createWebhook({
  handler: async (event, context) => {
    console.log("Received webhook request");

    // Basic authentication check
    const authHeader =
      event.headers["authorization"] || event.headers["Authorization"];
    if (!authHeader) {
      console.log("Authorization header is missing");
      return {
        statusCode: 401,
        body: { message: "Unauthorized: Authorization header is missing" },
      };
    }

    const [authType, authValue] = authHeader.split(" ");
    if (authType.toLowerCase() !== "basic") {
      console.log("Authorization type is not Basic");
      return {
        statusCode: 401,
        body: { message: "Unauthorized: Authorization type must be Basic" },
      };
    }

    const [username, password] = Buffer.from(authValue, "base64")
      .toString()
      .split(":");
    if (username !== WEBHOOK_USERNAME || password !== WEBHOOK_PASSWORD) {
      console.log("Invalid credentials");
      return {
        statusCode: 401,
        body: { message: "Unauthorized: Invalid credentials" },
      };
    }

    console.log("Authentication successful");

    // If authentication passes, proceed with processing the payload
    const payload = event.body as PostmarkPayload;

    console.log("Received inbound email:");
    console.log("From:", payload.FromFull.Email);
    console.log("Subject:", payload.Subject);
    console.log("Text Body:", payload.TextBody);

    const input = {
      from: {
        email: payload.FromFull.Email,
        name: payload.FromFull.Name,
      },
      to: payload.ToFull.map((recipient) => ({
        email: recipient.Email,
        name: recipient.Name,
      })),
      cc: payload.CcFull?.map((recipient) => ({
        email: recipient.Email,
        name: recipient.Name,
      })),
      bcc: payload.BccFull?.map((recipient) => ({
        email: recipient.Email,
        name: recipient.Name,
      })),
      subject: payload.Subject,
      textBody: payload.TextBody,
      htmlBody: payload.HtmlBody,
      date: payload.Date,
      messageId: payload.MessageID,
      attachments: payload.Attachments?.map((att) => ({
        name: att.Name,
        contentType: att.ContentType,
        contentLength: att.ContentLength,
      })),
    };

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
