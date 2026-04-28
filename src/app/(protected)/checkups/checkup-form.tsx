"use client";

import { useState } from "react";
import { createCheckup, updatePersonInfo } from "./actions";
import type { Person } from "@/lib/types";

type ServantOption = { id: string; full_name: string };

type Props = {
  people: { id: string; full_name: string }[];
  peopleDetails: Record<string, Person>;
  servants: ServantOption[];
  defaultPersonId?: string;
};

const PERSON_FIELDS = [
  { name: "phone_primary", label: "Primary Phone", type: "tel" },
  { name: "phone_secondary", label: "Secondary Phone", type: "tel" },
  { name: "phone_landline", label: "Landline", type: "tel" },
  { name: "phone_father", label: "Father's Phone", type: "tel" },
  { name: "phone_mother", label: "Mother's Phone", type: "tel" },
  { name: "address_area", label: "Area", type: "text" },
  { name: "address_street", label: "Street", type: "text" },
  { name: "address_building", label: "Building", type: "text" },
  { name: "address_floor", label: "Floor", type: "text" },
  { name: "address_apartment", label: "Apartment", type: "text" },
  { name: "address_details", label: "Address Details", type: "text" },
  { name: "address_landmark", label: "Landmark", type: "text" },
  { name: "education_college", label: "College", type: "text" },
  { name: "education_university", label: "University", type: "text" },
  { name: "education_year", label: "Year", type: "text" },
  {
    name: "church_confession_father",
    label: "Confession Father",
    type: "text",
  },
  { name: "church_family_group", label: "Family Group", type: "text" },
  { name: "church_family_servant", label: "Family Servant", type: "text" },
  { name: "social_facebook_url", label: "Facebook URL", type: "url" },
  { name: "notes_public", label: "Public Notes", type: "text" },
];

export default function CheckupForm({
  people,
  peopleDetails,
  servants,
  defaultPersonId,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(
    defaultPersonId || "",
  );
  const [showPersonInfo, setShowPersonInfo] = useState(false);
  const [personUpdateMsg, setPersonUpdateMsg] = useState<string | null>(null);
  const [updatingPerson, setUpdatingPerson] = useState(false);

  const selectedPerson = selectedPersonId
    ? peopleDetails[selectedPersonId]
    : null;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await createCheckup(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  async function handleUpdatePerson(formData: FormData) {
    if (!selectedPersonId) return;
    setPersonUpdateMsg(null);
    setUpdatingPerson(true);
    const result = await updatePersonInfo(selectedPersonId, formData);
    if (result?.error) {
      setPersonUpdateMsg(result.error);
    } else {
      setPersonUpdateMsg("Person info updated!");
    }
    setUpdatingPerson(false);
  }

  return (
    <>
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="person_id"
              className="block text-sm text-gray-600 mb-1"
            >
              Person *
            </label>
            <select
              id="person_id"
              name="person_id"
              required
              defaultValue={defaultPersonId || ""}
              onChange={(e) => {
                setSelectedPersonId(e.target.value);
                setShowPersonInfo(false);
                setPersonUpdateMsg(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select person...</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
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
            <form action={handleUpdatePerson} className="p-4 pt-0 space-y-4">
              {personUpdateMsg && (
                <p
                  className={`text-sm p-2 rounded ${
                    personUpdateMsg.includes("updated")
                      ? "text-green-700 bg-green-50"
                      : "text-red-600 bg-red-50"
                  }`}
                >
                  {personUpdateMsg}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PERSON_FIELDS.map((field) => {
                  const value = (selectedPerson as Record<string, unknown>)[
                    field.name
                  ] as string | null;
                  return (
                    <div key={field.name}>
                      <label
                        htmlFor={`person_${field.name}`}
                        className={`block text-xs mb-1 ${
                          value
                            ? "text-gray-500"
                            : "text-orange-600 font-medium"
                        }`}
                      >
                        {field.label}
                        {!value && " (missing)"}
                      </label>
                      <input
                        id={`person_${field.name}`}
                        name={field.name}
                        type={field.type}
                        defaultValue={value || ""}
                        className={`w-full px-2 py-1.5 border rounded-md text-sm ${
                          value
                            ? "border-gray-200"
                            : "border-orange-200 bg-orange-50"
                        }`}
                      />
                    </div>
                  );
                })}
                <div>
                  <label
                    htmlFor="person_church_checkup_servant_id"
                    className={`block text-xs mb-1 ${
                      selectedPerson.church_checkup_servant_id
                        ? "text-gray-500"
                        : "text-orange-600 font-medium"
                    }`}
                  >
                    Checkup Servant
                    {!selectedPerson.church_checkup_servant_id && " (missing)"}
                  </label>
                  <select
                    id="person_church_checkup_servant_id"
                    name="church_checkup_servant_id"
                    defaultValue={
                      selectedPerson.church_checkup_servant_id || ""
                    }
                    className={`w-full px-2 py-1.5 border rounded-md text-sm ${
                      selectedPerson.church_checkup_servant_id
                        ? "border-gray-200"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <option value="">Select servant...</option>
                    {servants.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={updatingPerson}
                className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 disabled:opacity-50"
              >
                {updatingPerson ? "Updating..." : "Update Person Info"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
