"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  fetchNotCheckedUpData,
  type NotCheckedUpData,
} from "./not-checked-up-actions";

interface DashboardFilters {
  view: string;
  gender?: string;
  familyGroup: string | null;
  profileId: string;
}

export default function NotCheckedUpSection({
  notCheckedInDays: initialDays,
  filters,
}: {
  notCheckedInDays: number;
  filters: DashboardFilters;
}) {
  const [notCheckedInDays, setNotCheckedInDays] = useState(initialDays);
  const [people, setPeople] = useState<NotCheckedUpData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    fetchNotCheckedUpData({
      ...filters,
      notCheckedInDays,
    }).then((result) => {
      if (requestId !== requestIdRef.current) return;
      setPeople(result.people);
      setTotalCount(result.totalCount);
      setLoading(false);
    });
  }, [notCheckedInDays, filters]);

  const viewAllHref = (() => {
    const p = new URLSearchParams();
    p.set("notCheckedInDays", String(notCheckedInDays));
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
          Not Checked In:
        </label>
        <select
          value={notCheckedInDays}
          onChange={(e) => {
            setLoading(true);
            setNotCheckedInDays(parseInt(e.target.value, 10));
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
            Not Checked Up in {notCheckedInDays}+ Days ({totalCount})
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
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm text-blue-600 hover:underline">
                  {p.full_name}
                </span>
                <span className="text-xs text-gray-400">
                  {p.church_last_checkup_date || "Never"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Everyone is checked up!</p>
        )}
      </div>
    </div>
  );
}
