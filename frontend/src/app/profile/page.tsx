import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import React from "react";
import { redirect } from "next/navigation";
import ProfileSummary from "./_components/ProfileSummary";
import ProfileForm from "./_components/ProfileForm";
import { syncUserWithDatabase } from "../actions/user-sync";

export const metadata = {
  title: "Profile | FluenceAI",
  description: "Manage your student profile and learning preferences",
};

export default async function Page() {
  // Get the current user from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  // Connect to Supabase
  const supabase = await createClient();
  
  let userData = null;
  let studentProfile = null;
  
  try {
    // Use server action to ensure user exists in database
    userData = await syncUserWithDatabase();
    
    if (!userData) {
      // This shouldn't happen since we checked for clerkUser above, but just in case
      redirect("/");
    }
    
    // Fetch the student profile for this user
    const { data: profileData, error: profileError } = await supabase
      .from("student_profile")
      .select("*")
      .eq("user_id", userData.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching student profile:", profileError);
    }
    
    studentProfile = profileData;
  } catch (error) {
    console.error("Error loading profile:", error);
    
    // Show appropriate error message based on the error type
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If there's a database setup issue
    if (errorMessage.includes("does not exist") || errorMessage.includes("PGRST205")) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Database Setup Required</h1>
            <p className="mb-4">It seems like the Supabase database tables have not been set up properly.</p>
            <p className="mb-2">Please make sure to:</p>
            <ol className="list-decimal list-inside mb-6 pl-4 space-y-2">
              <li>Create the &quot;users&quot; table in your Supabase database</li>
              <li>Create the &quot;student_profile&quot; table</li>
              <li>Ensure proper permissions are set</li>
            </ol>
            <p className="text-sm text-gray-600">Error details: {errorMessage}</p>
          </div>
        </div>
      );
    }
    
    // For other errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Profile Error</h1>
          <p className="mb-4">There was an error loading your profile data.</p>
          <p className="text-sm text-gray-600">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your profile information and learning preferences
          </p>
        </div>

        {/* Profile Summary */}
        <ProfileSummary user={userData} studentProfile={studentProfile} />

        {/* Profile Form */}
        <ProfileForm user={userData} studentProfile={studentProfile} />
      </div>
    </div>
  );
}