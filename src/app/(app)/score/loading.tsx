import { ArcadePageSkeleton, SkeletonBlock } from "@/components/arcade/ArcadeSkeleton";

export default function ScoreLoading() {
  return (
    <ArcadePageSkeleton>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <SkeletonBlock style={{ width: 100, height: 26, borderRadius: 8 }} />
      </div>

      {/* Podium */}
      <div className="mx-4 mb-4">
        <SkeletonBlock style={{ height: 180, borderRadius: 22 }} />
      </div>

      {/* Rank tiles */}
      <div className="px-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <SkeletonBlock key={i} style={{ height: 64, borderRadius: 18, opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    </ArcadePageSkeleton>
  );
}
