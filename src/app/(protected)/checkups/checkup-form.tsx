"use client";

import { useState, useRef, useEffect } from "react";
import { createCheckup, updatePersonInfo } from "./actions";
import LoadingOverlay from "@/components/loading-overlay";
import Link from "next/link";
import PersonForm from "@/components/person-form";
import type { Person } from "@/lib/types";

type ServantOption = { id: string; full_name: string };

type Props = {
  people: { id: string; full_name: string }[];
  peopleDetails: Record<string, Person>;
  servants: ServantOption[];
  defaultPersonId?: string;
};

export default function CheckupForm({
  people,
  peopleDetails,
  servants,
  defaultPersonId,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [search, setSearch] = useState(() => {
    if (defaultPersonId) {
      const found = people.find((p) => p.id === defaultPersonId);
      return found?.full_name || "";
    }
    return "";
  });
  const [selectedPersonId, setSelectedPersonId] = useState(
    defaultPersonId || "",
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const personSearchRef = useRef<HTMLDivElement>(null);

  const filteredPeople = search
    ? people.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()),
      )
    : people;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        personSearchRef.current &&
        !personSearchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [showPersonInfo, setShowPersonInfo] = useState(false);

  const selectedPerson = selectedPersonId
    ? peopleDetails[selectedPersonId]
    : null;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await createCheckup(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      // redirect() throws — keep loading visible during navigation
    }
  }

  async function handleUpdatePerson(formData: FormData) {
    if (!selectedPersonId) return;
    const result = await updatePersonInfo(selectedPersonId, formData);
    if (result?.error) {
      return { error: result.error };
    }

    return;
  }

  return (
    <>
      {loading && <LoadingOverlay message="Saving checkup..." />}
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <fieldset disabled={loading}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              ref={personSearchRef}
              className="relative sm:col-span-2 lg:col-span-3"
            >
              <label
                htmlFor="person_search"
                className="block text-sm text-gray-600 mb-1"
              >
                Person *
              </label>
              <input type="hidden" name="person_id" value={selectedPersonId} />
              <input
                id="person_search"
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedPersonId("");
                  setShowPersonInfo(false);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredPeople.length > 0 ? (
                    filteredPeople.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPersonId(p.id);
                          setSearch(p.full_name);
                          setShowDropdown(false);
                          setShowPersonInfo(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50"
                      >
                        {p.full_name}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        No match found
                      </p>
                      <Link
                        href="/people/new"
                        className="inline-block px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        + Add New Member
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="checkup_date"
                className="block text-sm text-gray-600 mb-1"
              >
                Date *
              </label>
              <input
                id="checkup_date"
                name="checkup_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="method"
                className="block text-sm text-gray-600 mb-1"
              >
                Method *
              </label>
              <select
                id="method"
                name="method"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="call">Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="visit">Visit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="comment"
                className="block text-sm text-gray-600 mb-1"
              >
                Comment
              </label>
              <input
                id="comment"
                name="comment"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="follow_up_needed"
                  checked={followUp}
                  onChange={(e) => setFollowUp(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Follow-up needed
              </label>
              {followUp && (
                <div>
                  <label
                    htmlFor="next_follow_up_date"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    Next Follow-up Date
                  </label>
                  <input
                    id="next_follow_up_date"
                    name="next_follow_up_date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Record Checkup"}
        </button>
      </form>

      {/* Update Person Info Section */}
      {selectedPerson && (
        <div className="mt-6 border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setShowPersonInfo(!showPersonInfo)}
            className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span>Update {selectedPerson.full_name}&apos;s Info</span>
            <svg
              className={`w-4 h-4 transition-transform ${showPersonInfo ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showPersonInfo && (
            <div className="p-4 pt-0">
              <PersonForm
                person={selectedPerson}
                action={handleUpdatePerson}
                submitLabel="Update Person Info"
                servants={servants}
                showCancel={false}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
