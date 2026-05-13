import { cn } from "@/lib/utils";
import { BUCKET_META, type TaskBucket } from "@/lib/arcade";

interface SectionHeadProps {
  bucket: TaskBucket;
  count: number;
  className?: string;
}

export function SectionHead({ bucket, count, className }: SectionHeadProps) {
  const meta = BUCKET_META[bucket];

  return (
    <div className={cn("flex items-center gap-2 px-1 mt-5 mb-2", className)}>
      <span className="text-base leading-none">{meta.emoji}</span>
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>
      <span
        className="text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
        style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
      >
        {count}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to right, ${meta.color}44, transparent)`,
        }}
      />
    </div>
  );
}
