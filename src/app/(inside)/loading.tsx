import { LoadingSpinner } from "@/components/ui/spinnerLoading";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0B0B]">
    <LoadingSpinner className="p-2 h-100 w-100" />
    </div>
  );
}
