import Spinner from "@/components/spinner";

export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-[1px] cursor-wait">
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
        <Spinner className="pb-3" />
        <p className="text-center text-sm font-medium text-gray-700">
          {message}
        </p>
      </div>
    </div>
  );
}
