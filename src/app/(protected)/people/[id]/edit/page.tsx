import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/require-profile";
import PersonForm from "@/components/person-form";
import { updatePerson } from "../../actions";
import type { Person } from "@/lib/types";
import Link from "next/link";

export default async function EditPersonPage({
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

  const { data: servants } = await supabase
    .from("servant_profiles")
    .select("id, full_name")
    .order("full_name");

  if (!person) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    return updatePerson(id, formData);
  }

  return (
    <div>
      <Link
        href={`/people/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Profile
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-6">
        Edit: {(person as Person).full_name}
      </h1>
      <PersonForm
        person={person as Person}
        action={handleUpdate}
        submitLabel="Save Changes"
        servants={servants || []}
      />
    </div>
  );
}
