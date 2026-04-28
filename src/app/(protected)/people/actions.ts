"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const PERSON_IMAGE_BUCKET = "person-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type PersonActionResult = { error: string } | void;
type UploadPersonImageResult = { error: string } | { imageUrl: string };

function getImagePathFromUrl(imageUrl: string | null) {
  if (!imageUrl) return null;

  const marker = `/storage/v1/object/public/${PERSON_IMAGE_BUCKET}/`;
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  return imageUrl.slice(markerIndex + marker.length);
}

async function deleteStoredImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imageUrl: string | null,
) {
  const imagePath = getImagePathFromUrl(imageUrl);
  if (!imagePath) return;

  await supabase.storage.from(PERSON_IMAGE_BUCKET).remove([imagePath]);
}

async function uploadPersonImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personId: string,
  file: File,
): Promise<UploadPersonImageResult> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "Picture must be a JPG, PNG, WebP, or GIF." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: "Picture must be 5 MB or smaller." };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;
  const safeExtension = extension && extension.length <= 10 ? extension : "jpg";
  const filePath = `${personId}/${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage
    .from(PERSON_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage
    .from(PERSON_IMAGE_BUCKET)
    .getPublicUrl(filePath);

  return { imageUrl: data.publicUrl };
}

function getCleanedPersonFields(formData: FormData) {
  const cleaned: Record<string, string | null> = {};

  for (const [key, value] of formData.entries()) {
    if (
      key === "image_file" ||
      key === "existing_image_url" ||
      key === "remove_image"
    ) {
      continue;
    }

    if (typeof value !== "string") {
      continue;
    }

    cleaned[key] = value === "" ? null : value;
  }

  return cleaned;
}

export async function createPerson(
  formData: FormData,
): Promise<PersonActionResult> {
  const supabase = await createClient();
  const cleaned = getCleanedPersonFields(formData);
  const imageFile = formData.get("image_file");
  const personId = crypto.randomUUID();

  cleaned.id = personId;

  if (imageFile instanceof File && imageFile.size > 0) {
    const uploadResult = await uploadPersonImage(supabase, personId, imageFile);
    if ("error" in uploadResult) {
      return { error: uploadResult.error };
    }
    cleaned.image_url = uploadResult.imageUrl;
  }

  const { error } = await supabase.from("people").insert(cleaned);

  if (error) {
    return { error: error.message };
  }

  redirect("/people");
}

export async function updatePerson(
  id: string,
  formData: FormData,
): Promise<PersonActionResult> {
  const supabase = await createClient();
  const cleaned = getCleanedPersonFields(formData);
  const imageFile = formData.get("image_file");
  const existingImageUrl = formData.get("existing_image_url");
  const removeImage = formData.get("remove_image") === "true";
  const currentImageUrl =
    typeof existingImageUrl === "string" && existingImageUrl !== ""
      ? existingImageUrl
      : null;

  if (removeImage) {
    cleaned.image_url = null;
    await deleteStoredImage(supabase, currentImageUrl);
  }

  if (imageFile instanceof File && imageFile.size > 0) {
    const uploadResult = await uploadPersonImage(supabase, id, imageFile);
    if ("error" in uploadResult) {
      return { error: uploadResult.error };
    }
    cleaned.image_url = uploadResult.imageUrl;
    await deleteStoredImage(supabase, currentImageUrl);
  }

  const { error } = await supabase.from("people").update(cleaned).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect(`/people/${id}`);
}

export async function deletePerson(id: string): Promise<PersonActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("people").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect("/people");
}
