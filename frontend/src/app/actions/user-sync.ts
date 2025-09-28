'use server';

import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Server action to synchronize the current Clerk user with Supabase
 * This ensures the user exists in Supabase before they interact with the app
 * @returns The synchronized user data or null if no user is logged in
 */
export async function syncUserWithDatabase() {
  // Get the current Clerk user
  const clerkUser = await currentUser();

  // If no user is logged in, return null
  if (!clerkUser) {
    return null;
  }

  try {
    // Connect to Supabase
    const supabase = await createClient();

    // Check if the user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("sub", clerkUser.id)
      .single();

    // If there was an error checking for the user that is NOT a "not found" error
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking for user:", fetchError);
      throw new Error(`Failed to check if user exists: ${fetchError.message}`);
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          sub: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
        })
        .select();

      if (insertError) {
        console.error("Error creating user:", insertError);
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      console.log("User synchronized successfully (created new)");
      return newUser[0];
    }

    console.log("User already exists in database");
    return existingUser;
  } catch (error) {
    console.error("Unexpected error during user synchronization:", error);
    // Re-throw to allow handling by the caller
    throw error;
  }
}