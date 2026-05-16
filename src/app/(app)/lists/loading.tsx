import { ArcadePageSkeleton, SkeletonBlock } from "@/components/arcade/ArcadeSkeleton";

export default function ListsLoading() {
  return (
    <ArcadePageSkeleton>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <SkeletonBlock style={{ width: 80, height: 26, borderRadius: 8 }} />
      </div>

      {/* List grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonBlock key={i} style={{ height: 100, borderRadius: 20, opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </ArcadePageSkeleton>
  );
}
