import React from 'react';

export function StatCardSkeleton() {
  return (
    <div className="card-clean p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-surface-200 rounded w-1/3"></div>
        <div className="w-8 h-8 bg-surface-100 rounded-lg"></div>
      </div>
      <div className="mt-4 h-7 bg-surface-200 rounded w-1/2"></div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-4 bg-surface-100 rounded w-1/4"></div>
        <div className="h-3 bg-surface-100 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className={`card-clean p-5 animate-pulse flex flex-col justify-between ${height}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-surface-200 rounded w-1/4"></div>
        <div className="h-6 bg-surface-100 rounded w-24"></div>
      </div>
      <div className="flex items-end gap-3 h-48 pt-6">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-surface-100 rounded-t flex-1"
            style={{ height: `${Math.max(20, Math.sin(idx) * 60 + 35)}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <div className="h-3 bg-surface-100 rounded w-12"></div>
        <div className="h-3 bg-surface-100 rounded w-12"></div>
        <div className="h-3 bg-surface-100 rounded w-12"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="card-clean p-5 animate-pulse space-y-4">
      <div className="h-4 bg-surface-200 rounded w-1/4"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-4 bg-surface-100 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonLoader({ count = 3, height = 'h-24', className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-xl border border-surface-200 p-4 animate-pulse ${height}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-3/4">
              <div className="h-4 bg-surface-200 rounded w-1/2"></div>
              <div className="h-3 bg-surface-100 rounded w-full"></div>
            </div>
            <div className="h-5 bg-surface-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
