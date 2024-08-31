import { createOperation } from "../generated/wundergraph.factory";

export default createOperation.mutation({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async () => {
    console.log("test was called");

    return "It works!";
  },
});
