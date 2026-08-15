import React from "react";

interface EmptyStateProps {
  onRefresh?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center shadow-xl backdrop-blur-md">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-200">No Monitoring Records Found</h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
        The PostgreSQL database does not contain any system metrics yet. Run the monitor script (
        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">
          python monitor.py
        </code>
        ) to start collecting data.
      </p>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-6 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-950/50"
        >
          Check Again
        </button>
      )}
    </div>
  );
};
