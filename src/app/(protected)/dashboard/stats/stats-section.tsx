import { createClient } from "@/lib/supabase/server";
import StatCard from "./stat-card";
import type { DashboardFilters } from "../types";

export default async function StatsSection({
  view,
  gender,
  familyGroup,
  profileId,
}: DashboardFilters) {
  const supabase = await createClient();
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  // Total people
  let peopleQuery = supabase
    .from("people")
    .select("*", { count: "exact", head: true });
  if (filterByFamily)
    peopleQuery = peopleQuery.eq("church_family_group", familyGroup);
  if (filterByMyPeople)
    peopleQuery = peopleQuery.eq("church_checkup_servant_id", profileId);
  if (gender) peopleQuery = peopleQuery.eq("gender", gender);
  const { count: totalPeople } = await peopleQuery;

  // Attendance (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  let attendanceQuery = supabase
    .from("attendance")
    .select(
      "id, people!inner(church_family_group, church_checkup_servant_id, gender)",
      {
        count: "exact",
        head: true,
      },
    )
    .gte("event_date", sevenDaysAgo.toISOString().split("T")[0]);
  if (filterByFamily)
    attendanceQuery = attendanceQuery.eq(
      "people.church_family_group",
      familyGroup,
    );
  if (filterByMyPeople)
    attendanceQuery = attendanceQuery.eq(
      "people.church_checkup_servant_id",
      profileId,
    );
  if (gender) attendanceQuery = attendanceQuery.eq("people.gender", gender);
  const { count: attendanceCount } = await attendanceQuery;

  // Needs follow-up
  let followUpQuery = supabase
    .from("checkups")
    .select(
      "id, people!inner(church_family_group, church_checkup_servant_id, gender)",
      {
        count: "exact",
        head: true,
      },
    )
    .eq("follow_up_needed", true);
  if (filterByFamily)
    followUpQuery = followUpQuery.eq("people.church_family_group", familyGroup);
  if (filterByMyPeople)
    followUpQuery = followUpQuery.eq(
      "people.church_checkup_servant_id",
      profileId,
    );
  if (gender) followUpQuery = followUpQuery.eq("people.gender", gender);
  const { count: followUpCount } = await followUpQuery;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard label="Total People" value={totalPeople ?? 0} />
      <StatCard label="Attendance (7 days)" value={attendanceCount ?? 0} />
      <StatCard
        label="Needs Follow-up"
        value={followUpCount ?? 0}
        highlight={!!followUpCount}
      />
    </div>
  );
}
