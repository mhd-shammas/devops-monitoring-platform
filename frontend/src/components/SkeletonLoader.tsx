import React from "react";

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Status card skeleton */}
      <div className="h-32 rounded-2xl bg-slate-800/60 border border-slate-700/40 p-6" />

      {/* Grid metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-800/60 border border-slate-700/40 p-5" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="h-64 rounded-2xl bg-slate-800/60 border border-slate-700/40 p-6" />
    </div>
  );
};
