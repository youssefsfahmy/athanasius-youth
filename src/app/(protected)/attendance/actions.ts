"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createAttendance(formData: FormData) {
  const supabase = await createClient();

  // Get current servant profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("servant_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("attendance").insert({
    person_id: formData.get("person_id") as string,
    event_date: formData.get("event_date") as string,
    event_name: formData.get("event_name") as string,
    status: formData.get("status") as string,
    notes: (formData.get("notes") as string) || null,
    recorded_by: profile?.id || null,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/attendance");
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  if (error) return { error: error.message };
  redirect("/attendance");
}
