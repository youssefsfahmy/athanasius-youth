import PersonForm from "@/components/person-form";
import { createPerson } from "../actions";
import { requireProfile } from "@/lib/require-profile";
import { createClient } from "@/lib/supabase/server";

export default async function NewPersonPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: servants } = await supabase
    .from("servant_profiles")
    .select("id, full_name")
    .order("full_name");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Person</h1>
      <PersonForm
        action={createPerson}
        submitLabel="Create Person"
        servants={servants || []}
      />
    </div>
  );
}
