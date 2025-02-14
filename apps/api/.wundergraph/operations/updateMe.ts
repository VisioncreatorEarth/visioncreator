import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    name: z.string().nullable().optional(),
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
      console.log('Admin user detected, blocking profile update');
      return {
        success: false,
        message: "Admin user cannot be updated.",
      };
    }

    // First, check if profile exists
    const { data: existingProfile } = await context.supabase
      .from("profiles")
      .select("name")
      .eq("id", user.customClaims.id)
      .single();



    // Helper function to generate random animal name
    function generateRandomName() {
      const adjectives = [
        "Sparkling", "Lucky", "Smooth", "Dreamy", "Bright",
        "Shining", "Joyful", "Lively", "Charming", "Playful",
        "Glowing", "Happy", "Brilliant", "Energetic", "Alluring",
        "Cheerful", "Elegant", "Fancy", "Peaceful", "Fascinating",
        "Swift", "Gentle", "Clever", "Mighty", "Brave"
      ];
      const animals = [
        "Anteater", "Whale", "Salamander", "Kangaroo", "Duckbill",
        "Giraffe", "Monkey", "Beaver", "Wildcat", "Elephant",
        "Aardvark", "Raccoon", "Porcupine", "Manatee", "Parrot",
        "Tiger", "Koala", "Toucan", "Dolphin", "Fox",
        "Lion", "Panda", "Eagle", "Wolf", "Bear"
      ];
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      const name = `${randomAdjective}${randomAnimal}`;
      return name;
    }

    // Use provided name if valid, otherwise generate random animal name
    let nameToUpdate;
    if (input.name?.trim()) {
      nameToUpdate = input.name.trim();
    } else {
      nameToUpdate = generateRandomName();
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
          .update({ name: nameToUpdate, active: true })
          .eq("id", user.customClaims.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Profile update error on attempt ${attempt}:`, updateError);
          error = updateError;
        } else {
          data = updateData;
          success = true;
        }
      } catch (err) {
        console.error(`Unexpected error on attempt ${attempt}:`, err);
        error = err;
      }

      if (!success && attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!success) {
      console.error('All profile update attempts failed:', {
        userId: user.customClaims.id,
        error
      });
      return {
        success: false,
        message: error.message || "Failed to update profile after multiple attempts.",
      };
    }

    if (!data) {
      console.error('No profile data returned after successful update');
      return {
        success: false,
        message: "No profile found or no changes made.",
      };
    }

    return {
      success: true,
      message: `Profile updated to ${nameToUpdate}!`,
      data,
    };
  },
});
