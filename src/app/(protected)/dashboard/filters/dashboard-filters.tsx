"use client";

import Link from "next/link";
import type { DashboardFilters } from "../types";

export default function DashboardFilters({
  view,
  gender,
  familyGroup,
}: DashboardFilters) {
  function filterUrl(params: { view?: string; gender?: string }) {
    const p = new URLSearchParams();
    const v = params.view ?? view;
    const g = params.gender !== undefined ? params.gender : gender || "";
    p.set("view", v || "all");
    if (g) p.set("gender", g);
    return `/dashboard?${p.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Dashboard
        {view === "family" && familyGroup && (
          <span className="text-base font-normal text-gray-500 ml-2">
            — {familyGroup}
          </span>
        )}
        {view === "mine" && (
          <span className="text-base font-normal text-gray-500 ml-2">
            — My People
          </span>
        )}
      </h1>
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-md border border-gray-300 text-sm overflow-hidden">
          {familyGroup && (
            <Link
              href={filterUrl({ view: "family" })}
              className={`px-3 py-1.5 ${
                view === "family"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              My Family
            </Link>
          )}
          <Link
            href={filterUrl({ view: "mine" })}
            className={`px-3 py-1.5 ${familyGroup ? "border-l border-gray-300 " : ""}${
              view === "mine"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            My People
          </Link>
          <Link
            href={filterUrl({ view: "all" })}
            className={`px-3 py-1.5 border-l border-gray-300 ${
              view === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </Link>
        </div>
        <div className="flex rounded-md border border-gray-300 text-sm overflow-hidden">
          <Link
            href={filterUrl({ gender: "" })}
            className={`px-3 py-1.5 ${
              !gender
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </Link>
          <Link
            href={filterUrl({ gender: "M" })}
            className={`px-3 py-1.5 border-l border-gray-300 ${
              gender === "M"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Male
          </Link>
          <Link
            href={filterUrl({ gender: "F" })}
            className={`px-3 py-1.5 border-l border-gray-300 ${
              gender === "F"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Female
          </Link>
        </div>
      </div>
    </div>
  );
}
