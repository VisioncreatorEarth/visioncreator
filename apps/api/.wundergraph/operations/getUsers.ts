import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
    input: z.object({}),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context }) => {
        // For now, return mocked users
        const mockedUsers = [
            { id: "user-1", name: "John Admin" },
            { id: "user-2", name: "Alice Developer" },
            { id: "user-3", name: "Bob User" },
            { id: "user-4", name: "Carol Tester" },
            { id: "user-5", name: "Dave Manager" },
        ];

        return { users: mockedUsers };
    },
}); 