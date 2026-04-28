import Skeleton from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="-mx-4 -my-6 px-0 pb-32" style={{ background: "linear-gradient(180deg, #f7eeda 0%, #f1e4c8 100%)" }}>
      <div className="passport-cover px-6 pt-7 pb-10 mx-4 mt-2 rounded-2xl">
        <div className="flex items-center gap-5">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
      </div>
      <div className="mx-6 mt-6 grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <div className="mx-6 mt-8 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      </div>
    </div>
  );
}
