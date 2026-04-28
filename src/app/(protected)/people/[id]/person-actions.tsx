"use client";

import { useState } from "react";
import { deletePerson } from "../actions";

export default function PersonActions({ personId }: { personId: string }) {
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await deletePerson(personId);
  }

  return (
    <div className="flex gap-2">
      <a
        href={`/people/${personId}/edit`}
        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
      >
        Edit
      </a>
      {confirming ? (
        <div className="flex gap-1">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            Confirm Delete
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
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
  );
}
