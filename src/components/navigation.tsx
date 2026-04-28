import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Navigation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("servant_profiles")
    .select("full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center space-x-6">
            <a href="/dashboard" className="font-bold text-lg text-gray-900">
              Athanasius
            </a>
            <div className="hidden sm:flex space-x-4">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/people">People</NavLink>
              <NavLink href="/attendance">Attendance</NavLink>
              <NavLink href="/checkups">Checkups</NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/profile"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {profile?.full_name || user.email}
            </a>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex space-x-4 pb-2 overflow-x-auto">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/people">People</NavLink>
          <NavLink href="/attendance">Attendance</NavLink>
          <NavLink href="/checkups">Checkups</NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap"
    >
      {children}
    </a>
  );
}
