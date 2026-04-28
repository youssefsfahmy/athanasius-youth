"use client";

/* eslint-disable @next/next/no-img-element */

import type { Person } from "@/lib/types";
import Link from "next/link";
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
  const [imagePreview, setImagePreview] = useState(person?.image_url ?? "");

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

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-semibold text-gray-700 px-2">
          Picture
        </legend>
        <div className="grid grid-cols-1 lg:grid-cols-[160px_minmax(0,1fr)] gap-4 items-start mt-2">
          <div className="flex flex-col items-center gap-2">
            <div className="h-36 w-36 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Person preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400 text-center px-3">
                  No picture selected
                </span>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="image_file"
              className="block text-sm text-gray-600 mb-1"
            >
              Upload Picture
            </label>
            <input
              id="image_file"
              name="image_file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  setImagePreview(person?.image_url ?? "");
                  return;
                }
                setImagePreview(URL.createObjectURL(file));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="hidden"
              name="existing_image_url"
              value={person?.image_url ?? ""}
            />
            {person?.image_url && (
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="remove_image"
                  value="true"
                  onChange={(event) => {
                    if (event.target.checked) {
                      setImagePreview("");
                      return;
                    }
                    setImagePreview(person.image_url ?? "");
                  }}
                  className="rounded border-gray-300"
                />
                Remove current picture
              </label>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Upload a JPG, PNG, WebP, or GIF up to 5 MB.
            </p>
          </div>
        </div>
      </fieldset>

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
        <Link
          href="/people"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
