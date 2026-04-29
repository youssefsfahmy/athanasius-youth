"use server";

import { createClient } from "@/lib/supabase/server";

export type NotAttendedData = {
  id: string;
  full_name: string;
};

export async function fetchNotAttendedData({
  view,
  gender,
  familyGroup,
  profileId,
  notAttendedInDays,
}: {
  view: string;
  gender?: string;
  familyGroup: string | null;
  profileId: string;
  notAttendedInDays: number;
}) {
  const supabase = await createClient();
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - notAttendedInDays);
  const cutoff = daysAgo.toISOString().split("T")[0];

  // Get IDs of people who have attended in the last N days
  const { data: recentAttendees } = await supabase
    .from("attendance")
    .select("person_id")
    .gte("event_date", cutoff);

  const recentIds = (recentAttendees ?? []).map((r) => r.person_id);

  let query = supabase
    .from("people")
    .select(
      "id, full_name, church_family_group, church_checkup_servant_id, gender",
    )
    .order("full_name", { ascending: true })
    .limit(10);

  if (recentIds.length > 0) {
    query = query.not("id", "in", `(${recentIds.join(",")})`);
  }
  if (filterByFamily) query = query.eq("church_family_group", familyGroup);
  if (filterByMyPeople)
    query = query.eq("church_checkup_servant_id", profileId);
  if (gender) query = query.eq("gender", gender);

  // Get total count
  let countQuery = supabase
    .from("people")
    .select("*", { count: "exact", head: true });
  if (recentIds.length > 0)
    countQuery = countQuery.not("id", "in", `(${recentIds.join(",")})`);
  if (filterByFamily)
    countQuery = countQuery.eq("church_family_group", familyGroup);
  if (filterByMyPeople)
    countQuery = countQuery.eq("church_checkup_servant_id", profileId);
  if (gender) countQuery = countQuery.eq("gender", gender);
  const { count: totalCount } = await countQuery;

  const { data: people } = await query;

  return {
    people: (people || []) as NotAttendedData[],
    totalCount: totalCount ?? 0,
  };
}
