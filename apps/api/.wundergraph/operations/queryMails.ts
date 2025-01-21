import { createOperation, z } from "../generated/wundergraph.factory";

const MailSchema = z.object({
  id: z.string(),
  from_email: z.string(),
  subject: z.string(),
  text_body: z.string(),
  received_at: z.string(),
});

export default createOperation.query({
  input: z.object({
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ input, context }) => {
    const { data, error } = await context.supabase
      .from("mails")
      .select("id, from_email, subject, text_body, received_at")
      .order("received_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (error) {
      console.error("Error fetching mails:", error);
      throw new Error("Failed to fetch mails");
    }

    const validatedMails = z.array(MailSchema).safeParse(data);

    if (!validatedMails.success) {
      console.error("Data validation error:", validatedMails.error);
      throw new Error("Data validation failed");
    }

    return {
      mails: validatedMails.data,
    };
  },
});
