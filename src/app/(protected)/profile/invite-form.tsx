"use client";

import { inviteServant } from "./actions";
import { useActionState } from "react";

export function InviteServantForm() {
  const [state, formAction, pending] = useActionState(inviteServant, null);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Invite New Servant
      </h2>
      {state?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}
      {state?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{state.success}</p>
        </div>
      )}
      <form action={formAction} className="flex gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Enter email address"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 disabled:opacity-50 whitespace-nowrap"
        >
          {pending ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="mt-2 text-xs text-gray-500">
        The new account will be created with a temporary password. The user
        should change it after first login.
      </p>
    </div>
  );
}
