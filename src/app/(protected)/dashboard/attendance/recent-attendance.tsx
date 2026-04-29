import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DashboardFilters } from "../types";

export default async function RecentAttendance({
  view,
  gender,
  familyGroup,
  profileId,
}: DashboardFilters) {
  const supabase = await createClient();
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let query = supabase
    .from("attendance")
    .select(
      "*, people!inner(full_name, church_family_group, church_checkup_servant_id, gender)",
    )
    .gte("event_date", sevenDaysAgo.toISOString().split("T")[0])
    .order("event_date", { ascending: false })
    .limit(10);

  if (filterByFamily)
    query = query.eq("people.church_family_group", familyGroup);
  if (filterByMyPeople)
    query = query.eq("people.church_checkup_servant_id", profileId);
  if (gender) query = query.eq("people.gender", gender);

  const { data: records } = await query;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Recent Attendance
        </h2>
        <Link
          href="/attendance"
          className="text-xs text-blue-600 hover:underline"
        >
          View All
        </Link>
      </div>
      {records && records.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {records.map((a) => (
            <li key={a.id} className="py-2 flex items-center justify-between">
              <div>
                <Link
                  href={`/people/${a.person_id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {(a.people as { full_name: string } | null)?.full_name}
                </Link>
                <p className="text-xs text-gray-500">
                  {a.event_name} — {a.event_date}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  a.status === "present"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No recent attendance.</p>
      )}
    </div>
  );
}
