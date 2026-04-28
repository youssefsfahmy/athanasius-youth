"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createPerson(formData: FormData) {
  const supabase = await createClient();

  const data = Object.fromEntries(formData.entries());
  // Remove empty strings → null
  const cleaned: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = value === "" ? null : String(value);
  }

  const { error } = await supabase.from("people").insert(cleaned);

  if (error) {
    return { error: error.message };
  }

  redirect("/people");
}

export async function updatePerson(id: string, formData: FormData) {
  const supabase = await createClient();

  const data = Object.fromEntries(formData.entries());
  const cleaned: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = value === "" ? null : String(value);
  }

  const { error } = await supabase.from("people").update(cleaned).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect(`/people/${id}`);
}

export async function deletePerson(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("people").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  redirect("/people");
}
