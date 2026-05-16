import { ArcadePageSkeleton, SkeletonBlock } from "@/components/arcade/ArcadeSkeleton";

export default function DashboardLoading() {
  return (
    <ArcadePageSkeleton>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <SkeletonBlock style={{ width: 48, height: 10, marginBottom: 6, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: 96, height: 24, borderRadius: 8 }} />
      </div>

      {/* LevelCard */}
      <div className="mx-4 mt-3 mb-4">
        <SkeletonBlock style={{ height: 120, borderRadius: 22 }} />
      </div>

      {/* Avatar filter strip */}
      <div className="flex gap-2 px-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} style={{ width: 56, height: 32, borderRadius: 999 }} />
        ))}
      </div>

      {/* Section head */}
      <div className="px-4 mb-2">
        <SkeletonBlock style={{ width: 80, height: 14, borderRadius: 6 }} />
      </div>

      {/* Mission rows */}
      <div className="px-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} style={{ height: 72, borderRadius: 18, opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </ArcadePageSkeleton>
  );
}
