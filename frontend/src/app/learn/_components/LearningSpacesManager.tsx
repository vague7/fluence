"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateSpaceButton from "./CreateSpaceButton";
import LearningSpacesList from "./LearningSpacesList";
import {
  createLearningSpaceAction,
  deleteLearningSpaceAction,
  invokeAgentWorkflow,
  uploadSourceFileAction,
} from "../actions/learning-space";
import { UUID } from "crypto";

interface LearningSpace {
  learning_space_id: number;
  topic: string;
  description?: string;
  created_at: string;
  user_id: UUID;
}

interface LearningSpacesManagerProps {
  userId: UUID;
  initialSpaces: LearningSpace[];
}

export default function LearningSpacesManager({
  userId,
  initialSpaces,
}: LearningSpacesManagerProps) {
  const [spaces, setSpaces] = useState<LearningSpace[]>(initialSpaces);
  const router = useRouter();

  const handleCreateSpace = async (spaceData: {
    topic: string;
    pdfFile?: File | null;
    audioFile?: File | null;
  }) => {
    try {
      let pdfSource: string | null = null;
      if (spaceData.pdfFile) {
        const response = await uploadSourceFileAction(
          spaceData.pdfFile,
          userId,
          spaceData.topic
        );

        if (response.error) {
          throw new Error("Failed to upload PDF file");
        }
        // You can handle the response data if needed
        pdfSource = response.publicUrl || null;
      }

      const response = await createLearningSpaceAction(
        spaceData.topic,
        userId,
        pdfSource
      );

      // Check if response has data and id before proceeding
      if (response.success && response.data) {
        console.log("Learning space created successfully:", response.data);

        // Add this: Call the agent workflow
        const workflowResult = await invokeAgentWorkflow(
          response.data.learning_space_id, // Use the correct ID field
          userId
        );

        if (workflowResult.error) {
          console.error("Error invoking agent workflow:", workflowResult.error);
        } else {
          console.log("Agent workflow invoked successfully:", workflowResult);
        }

        // Now navigate to the learning space
        router.push(`/learn/${response.data.learning_space_id}`);
      } else {
        console.error("Failed to create learning space:", response.error);
        alert("Failed to create learning space. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleCreateSpace:", error);
      alert("An error occurred while creating the learning space.");
    }
  };

  const handleSpaceClick = (spaceId: number) => {
    router.push(`/learn/${spaceId}`);
  };

  const handleDeleteSpace = async (spaceId: number) => {
    if (
      confirm(
        "Are you sure you want to delete this learning space? This action cannot be undone."
      )
    ) {
      try {
        const result = await deleteLearningSpaceAction(spaceId, userId);

        if (result.success) {
          // Remove the deleted space from the state
          setSpaces((prevSpaces) =>
            prevSpaces.filter((space) => space.learning_space_id !== spaceId)
          );
          console.log("Learning space deleted successfully");
        } else {
          console.error("Failed to delete learning space:", result.error);
          alert("Failed to delete the learning space. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting learning space:", error);
        alert("An error occurred while deleting the learning space.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Learning Spaces
            </h1>
            <p className="text-gray-600">
              Create dedicated spaces for different topics and track your
              learning progress.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <CreateSpaceButton onCreateSpace={handleCreateSpace} />
          </div>
        </div>

        {/* Learning Spaces List */}
        <LearningSpacesList
          spaces={spaces}
          onSpaceClick={handleSpaceClick}
          onDeleteSpace={handleDeleteSpace}
        />
      </div>
    </div>
  );
}
