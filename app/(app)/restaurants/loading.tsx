import Skeleton from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-3 w-24 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <li key={i} className="postcard flex gap-0">
            <Skeleton className="size-28 shrink-0 rounded-none" />
            <div className="flex-1 py-3 px-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
