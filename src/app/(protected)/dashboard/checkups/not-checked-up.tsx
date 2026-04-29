import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DashboardFilters } from "../types";

export default async function NotCheckedUp({
  view,
  gender,
  familyGroup,
  profileId,
  notCheckedInDays,
}: DashboardFilters) {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Not Checked Up in {notCheckedInDays}+ Days ({totalCount ?? 0})
      </h2>
      {people && people.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
            >
              <span className="text-sm text-blue-600 hover:underline">
                {p.full_name}
              </span>
              <span className="text-xs text-gray-400">
                {p.church_last_checkup_date || "Never"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Everyone is checked up!</p>
      )}
    </div>
  );
}
