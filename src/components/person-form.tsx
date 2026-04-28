"use client";

import type { Person } from "@/lib/types";
import { useState } from "react";

type ServantOption = { id: string; full_name: string };

type Props = {
  person?: Person;
  action: (formData: FormData) => Promise<{ error: string } | void>;
  submitLabel: string;
  servants?: ServantOption[];
};

const FIELD_GROUPS = [
  {
    title: "Basic Info",
    fields: [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["", "M", "F"],
      },
      { name: "birth_date", label: "Birth Date", type: "date" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { name: "phone_primary", label: "Primary Phone", type: "tel" },
      { name: "phone_secondary", label: "Secondary Phone", type: "tel" },
      { name: "phone_landline", label: "Landline", type: "tel" },
      { name: "phone_father", label: "Father's Phone", type: "tel" },
      { name: "phone_mother", label: "Mother's Phone", type: "tel" },
    ],
  },
  {
    title: "Address",
    fields: [
      { name: "address_area", label: "Area", type: "text" },
      { name: "address_street", label: "Street", type: "text" },
      { name: "address_building", label: "Building", type: "text" },
      { name: "address_floor", label: "Floor", type: "text" },
      { name: "address_apartment", label: "Apartment", type: "text" },
      { name: "address_details", label: "Details", type: "text" },
      { name: "address_landmark", label: "Landmark", type: "text" },
    ],
  },
  {
    title: "Education",
    fields: [
      { name: "education_college", label: "College", type: "text" },
      { name: "education_university", label: "University", type: "text" },
      { name: "education_year", label: "Year", type: "text" },
    ],
  },
  {
    title: "Church",
    fields: [
      {
        name: "church_confession_father",
        label: "Confession Father",
        type: "text",
      },
      { name: "church_family_group", label: "Family Group", type: "text" },
      { name: "church_family_servant", label: "Family Servant", type: "text" },
      {
        name: "church_checkup_servant_id",
        label: "Checkup Servant",
        type: "servant_select",
      },
    ],
  },
  {
    title: "Other",
    fields: [
      { name: "social_facebook_url", label: "Facebook URL", type: "url" },
      { name: "notes_public", label: "Public Notes", type: "textarea" },
      { name: "notes_private", label: "Private Notes", type: "textarea" },
    ],
  },
];

export default function PersonForm({
  person,
  action,
  submitLabel,
  servants,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  function getDefault(name: string): string {
    if (!person) return "";
    return ((person as Record<string, unknown>)[name] as string) ?? "";
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}

      {FIELD_GROUPS.map((group) => (
        <fieldset
          key={group.title}
          className="border border-gray-200 rounded-lg p-4"
        >
          <legend className="text-sm font-semibold text-gray-700 px-2">
            {group.title}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {group.fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm text-gray-600 mb-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    defaultValue={getDefault(field.name)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    defaultValue={getDefault(field.name)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === ""
                          ? "Select..."
                          : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : field.type === "servant_select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    defaultValue={getDefault(field.name)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select servant...</option>
                    {(servants || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    defaultValue={getDefault(field.name)}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <a
          href="/people"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
