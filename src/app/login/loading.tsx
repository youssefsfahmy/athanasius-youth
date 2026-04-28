import Spinner from "@/components/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner />
    </div>
  );
}
