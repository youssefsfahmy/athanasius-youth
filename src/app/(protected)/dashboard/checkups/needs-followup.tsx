import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DashboardFilters } from "../types";

export default async function NeedsFollowUp({
  view,
  gender,
  familyGroup,
  profileId,
}: DashboardFilters) {
  const supabase = await createClient();
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  let query = supabase
    .from("checkups")
    .select(
      "*, people!inner(full_name, church_family_group, church_checkup_servant_id, gender)",
    )
    .eq("follow_up_needed", true)
    .order("next_follow_up_date", { ascending: true })
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
        <h2 className="text-sm font-semibold text-gray-700">Needs Follow-up</h2>
        <Link
          href="/checkups?follow_up=true"
          className="text-xs text-blue-600 hover:underline"
        >
          View All
        </Link>
      </div>
      {records && records.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {records.map((c) => (
            <li key={c.id} className="py-2 flex items-center justify-between">
              <div>
                <Link
                  href={`/people/${c.person_id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {(c.people as { full_name: string } | null)?.full_name}
                </Link>
                <p className="text-xs text-gray-500">
                  {c.method} — {c.checkup_date}
                </p>
              </div>
              {c.next_follow_up_date && (
                <span className="text-xs text-orange-600 font-medium">
                  Due: {c.next_follow_up_date}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No pending follow-ups.</p>
      )}
    </div>
  );
}
