import React from "react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="rounded-2xl border border-rose-900/60 bg-rose-950/40 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-900/40 border border-rose-700/50 text-rose-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-200">
              Unable to Connect to FastAPI Backend
            </h3>
            <p className="text-xs sm:text-sm text-rose-300/80 mt-1">
              {message}. Please verify the FastAPI server is running on{" "}
              <code className="bg-rose-900/60 px-1.5 py-0.5 rounded font-mono text-rose-100">
                {process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000"}
              </code>
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50 shrink-0 self-end sm:self-center"
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};
