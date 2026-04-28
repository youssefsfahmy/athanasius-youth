import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/require-profile";
import type { Person } from "@/lib/types";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    family?: string;
    gender?: string;
  }>;
}) {
  await requireProfile();
  const { q, family, gender } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("people")
    .select(
      "id, full_name, phone_primary, gender, birth_date, church_family_group",
    )
    .order("full_name");

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone_primary.ilike.%${q}%`);
  }
  if (family) {
    query = query.eq("church_family_group", family);
  }
  if (gender) {
    query = query.eq("gender", gender);
  }

  const { data: people } = await query;

  // Get distinct family groups for filter
  const { data: families } = await supabase
    .from("people")
    .select("church_family_group")
    .not("church_family_group", "is", null)
    .order("church_family_group");

  const uniqueFamilies = [
    ...new Set(
      (families || []).map((f) => f.church_family_group).filter(Boolean),
    ),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">People</h1>
        <a
          href="/people/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Add Person
        </a>
      </div>

      {/* Search & Filter */}
      <form className="flex flex-wrap gap-3 mb-6">
        <input
          name="q"
          type="text"
          placeholder="Search by name or phone..."
          defaultValue={q || ""}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="family"
          defaultValue={family || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Families</option>
          {uniqueFamilies.map((f) => (
            <option key={f} value={f!}>
              {f}
            </option>
          ))}
        </select>
        <select
          name="gender"
          defaultValue={gender || ""}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          Search
        </button>
        {(q || family || gender) && (
          <a
            href="/people"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            Clear
          </a>
        )}
      </form>

      {/* People Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">
                Phone
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">
                Family
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">
                Gender
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(
              (people as Pick<
                Person,
                | "id"
                | "full_name"
                | "phone_primary"
                | "gender"
                | "birth_date"
                | "church_family_group"
              >[]) || []
            ).map((person) => (
              <tr key={person.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <a
                    href={`/people/${person.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {person.full_name}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                  {person.phone_primary || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {person.church_family_group || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                  {person.gender || "—"}
                </td>
              </tr>
            ))}
            {(!people || people.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No people found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {people?.length || 0} record(s)
      </p>
    </div>
  );
}
