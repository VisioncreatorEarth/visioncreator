import { createOperation } from "../generated/wundergraph.factory";

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["admin"],
  },
  handler: async ({ context }) => {
    try {
      console.log("Executing queryDB operation");

      const { data, error } = await context.supabase.from("db").select("*");

      if (error) {
        console.error("Error fetching data from db:", error);
        throw new Error("Failed to fetch data from db");
      }

      console.log("Raw data from db:", data);

      const parsedData = data.map((item) => ({
        ...item,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
      }));

      console.log("Parsed data:", parsedData);

      return { db: parsedData };
    } catch (error) {
      console.error("Error in queryDB:", error);
      throw error;
    }
  },
});
