import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/require-profile";
import type { AttendanceWithDetails } from "@/lib/types";
import AttendanceForm from "./attendance-form";
import Link from "next/link";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    person_id?: string;
    event_name?: string;
    date?: string;
  }>;
}) {
  await requireProfile();
  const { person_id, event_name, date } = await searchParams;
  const supabase = await createClient();

  // Fetch people for the dropdown
  const { data: people } = await supabase
    .from("people")
    .select("id, full_name")
    .order("full_name");

  // Fetch attendance records
  let query = supabase
    .from("attendance")
    .select("*, people(full_name), servant_profiles(full_name)")
    .order("event_date", { ascending: false })
    .limit(100);

  if (person_id) {
    query = query.eq("person_id", person_id);
  }
  if (event_name) {
    query = query.ilike("event_name", `%${event_name}%`);
  }
  if (date) {
    query = query.eq("event_date", date);
  }

  const { data: records } = await query;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance</h1>

      {/* Add Attendance Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Record Attendance
        </h2>
        <AttendanceForm people={people || []} defaultPersonId={person_id} />
      </div>

      {/* Filter */}
      <form className="flex flex-wrap gap-3 mb-6">
        <select
          name="person_id"
          defaultValue={person_id || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All People</option>
          {(people || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
        <input
          name="event_name"
          type="text"
          placeholder="Event name..."
          defaultValue={event_name || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          name="date"
          type="date"
          defaultValue={date || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900"
        >
          Filter
        </button>
        {(person_id || event_name || date) && (
          <Link
            href="/attendance"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Person
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">
                Event
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">
                Recorded By
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {((records as AttendanceWithDetails[]) || []).map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{r.event_date}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/people/${r.person_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {r.people?.full_name || "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                  {r.event_name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === "present"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {r.servant_profiles?.full_name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                  {r.notes || "—"}
                </td>
              </tr>
            ))}
            {(!records || records.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
