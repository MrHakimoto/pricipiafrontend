import { Skeleton } from "../ui/skeleton";

export function ProfileCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center w-full max-w-sm">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-4 w-32 mt-4" />
      <Skeleton className="h-3 w-40 mt-2" />
      <div className="w-full mt-6">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <Skeleton className="h-4 w-24 mt-6" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  )
}
