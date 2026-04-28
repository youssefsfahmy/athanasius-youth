"use client";

import { createOrUpdateProfile } from "./actions";
import { useActionState } from "react";
import LoadingOverlay from "@/components/loading-overlay";

export function ProfileForm({
  defaultName,
  defaultFamilyGroup,
  email,
  createdAt,
}: {
  defaultName: string;
  defaultFamilyGroup: string;
  email: string;
  createdAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createOrUpdateProfile,
    null,
  );

  return (
    <>
      {pending && <LoadingOverlay message="Saving profile..." />}
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg">
        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={defaultName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label
              htmlFor="family_group"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Family Group
            </label>
            <input
              id="family_group"
              name="family_group"
              type="text"
              defaultValue={defaultFamilyGroup}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the family group you're responsible for"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-sm text-gray-500">{email}</p>
          </div>

          {createdAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <p className="text-sm text-gray-500">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {pending
              ? "Saving..."
              : defaultName
                ? "Update Profile"
                : "Create Profile"}
          </button>
        </form>
      </div>
    </>
  );
}
