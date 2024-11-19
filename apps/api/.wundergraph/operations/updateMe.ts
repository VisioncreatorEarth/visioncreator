import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    name: z.string(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, input, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    // Check if the user is the admin user
    if (user.customClaims.id === "00000000-0000-0000-0000-000000000001") {
      return {
        success: false,
        message: "Admin user cannot be updated.",
      };
    }

    // Generate a random name if no name was provided, if it's less than 4 characters, or if it's more than 20 characters
    if (!input.name || input.name.length < 3 || input.name.length > 20) {
      const adjectives = [
        "Sparkling",
        "Lucky",
        "Smooth",
        "Dreamy",
        "Bright",
        "Shining",
        "Joyful",
        "Lively",
        "Charming",
        "Playful",
        "Glowing",
        "Happy",
        "Brilliant",
        "Energetic",
        "Alluring",
        "Cheerful",
        "Elegant",
        "Fancy",
        "Peaceful",
        "Fascinating",
      ];
      const animals = [
        "Anteater",
        "Whale",
        "Salamander",
        "Kangaroo",
        "Duckbill",
        "Giraffe",
        "Monkey",
        "Beaver",
        "Wildcat",
        "Elephant",
        "Aardvark",
        "Raccoon",
        "Porcupine",
        "Manatee",
        "Parrot",
        "Monkey",
        "Koala",
        "Toucan",
        "Koala",
        "Fox",
      ];
      const randomAdjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      input.name = `${randomAdjective}${randomAnimal}`;
    }

    const retryCount = 3;
    let attempt = 0;
    let success = false;
    let data, error;

    while (attempt < retryCount && !success) {
      attempt++;
      try {
        const { data: updateData, error: updateError } = await context.supabase
          .from("profiles")
          .update({ name: input.name, active: true })
          .eq("id", user.customClaims.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Attempt ${attempt} - Error: ${updateError.message}`);
          error = updateError;
        } else {
          data = updateData;
          success = true;
        }
      } catch (err) {
        console.error(`Attempt ${attempt} - Unexpected error: ${err.message}`);
        error = err;
      }

      if (!success && attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!success) {
      return {
        success: false,
        message:
          error.message || "Failed to update user after multiple attempts.",
      };
    }

    if (!data) {
      return {
        success: false,
        message: "No user found or no changes made.",
      };
    }

    console.log("Name and active status updated successfully!");
    return {
      success: true,
      message: `Your profile has been successfully updated to ${input.name}!`,
      data,
    };
  },
});
