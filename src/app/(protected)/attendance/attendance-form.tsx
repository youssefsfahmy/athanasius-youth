"use client";

import { useState, useRef, useEffect } from "react";
import { createAttendance } from "./actions";
import LoadingOverlay from "@/components/loading-overlay";
import Link from "next/link";

type Props = {
  people: { id: string; full_name: string }[];
  defaultPersonId?: string;
};

function getMondayOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const d = monday.getDate();
  const m = monday.getMonth() + 1;
  const y = monday.getFullYear();
  return `Monday meeting ${d}-${m}-${y}`;
}

export default function AttendanceForm({ people, defaultPersonId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => {
    if (defaultPersonId) {
      const found = people.find((p) => p.id === defaultPersonId);
      return found?.full_name || "";
    }
    return "";
  });
  const [selectedId, setSelectedId] = useState(defaultPersonId || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? people.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()),
      )
    : people;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await createAttendance(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      // redirect() throws — keep loading visible during navigation
    }
  }

  return (
    <>
      {loading && <LoadingOverlay message="Recording attendance..." />}
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <fieldset disabled={loading} className="space-y-4">
          <div ref={wrapperRef} className="relative">
            <label
              htmlFor="person_search"
              className="block text-sm text-gray-600 mb-1"
            >
              Person *
            </label>
            <input type="hidden" name="person_id" value={selectedId} />
            <input
              id="person_search"
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedId("");
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id);
                        setSearch(p.full_name);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50"
                    >
                      {p.full_name}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-sm text-gray-500 mb-2">No match found</p>
                    <Link
                      href="/people/new"
                      className="inline-block px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      + Add New Member
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="event_date"
                className="block text-sm text-gray-600 mb-1"
              >
                Date *
              </label>
              <input
                id="event_date"
                name="event_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="event_name"
                className="block text-sm text-gray-600 mb-1"
              >
                Event Name *
              </label>
              <input
                id="event_name"
                name="event_name"
                type="text"
                required
                defaultValue={getMondayOfWeek()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm text-gray-600 mb-1"
              >
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="notes"
                className="block text-sm text-gray-600 mb-1"
              >
                Notes
              </label>
              <input
                id="notes"
                name="notes"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Record Attendance"}
        </button>
      </form>
    </>
  );
}
