"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  fetchNotAttendedData,
  type NotAttendedData,
} from "./not-attended-actions";

interface DashboardFilters {
  view: string;
  gender?: string;
  familyGroup: string | null;
  profileId: string;
}

export default function NotAttendedSection({
  notAttendedInDays: initialDays,
  filters,
}: {
  notAttendedInDays: number;
  filters: DashboardFilters;
}) {
  const [notAttendedInDays, setNotAttendedInDays] = useState(initialDays);
  const [people, setPeople] = useState<NotAttendedData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    fetchNotAttendedData({
      ...filters,
      notAttendedInDays,
    }).then((result) => {
      if (requestId !== requestIdRef.current) return;
      setPeople(result.people);
      setTotalCount(result.totalCount);
      setLoading(false);
    });
  }, [notAttendedInDays, filters]);

  const viewAllHref = (() => {
    const p = new URLSearchParams();
    p.set("notAttendedInDays", String(notAttendedInDays));
    if (filters.view === "mine") {
      p.set("responsibleServantId", filters.profileId);
    }
    if (filters.view === "family" && filters.familyGroup) {
      p.set("family", filters.familyGroup);
    }
    if (filters.gender) p.set("gender", filters.gender);
    return `/people?${p.toString()}`;
  })();

  return (
    <div className="h-full">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-600">
          Not Attended In:
        </label>
        <select
          value={notAttendedInDays}
          onChange={(e) => {
            setLoading(true);
            setNotAttendedInDays(parseInt(e.target.value, 10));
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Not Attended in {notAttendedInDays}+ Days ({totalCount})
          </h2>
          <Link
            href={viewAllHref}
            className="px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : people && people.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {people.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <Link
                  href={`/people/${p.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {p.full_name}
                </Link>
                <span className="text-xs text-gray-400">
                  <Link
                    href={`/attendance?person_id=${p.id}`}
                    className="hover:text-blue-600"
                  >
                    Record
                  </Link>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Everyone attended recently!</p>
        )}
      </div>
    </div>
  );
}
