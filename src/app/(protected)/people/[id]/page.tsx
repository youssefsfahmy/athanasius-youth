import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/require-profile";
import type {
  Person,
  AttendanceWithDetails,
  CheckupWithDetails,
} from "@/lib/types";
import PersonActions from "./person-actions";

function getPhoneHref(phoneNumber: string) {
  return `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
}

type DetailItem = {
  label: string;
  value: string | null;
  isPhone?: boolean;
};

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .single();

  if (!person) notFound();

  const { data: attendance } = await supabase
    .from("attendance")
    .select("*, people(full_name), servant_profiles(full_name)")
    .eq("person_id", id)
    .order("event_date", { ascending: false })
    .limit(20);

  const { data: checkups } = await supabase
    .from("checkups")
    .select("*, people(full_name), servant_profiles(full_name)")
    .eq("person_id", id)
    .order("checkup_date", { ascending: false })
    .limit(20);

  const p = person as Person;

  let checkupServantName: string | null = null;
  if (p.church_checkup_servant_id) {
    const { data: servant } = await supabase
      .from("servant_profiles")
      .select("full_name")
      .eq("id", p.church_checkup_servant_id)
      .maybeSingle();
    checkupServantName = servant?.full_name || null;
  }

  const sections: { title: string; items: DetailItem[] }[] = [
    {
      title: "Contact",
      items: [
        { label: "Primary Phone", value: p.phone_primary, isPhone: true },
        { label: "Secondary Phone", value: p.phone_secondary, isPhone: true },
        { label: "Landline", value: p.phone_landline, isPhone: true },
        { label: "Father's Phone", value: p.phone_father, isPhone: true },
        { label: "Mother's Phone", value: p.phone_mother, isPhone: true },
      ],
    },
    {
      title: "Personal",
      items: [
        { label: "Gender", value: p.gender },
        { label: "Birth Date", value: p.birth_date },
      ],
    },
    {
      title: "Address",
      items: [
        { label: "Area", value: p.address_area },
        { label: "Street", value: p.address_street },
        { label: "Building", value: p.address_building },
        { label: "Floor", value: p.address_floor },
        { label: "Apartment", value: p.address_apartment },
        { label: "Details", value: p.address_details },
        { label: "Landmark", value: p.address_landmark },
      ],
    },
    {
      title: "Education",
      items: [
        { label: "College", value: p.education_college },
        { label: "University", value: p.education_university },
        { label: "Year", value: p.education_year },
      ],
    },
    {
      title: "Church",
      items: [
        { label: "Confession Father", value: p.church_confession_father },
        { label: "Family Group", value: p.church_family_group },
        { label: "Family Servant", value: p.church_family_servant },
        { label: "Checkup Servant", value: checkupServantName },
        { label: "Last Checkup Date", value: p.church_last_checkup_date },
      ],
    },
    {
      title: "Other",
      items: [
        { label: "Facebook", value: p.social_facebook_url },
        { label: "Public Notes", value: p.notes_public },
        { label: "Private Notes", value: p.notes_private },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.full_name}
              className="h-20 w-20 rounded-xl object-cover border border-gray-200 bg-gray-50"
            />
          ) : (
            <div className="h-20 w-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-2xl font-semibold text-gray-400">
              {p.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <a
              href="/people"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to People
            </a>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {p.full_name}
            </h1>
          </div>
        </div>
        <PersonActions personId={id} />
      </div>

      {/* Person Details */}
      <div className="space-y-6 mb-10">
        {sections.map((section) => {
          const hasValues = section.items.some((item) => item.value);
          if (!hasValues) return null;
          return (
            <div
              key={section.title}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                {section.title}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items
                  .filter((item) => item.value)
                  .map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs text-gray-500">{item.label}</dt>
                      <dd className="text-sm text-gray-900 mt-0.5">
                        {item.isPhone && item.value ? (
                          <a
                            href={getPhoneHref(item.value)}
                            className="text-blue-600 hover:underline"
                          >
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          );
        })}
      </div>

      {/* Attendance History */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance History
          </h2>
          <a
            href={`/attendance?person_id=${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Add Attendance
          </a>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">
                  Date
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">
                  Event
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 hidden sm:table-cell">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {((attendance as AttendanceWithDetails[]) || []).map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-gray-900">{a.event_date}</td>
                  <td className="px-4 py-2 text-gray-600">{a.event_name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        a.status === "present"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">
                    {a.servant_profiles?.full_name || "—"}
                  </td>
                </tr>
              ))}
              {(!attendance || attendance.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No attendance records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkup History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Checkup History
          </h2>
          <a
            href={`/checkups?person_id=${id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Add Checkup
          </a>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">
                  Date
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">
                  Method
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 hidden sm:table-cell">
                  Comment
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 hidden sm:table-cell">
                  Contacted By
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">
                  Follow-up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {((checkups as CheckupWithDetails[]) || []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-gray-900">{c.checkup_date}</td>
                  <td className="px-4 py-2 text-gray-600">{c.method}</td>
                  <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">
                    {c.comment || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600 hidden sm:table-cell">
                    {c.servant_profiles?.full_name || "—"}
                  </td>
                  <td className="px-4 py-2">
                    {c.follow_up_needed ? (
                      <span className="text-xs text-orange-600 font-medium">
                        {c.next_follow_up_date || "Yes"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!checkups || checkups.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No checkup records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
