import { requireProfile } from "@/lib/require-profile";
import DashboardFilters from "./filters/dashboard-filters";
import StatsSection from "./stats/stats-section";
import RecentAttendance from "./attendance/recent-attendance";
import NotAttendedSection from "./attendance/not-attended-section";
import NeedsFollowUp from "./checkups/needs-followup";
import NotCheckedUpSection from "./checkups/not-checked-up-section";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    gender?: string;
  }>;
}) {
  const { familyGroup, profileId } = await requireProfile();
  const { view: viewParam, gender } = await searchParams;
  const view = viewParam || (familyGroup ? "family" : "all");

  const filters = {
    view,
    gender,
    familyGroup,
    profileId,
    notCheckedInDays: 30,
    notAttendedInDays: 30,
  };

  return (
    <div className="min-w-10/12">
      <DashboardFilters {...filters} />
      <StatsSection {...filters} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAttendance {...filters} />
        <NeedsFollowUp {...filters} />
        <NotCheckedUpSection
          notCheckedInDays={30}
          filters={{ view, gender, familyGroup, profileId }}
        />
        <NotAttendedSection
          notAttendedInDays={30}
          filters={{ view, gender, familyGroup, profileId }}
        />
      </div>
    </div>
  );
}
