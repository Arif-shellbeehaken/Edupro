import { SkeletonCards, SkeletonList } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="page-pad">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <SkeletonCards count={4} />
      <div className="mt-6">
        <SkeletonList rows={6} />
      </div>
    </div>
  );
}
