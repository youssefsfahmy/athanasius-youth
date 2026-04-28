import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/require-profile";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; gender?: string }>;
}) {
  const { familyGroup, profileId } = await requireProfile();
  const { view: viewParam, gender } = await searchParams;
  const supabase = await createClient();

  // Default to "family" view if servant has a family group, otherwise "all"
  const view = viewParam || (familyGroup ? "family" : "all");
  const filterByFamily = view === "family" && familyGroup;
  const filterByMyPeople = view === "mine";

  // Total people count
  let peopleQuery = supabase
    .from("people")
    .select("*", { count: "exact", head: true });
  if (filterByFamily) {
    peopleQuery = peopleQuery.eq("church_family_group", familyGroup);
  }
  if (filterByMyPeople) {
    peopleQuery = peopleQuery.eq("church_checkup_servant_id", profileId);
  }
  if (gender) {
    peopleQuery = peopleQuery.eq("gender", gender);
  }
  const { count: totalPeople } = await peopleQuery;

  // Recent attendance (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  let attendanceQuery = supabase
    .from("attendance")
    .select(
      "*, people!inner(full_name, church_family_group, church_checkup_servant_id, gender)",
    )
    .gte("event_date", sevenDaysAgo.toISOString().split("T")[0])
    .order("event_date", { ascending: false })
    .limit(10);
  if (filterByFamily) {
    attendanceQuery = attendanceQuery.eq(
      "people.church_family_group",
      familyGroup,
    );
  }
  if (filterByMyPeople) {
    attendanceQuery = attendanceQuery.eq(
      "people.church_checkup_servant_id",
      profileId,
    );
  }
  if (gender) {
    attendanceQuery = attendanceQuery.eq("people.gender", gender);
  }
  const { data: recentAttendance } = await attendanceQuery;

  // People needing follow-up
  let followUpQuery = supabase
    .from("checkups")
    .select(
      "*, people!inner(full_name, church_family_group, church_checkup_servant_id, gender)",
    )
    .eq("follow_up_needed", true)
    .order("next_follow_up_date", { ascending: true })
    .limit(10);
  if (filterByFamily) {
    followUpQuery = followUpQuery.eq("people.church_family_group", familyGroup);
  }
  if (filterByMyPeople) {
    followUpQuery = followUpQuery.eq(
      "people.church_checkup_servant_id",
      profileId,
    );
  }
  if (gender) {
    followUpQuery = followUpQuery.eq("people.gender", gender);
  }
  const { data: needFollowUp } = await followUpQuery;

  // People not checked up in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let notCheckedQuery = supabase
    .from("people")
    .select(
      "id, full_name, church_last_checkup_date, church_family_group, church_checkup_servant_id, gender",
      { count: "exact" },
    )
    .or(
      `church_last_checkup_date.is.null,church_last_checkup_date.lt.${thirtyDaysAgo.toISOString().split("T")[0]}`,
    )
    .order("church_last_checkup_date", { ascending: true, nullsFirst: true })
    .limit(10);
  if (filterByFamily) {
    notCheckedQuery = notCheckedQuery.eq("church_family_group", familyGroup);
  }
  if (filterByMyPeople) {
    notCheckedQuery = notCheckedQuery.eq(
      "church_checkup_servant_id",
      profileId,
    );
  }
  if (gender) {
    notCheckedQuery = notCheckedQuery.eq("gender", gender);
  }
  const { data: notCheckedUp, count: notCheckedCount } = await notCheckedQuery;

  // Build filter URL helper
  function filterUrl(params: { view?: string; gender?: string }) {
    const p = new URLSearchParams();
    const v = params.view ?? view;
    const g = params.gender !== undefined ? params.gender : gender || "";
    p.set("view", v || "all");
    if (g) p.set("gender", g);
    const qs = p.toString();
    return `/dashboard?${qs}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
          {filterByFamily && (
            <span className="text-base font-normal text-gray-500 ml-2">
              — {familyGroup}
            </span>
          )}
          {filterByMyPeople && (
            <span className="text-base font-normal text-gray-500 ml-2">
              — My People
            </span>
          )}
        </h1>
        <div className="flex flex-wrap gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-gray-300 text-sm overflow-hidden">
            {familyGroup && (
              <a
                href={filterUrl({ view: "family" })}
                className={`px-3 py-1.5 ${
                  view === "family"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                My Family
              </a>
            )}
            <a
              href={filterUrl({ view: "mine" })}
              className={`px-3 py-1.5 border-l border-gray-300 ${
                view === "mine"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              My People
            </a>
            <a
              href={filterUrl({ view: "all" })}
              className={`px-3 py-1.5 border-l border-gray-300 ${
                view === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All
            </a>
          </div>
          {/* Gender filter */}
          <div className="flex rounded-md border border-gray-300 text-sm overflow-hidden">
            <a
              href={filterUrl({ gender: "" })}
              className={`px-3 py-1.5 ${
                !gender
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All
            </a>
            <a
              href={filterUrl({ gender: "M" })}
              className={`px-3 py-1.5 border-l border-gray-300 ${
                gender === "M"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Male
            </a>
            <a
              href={filterUrl({ gender: "F" })}
              className={`px-3 py-1.5 border-l border-gray-300 ${
                gender === "F"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Female
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total People" value={totalPeople ?? 0} />
        <StatCard
          label="Attendance (7 days)"
          value={recentAttendance?.length ?? 0}
        />
        <StatCard
          label="Needs Follow-up"
          value={needFollowUp?.length ?? 0}
          highlight={!!needFollowUp?.length}
        />
        <StatCard
          label="Not Checked (30d)"
          value={notCheckedCount ?? 0}
          highlight={!!notCheckedCount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Recent Attendance
            </h2>
            <a
              href="/attendance"
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </a>
          </div>
          {recentAttendance && recentAttendance.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentAttendance.map((a) => (
                <li
                  key={a.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div>
                    <a
                      href={`/people/${a.person_id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {(a.people as { full_name: string } | null)?.full_name}
                    </a>
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

        {/* Needs Follow-up */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Needs Follow-up
            </h2>
            <a
              href="/checkups?follow_up=true"
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </a>
          </div>
          {needFollowUp && needFollowUp.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {needFollowUp.map((c) => (
                <li
                  key={c.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div>
                    <a
                      href={`/people/${c.person_id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {(c.people as { full_name: string } | null)?.full_name}
                    </a>
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

        {/* Not Checked Up Recently */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Not Checked Up in 30+ Days
          </h2>
          {notCheckedUp && notCheckedUp.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {notCheckedUp.map((p) => (
                <a
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
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Everyone is checked up!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-orange-200 bg-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm text-gray-600">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-orange-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
