type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-slate-200/70",
        className ?? "h-4 w-full",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

