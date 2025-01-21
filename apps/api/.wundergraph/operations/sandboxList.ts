// import { createOperation } from "../generated/wundergraph.factory";

// export default createOperation.query({
//     requireAuthentication: true,
//     rbac: {
//         requireMatchAll: ["authenticated", "admin"],
//     },
//     handler: async ({ context }) => {
//         try {
//             const sandboxes = await context.sandbox.listSandboxes();
//             return {
//                 success: true,
//                 sandboxes
//             };
//         } catch (error) {
//             console.error('❌ Error listing sandboxes:', error);
//             return {
//                 success: false,
//                 error: error instanceof Error ? error.message : String(error),
//                 sandboxes: []
//             };
//         }
//     },
// });
