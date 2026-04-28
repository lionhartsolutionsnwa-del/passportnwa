import Skeleton from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center space-y-2">
        <Skeleton className="h-3 w-32 mx-auto" />
        <Skeleton className="h-10 w-56 mx-auto" />
      </header>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="postcard overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="w-full h-72 rounded-none" />
          <div className="px-5 py-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
