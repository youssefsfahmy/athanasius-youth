"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCheckup(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("servant_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const followUpNeeded = formData.get("follow_up_needed") === "on";

  const { error } = await supabase.from("checkups").insert({
    person_id: formData.get("person_id") as string,
    checkup_date: formData.get("checkup_date") as string,
    method: formData.get("method") as string,
    comment: (formData.get("comment") as string) || null,
    follow_up_needed: followUpNeeded,
    next_follow_up_date: followUpNeeded
      ? (formData.get("next_follow_up_date") as string) || null
      : null,
    contacted_by: profile?.id || null,
  });

  if (error) {
    return { error: error.message };
  }

  // Update person's last checkup date
  const personId = formData.get("person_id") as string;
  const checkupDate = formData.get("checkup_date") as string;
  await supabase
    .from("people")
    .update({ church_last_checkup_date: checkupDate })
    .eq("id", personId);

  redirect("/checkups");
}

export async function deleteCheckup(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("checkups").delete().eq("id", id);
  if (error) return { error: error.message };
  redirect("/checkups");
}

export async function updatePersonInfo(personId: string, formData: FormData) {
  const supabase = await createClient();

  const fields = [
    "phone_primary",
    "phone_secondary",
    "phone_landline",
    "phone_father",
    "phone_mother",
    "address_area",
    "address_street",
    "address_building",
    "address_floor",
    "address_apartment",
    "address_details",
    "address_landmark",
    "education_college",
    "education_university",
    "education_year",
    "church_confession_father",
    "church_family_group",
    "church_family_servant",
    "church_checkup_servant_id",
    "social_facebook_url",
    "notes_public",
  ];

  const updates: Record<string, string | null> = {};
  for (const field of fields) {
    const value = (formData.get(field) as string)?.trim();
    updates[field] = value || null;
  }

  const { error } = await supabase
    .from("people")
    .update(updates)
    .eq("id", personId);

  if (error) return { error: error.message };
  return { success: true };
}
