import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/require-profile";
import type { Person } from "@/lib/types";
import Link from "next/link";

function getPhoneHref(phoneNumber: string) {
  return `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    family?: string;
    gender?: string;
    view?: string;
    mode?: string;
    days?: string;
    notAttendedInDays?: string;
    notCheckedInDays?: string;
    responsibleServantId?: string;
  }>;
}) {
  const { familyGroup, profileId } = await requireProfile();
  const {
    q,
    family,
    gender,
    view,
    mode,
    days,
    notAttendedInDays,
    notCheckedInDays,
    responsibleServantId,
  } = await searchParams;
  const supabase = await createClient();

  function parsePositiveInt(value?: string) {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
  }

  const legacyDays = parsePositiveInt(days) ?? 30;
  const safeNotAttendedInDays =
    parsePositiveInt(notAttendedInDays) ??
    (mode === "not-attended" ? legacyDays : undefined);
  const safeNotCheckedInDays =
    parsePositiveInt(notCheckedInDays) ??
    (mode === "not-checked" ? legacyDays : undefined);

  let query = supabase
    .from("people")
    .select(
      "id, full_name, phone_primary, gender, birth_date, church_family_group",
    )
    .order("full_name");

  if (view === "family" && familyGroup) {
    query = query.eq("church_family_group", familyGroup);
  }
  if (view === "mine") {
    query = query.eq("church_checkup_servant_id", profileId);
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone_primary.ilike.%${q}%`);
  }
  if (family) {
    query = query.eq("church_family_group", family);
  }
  if (gender) {
    query = query.eq("gender", gender);
  }
  if (responsibleServantId) {
    query = query.eq("church_checkup_servant_id", responsibleServantId);
  }

  if (safeNotCheckedInDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeNotCheckedInDays);
    query = query.or(
      `church_last_checkup_date.is.null,church_last_checkup_date.lt.${cutoffDate.toISOString().split("T")[0]}`,
    );
  }

  if (safeNotAttendedInDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeNotAttendedInDays);
    const cutoff = cutoffDate.toISOString().split("T")[0];

    const { data: recentAttendees } = await supabase
      .from("attendance")
      .select("person_id")
      .gte("event_date", cutoff);

    const recentIds = (recentAttendees ?? []).map((r) => r.person_id);
    if (recentIds.length > 0) {
      query = query.not("id", "in", `(${recentIds.join(",")})`);
    }
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

  const { data: servants } = await supabase
    .from("servant_profiles")
    .select("id, full_name")
    .order("full_name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          People
          <span className="ml-2 text-base font-medium text-gray-500">
            ({people?.length || 0})
          </span>
        </h1>
        <Link
          href="/people/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Add Person
        </Link>
      </div>

      {/* Search & Filter */}
      <form className="flex flex-wrap gap-3 mb-4">
        {view && <input type="hidden" name="view" value={view} />}
        {family && <input type="hidden" name="family" value={family} />}
        {gender && <input type="hidden" name="gender" value={gender} />}
        {responsibleServantId && (
          <input
            type="hidden"
            name="responsibleServantId"
            value={responsibleServantId}
          />
        )}
        {safeNotAttendedInDays && (
          <input
            type="hidden"
            name="notAttendedInDays"
            value={String(safeNotAttendedInDays)}
          />
        )}
        {safeNotCheckedInDays && (
          <input
            type="hidden"
            name="notCheckedInDays"
            value={String(safeNotCheckedInDays)}
          />
        )}
        <input
          name="q"
          type="text"
          placeholder="Search by name or phone..."
          defaultValue={q || ""}
          className="flex-1 min-w-50 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
        >
          Search
        </button>
        {q && (
          <Link
            href={
              view
                ? `/people?view=${view}${family ? `&family=${encodeURIComponent(family)}` : ""}${gender ? `&gender=${encodeURIComponent(gender)}` : ""}${responsibleServantId ? `&responsibleServantId=${encodeURIComponent(responsibleServantId)}` : ""}${safeNotAttendedInDays ? `&notAttendedInDays=${safeNotAttendedInDays}` : ""}${safeNotCheckedInDays ? `&notCheckedInDays=${safeNotCheckedInDays}` : ""}`
                : "/people"
            }
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            Clear Search
          </Link>
        )}
      </form>

      <details
        className="mb-6 bg-white rounded-lg border border-gray-200 p-4"
        open
      >
        <summary className="cursor-pointer text-sm font-semibold text-gray-800">
          Filters
        </summary>
        <form className="mt-4 flex flex-wrap gap-3">
          {q && <input type="hidden" name="q" value={q} />}
          {view && <input type="hidden" name="view" value={view} />}
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
          <select
            name="responsibleServantId"
            defaultValue={responsibleServantId || ""}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Responsible Servants</option>
            {(servants || []).map((servant) => (
              <option key={servant.id} value={servant.id}>
                {servant.full_name}
              </option>
            ))}
          </select>
          <input
            name="notAttendedInDays"
            type="number"
            min={1}
            placeholder="Not attended in (days)"
            defaultValue={safeNotAttendedInDays ?? ""}
            className="w-52 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="notCheckedInDays"
            type="number"
            min={1}
            placeholder="Not checked in (days)"
            defaultValue={safeNotCheckedInDays ?? ""}
            className="w-52 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
          >
            Apply Filters
          </button>
          {(family ||
            gender ||
            responsibleServantId ||
            safeNotAttendedInDays ||
            safeNotCheckedInDays) && (
            <Link
              href={
                q
                  ? `/people?q=${encodeURIComponent(q)}${view ? `&view=${view}` : ""}`
                  : view
                    ? `/people?view=${view}`
                    : "/people"
              }
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </Link>
          )}
        </form>
      </details>

      {safeNotAttendedInDays && (
        <p className="mb-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
          Showing people who did not attend in the last {safeNotAttendedInDays}{" "}
          day(s).
        </p>
      )}
      {safeNotCheckedInDays && (
        <p className="mb-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
          Showing people not checked up in the last {safeNotCheckedInDays}{" "}
          day(s).
        </p>
      )}

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
                  <Link
                    href={`/people/${person.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {person.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                  {person.phone_primary ? (
                    <Link
                      href={getPhoneHref(person.phone_primary)}
                      className="text-blue-600 hover:underline"
                    >
                      {person.phone_primary}
                    </Link>
                  ) : (
                    "—"
                  )}
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
