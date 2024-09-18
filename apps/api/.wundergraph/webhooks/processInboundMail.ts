import { createWebhook } from "../generated/wundergraph.webhooks";

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

    console.log(
      "Input for saveMail operation:",
      JSON.stringify(input, null, 2)
    );

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
