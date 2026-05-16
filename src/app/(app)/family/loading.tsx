import { ArcadePageSkeleton, SkeletonBlock } from "@/components/arcade/ArcadeSkeleton";

export default function FamilyLoading() {
  return (
    <ArcadePageSkeleton>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <SkeletonBlock style={{ width: 80, height: 26, borderRadius: 8 }} />
      </div>

      {/* Member cards */}
      <div className="px-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} style={{ height: 96, borderRadius: 20, opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </ArcadePageSkeleton>
  );
}
