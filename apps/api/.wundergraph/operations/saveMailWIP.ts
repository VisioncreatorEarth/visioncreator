// import { createOperation, z } from "../generated/wundergraph.factory";

// const RecipientSchema = z.object({
//   email: z.string().email(),
//   name: z.string().optional(),
// });

// const AttachmentSchema = z.object({
//   name: z.string(),
//   contentType: z.string(),
//   contentLength: z.number(),
// });

// const MailPayload = z.object({
//   from: RecipientSchema,
//   to: z.array(RecipientSchema),
//   cc: z.array(RecipientSchema).optional(),
//   bcc: z.array(RecipientSchema).optional(),
//   subject: z.string(),
//   textBody: z.string(),
//   htmlBody: z.string().optional(),
//   date: z.string(),
//   messageId: z.string(),
//   attachments: z.array(AttachmentSchema).optional(),
// });

// export default createOperation.mutation({
//   input: MailPayload,
//   handler: async ({ input, context }) => {
//     console.log("Received input in saveMail");

//     const mailForIngest = {
//       from_email: input.from.email,
//       from_name: input.from.name,
//       to_recipients: input.to,
//       cc_recipients: input.cc || null,
//       bcc_recipients: input.bcc || null,
//       subject: input.subject,
//       text_body: input.textBody,
//       html_body: input.htmlBody || null,
//       received_at: new Date(input.date).toISOString(),
//       message_id: input.messageId,
//       attachments: input.attachments || null,
//     };

//     console.log("Prepared mail for Supabase ingest");

//     try {
//       const { data, error } = await context.supabase
//         .from("mails")
//         .insert(mailForIngest)
//         .select();

//       if (error) {
//         console.error("Error inserting mail into Supabase:", error);
//         throw new Error("Failed to save mail to database");
//       }

//       console.log("Mail saved successfully");

//       return {
//         success: true,
//         message: "Mail saved to database",
//         savedMail: data[0],
//       };
//     } catch (error) {
//       console.error("Error in saveMail operation:", error);
//       return {
//         success: false,
//         message: "Failed to save mail to database",
//         error: error.message,
//       };
//     }
//   },
// });
