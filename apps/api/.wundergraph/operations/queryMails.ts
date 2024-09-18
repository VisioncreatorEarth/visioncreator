import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
  input: z.object({
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
  }),
  handler: async ({ input, context }) => {
    const { data, error } = await context.supabase
      .from("mails")
      .select("*")
      .order("received_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (error) {
      console.error("Error fetching mails:", error);
      throw new Error("Failed to fetch mails");
    }

    return {
      mails: data,
    };
  },
});
