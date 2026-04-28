import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/require-profile";
import type { CheckupWithDetails, Person } from "@/lib/types";
import CheckupForm from "./checkup-form";

export default async function CheckupsPage({
  searchParams,
}: {
  searchParams: Promise<{
    person_id?: string;
    method?: string;
    follow_up?: string;
  }>;
}) {
  await requireProfile();
  const { person_id, method, follow_up } = await searchParams;
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .order("full_name");

  const peopleList = (people || []) as Person[];
  const peopleForSelect = peopleList.map((p) => ({
    id: p.id,
    full_name: p.full_name,
  }));
  const peopleDetails: Record<string, Person> = {};
  for (const p of peopleList) {
    peopleDetails[p.id] = p;
  }

  const { data: servants } = await supabase
    .from("servant_profiles")
    .select("id, full_name")
    .order("full_name");

  let query = supabase
    .from("checkups")
    .select("*, people(full_name), servant_profiles(full_name)")
    .order("checkup_date", { ascending: false })
    .limit(100);

  if (person_id) {
    query = query.eq("person_id", person_id);
  }
  if (method) {
    query = query.eq("method", method);
  }
  if (follow_up === "true") {
    query = query.eq("follow_up_needed", true);
  }

  const { data: records } = await query;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkups</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Record Checkup
        </h2>
        <CheckupForm
          people={peopleForSelect}
          peopleDetails={peopleDetails}
          servants={servants || []}
          defaultPersonId={person_id}
        />
      </div>

      {/* Filter */}
      <form className="flex flex-wrap gap-3 mb-6">
        <select
          name="person_id"
          defaultValue={person_id || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All People</option>
          {peopleForSelect.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
        <select
          name="method"
          defaultValue={method || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Methods</option>
          <option value="call">Call</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="visit">Visit</option>
          <option value="other">Other</option>
        </select>
        <select
          name="follow_up"
          defaultValue={follow_up || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All</option>
          <option value="true">Needs Follow-up</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900"
        >
          Filter
        </button>
        {(person_id || method || follow_up) && (
          <a
            href="/checkups"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
          >
            Clear
          </a>
        )}
      </form>

      {/* Checkup Records Table */}
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
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Method
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">
                Comment
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">
                Contacted By
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Follow-up
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {((records as CheckupWithDetails[]) || []).map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{r.checkup_date}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/people/${r.person_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {r.people?.full_name || "—"}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.method}</td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                  {r.comment || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {r.servant_profiles?.full_name || "—"}
                </td>
                <td className="px-4 py-3">
                  {r.follow_up_needed ? (
                    <span className="text-xs text-orange-600 font-medium">
                      {r.next_follow_up_date || "Yes"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No</span>
                  )}
                </td>
              </tr>
            ))}
            {(!records || records.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No checkup records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
