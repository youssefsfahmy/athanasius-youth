"use server";

import { createClient } from "@/lib/supabase/server";

export type NotCheckedUpData = {
  id: string;
  full_name: string;
  church_last_checkup_date: string | null;
};

export async function fetchNotCheckedUpData({
  view,
  gender,
  familyGroup,
  profileId,
  notCheckedInDays,
}: {
  view: string;
  gender?: string;
  familyGroup: string | null;
  profileId: string;
  notCheckedInDays: number;
}) {
  const supabase = await createClient();
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - notCheckedInDays);

  let query = supabase
    .from("people")
    .select(
      "id, full_name, church_last_checkup_date, church_family_group, church_checkup_servant_id, gender",
    )
    .or(
      `church_last_checkup_date.is.null,church_last_checkup_date.lt.${daysAgo.toISOString().split("T")[0]}`,
    )
    .order("church_last_checkup_date", { ascending: true, nullsFirst: true })
    .limit(10);

  if (filterByFamily) query = query.eq("church_family_group", familyGroup);
  if (filterByMyPeople)
    query = query.eq("church_checkup_servant_id", profileId);
  if (gender) query = query.eq("gender", gender);

  // Get total count
  let countQuery = supabase
    .from("people")
    .select("*", { count: "exact", head: true })
    .or(
      `church_last_checkup_date.is.null,church_last_checkup_date.lt.${daysAgo.toISOString().split("T")[0]}`,
    );
  if (filterByFamily)
    countQuery = countQuery.eq("church_family_group", familyGroup);
  if (filterByMyPeople)
    countQuery = countQuery.eq("church_checkup_servant_id", profileId);
  if (gender) countQuery = countQuery.eq("gender", gender);
  const { count: totalCount } = await countQuery;

  const { data: people } = await query;

  return {
    people: (people || []) as NotCheckedUpData[],
    totalCount: totalCount ?? 0,
  };
}
