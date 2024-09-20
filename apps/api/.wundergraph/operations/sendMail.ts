import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  handler: async ({ user, input, context }) => {
    if (!user || !user.email) {
      return {
        success: false,
        message: "User not authenticated or email not available",
      };
    }

    try {
      const response = await context.postmark.sendEmail({
        From: "hello@visioncreator.earth",
        To: user.email,
        Cc: "hello@visioncreator.earth",
        Subject: input.subject,
        TextBody: input.body,
        HtmlBody: `<html><body><h1>${input.subject}</h1><p>${input.body}</p></body></html>`,
      });

      return {
        success: true,
        message: "Email sent successfully",
        messageId: response.MessageID,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        message: "Failed to send email",
        error: error.message || "An unknown error occurred",
      };
    }
  },
});
