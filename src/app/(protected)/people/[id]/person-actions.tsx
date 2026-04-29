"use client";

import { useState } from "react";
import { deletePerson } from "../actions";
import LoadingOverlay from "@/components/loading-overlay";
import Link from "next/link";

export default function PersonActions({ personId }: { personId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePerson(personId);
    } catch {
      // redirect() throws — keep loading visible during navigation
    }
  }

  return (
    <>
      {deleting && <LoadingOverlay message="Deleting person..." />}
      <div className="flex gap-2">
        <Link
          href={`/people/${personId}/edit`}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
        >
          Edit
        </Link>
        {confirming ? (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100"
          >
            Delete
          </button>
        )}
      </div>
    </>
  );
}
