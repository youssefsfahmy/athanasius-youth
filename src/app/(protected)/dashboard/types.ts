export type DashboardFilters = {
  view: string;
  gender: string | undefined;
  familyGroup: string | null;
  profileId: string;
  notCheckedInDays: number;
  notAttendedInDays: number;
};
