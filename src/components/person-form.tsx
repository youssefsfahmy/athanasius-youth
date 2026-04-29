"use client";

/* eslint-disable @next/next/no-img-element */

import LoadingOverlay from "@/components/loading-overlay";
import type { Person } from "@/lib/types";
import Link from "next/link";
import { useRef, useState } from "react";

type ServantOption = { id: string; full_name: string };

const SERVER_ACTION_UPLOAD_LIMIT_BYTES = 1024 * 1024;
const TARGET_IMAGE_SIZE_BYTES = 900 * 1024;
const MAX_IMAGE_DIMENSIONS = [1600, 1280, 960];
const JPEG_QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.42];
const ARABIC_FULL_NAME_REGEX =
  /^[\p{Script=Arabic}]+(?:\s+[\p{Script=Arabic}]+)*$/u;

type Props = {
  person?: Person;
  action: (formData: FormData) => Promise<{ error: string } | void>;
  submitLabel: string;
  servants?: ServantOption[];
  showCancel?: boolean;
  cancelHref?: string;
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
  showCancel = true,
  cancelHref = "/people",
}: Props) {
  const formTopRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState(person?.image_url ?? "");
  const isBusy = loading || compressingImage;

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function waitForNextPaint() {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    const formData = new FormData(event.currentTarget);

    const fullName = formData.get("full_name");
    const normalizedFullName =
      typeof fullName === "string" ? fullName.trim().replace(/\s+/g, " ") : "";

    if (
      !normalizedFullName ||
      !ARABIC_FULL_NAME_REGEX.test(normalizedFullName)
    ) {
      showError("Full name must contain Arabic letters only.");
      return;
    }

    formData.set("full_name", normalizedFullName);
    setLoading(true);
    await waitForNextPaint();

    if (selectedImageFile) {
      formData.set("image_file", selectedImageFile);
    }

    try {
      const result = await action(formData);
      if (result?.error) {
        showError(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch {
      // redirect() throws — keep loading visible during navigation
    }
  }

  async function loadImage(file: File) {
    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read image."));
        img.src = objectUrl;
      });

      return image;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function canvasToFile(
    canvas: HTMLCanvasElement,
    fileName: string,
    quality: number,
  ) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) {
      throw new Error("Could not compress image.");
    }

    return new File([blob], fileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function compressImage(file: File) {
    if (file.type === "image/gif") {
      return file;
    }

    if (file.size <= TARGET_IMAGE_SIZE_BYTES) {
      return file;
    }

    const image = await loadImage(file);
    const fileName = file.name.replace(/\.[^.]+$/, "") || "person-photo";

    for (const maxDimension of MAX_IMAGE_DIMENSIONS) {
      const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Could not prepare image compression.");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of JPEG_QUALITIES) {
        const compressedFile = await canvasToFile(
          canvas,
          `${fileName}.jpg`,
          quality,
        );

        if (compressedFile.size <= TARGET_IMAGE_SIZE_BYTES) {
          return compressedFile;
        }
      }
    }

    throw new Error("Image is still too large after compression.");
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setImageMessage(null);

    if (!file) {
      setSelectedImageFile(null);
      setImagePreview(person?.image_url ?? "");
      return;
    }

    setCompressingImage(true);
    await waitForNextPaint();

    try {
      const compressedFile = await compressImage(file);
      setSelectedImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));

      if (compressedFile !== file) {
        setImageMessage(
          `Compressed before upload: ${Math.round(file.size / 1024)} KB to ${Math.round(compressedFile.size / 1024)} KB.`,
        );
      } else {
        setImageMessage(
          `Ready to upload: ${Math.round(compressedFile.size / 1024)} KB.`,
        );
      }
    } catch (imageError) {
      setSelectedImageFile(null);
      setImagePreview(person?.image_url ?? "");
      showError(
        imageError instanceof Error
          ? imageError.message
          : "Could not process image.",
      );
      event.target.value = "";
    } finally {
      setCompressingImage(false);
    }
  }

  function getDefault(name: string): string {
    if (!person) return "";
    return ((person as Record<string, unknown>)[name] as string) ?? "";
  }

  function isFieldMissing(name: string): boolean {
    if (!person) return false;
    return getDefault(name).trim() === "";
  }

  function getFieldClasses(name: string): string {
    const hasValue = !isFieldMissing(name);
    return `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasValue ? "border-gray-300" : "border-orange-300 bg-orange-50"
    }`;
  }

  return (
    <div className="relative" aria-busy={isBusy}>
      {isBusy && (
        <LoadingOverlay
          message={loading ? "Saving person..." : "Processing image..."}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div ref={formTopRef} />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
        )}

        <fieldset disabled={isBusy} className="space-y-8">
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
                  htmlFor="upload_image_file"
                  className="block text-sm text-gray-600 mb-1"
                >
                  Picture Source
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
                  >
                    Use Camera
                  </button>
                </div>
                <input
                  ref={uploadInputRef}
                  id="upload_image_file"
                  name="image_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="sr-only"
                />
                <input
                  ref={cameraInputRef}
                  id="camera_image_file"
                  name="image_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  capture="environment"
                  onChange={handleImageChange}
                  className="sr-only"
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
                          setSelectedImageFile(null);
                          setImageMessage(null);
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
                  Choose an existing image or open the camera directly.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Camera photos are compressed before upload to stay under the
                  server request limit. Use JPG, PNG, WebP, or GIF. Files must
                  end up under{" "}
                  {Math.round(SERVER_ACTION_UPLOAD_LIMIT_BYTES / 1024)} KB
                  before sending.
                </p>
                {compressingImage && (
                  <p className="mt-2 text-xs text-blue-600">
                    Compressing image...
                  </p>
                )}
                {imageMessage && (
                  <p className="mt-2 text-xs text-green-600">{imageMessage}</p>
                )}
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
                      className={`block text-sm mb-1 ${
                        isFieldMissing(field.name)
                          ? "text-orange-600 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-red-500"> *</span>
                      )}
                      {isFieldMissing(field.name) && " (missing)"}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        defaultValue={getDefault(field.name)}
                        rows={3}
                        className={getFieldClasses(field.name)}
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={field.name}
                        name={field.name}
                        defaultValue={getDefault(field.name)}
                        className={getFieldClasses(field.name)}
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
                        className={getFieldClasses(field.name)}
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
                        dir={field.name === "full_name" ? "rtl" : undefined}
                        lang={field.name === "full_name" ? "ar" : undefined}
                        autoComplete={
                          field.name === "full_name" ? "name" : undefined
                        }
                        title={
                          field.name === "full_name"
                            ? "Arabic letters only"
                            : undefined
                        }
                        className={getFieldClasses(field.name)}
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
              disabled={isBusy}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : compressingImage
                  ? "Compressing..."
                  : submitLabel}
            </button>
            {showCancel && (
              <Link
                href={cancelHref}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
              >
                Cancel
              </Link>
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
}
