export default function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-orange-200 bg-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm text-gray-600">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-orange-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
