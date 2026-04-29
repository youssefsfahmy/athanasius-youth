import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DashboardFilters } from "../types";

export default async function NotAttended({
  view,
  gender,
  familyGroup,
  profileId,
  notAttendedInDays,
}: DashboardFilters) {
  const supabase = await createClient();
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - notAttendedInDays);
  const cutoff = daysAgo.toISOString().split("T")[0];

  // Get IDs of people who have attended in the last 30 days
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Not Attended in {notAttendedInDays}+ Days ({totalCount ?? 0})
      </h2>
      {people && people.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {people.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
            >
              <Link
                href={`/people/${p.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {p.full_name}
              </Link>
              <span className="text-xs text-gray-400">
                <Link
                  href={`/attendance?person_id=${p.id}`}
                  className="hover:text-blue-600"
                >
                  Record
                </Link>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Everyone has attended recently!</p>
      )}
    </div>
  );
}
