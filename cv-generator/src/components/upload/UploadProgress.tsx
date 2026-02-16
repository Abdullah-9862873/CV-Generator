"use client";

import React from "react";
import { Loader2, CheckCircle, AlertCircle, X, Sparkles, FileSearch } from "lucide-react";

export type ProgressState = "processing" | "completed" | "error";

interface UploadProgressProps {
  progress: number;
  status: string;
  state?: ProgressState;
  onCancel?: () => void;
  errorMessage?: string;
  className?: string;
}

const getStateIcon = (state: ProgressState) => {
  switch (state) {
    case "processing":
      return (
        <div className="relative">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <div className="absolute inset-0 blur-lg bg-blue-400/30 rounded-full" />
        </div>
      );
    case "completed":
      return (
        <div className="relative">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div className="absolute inset-0 animate-ping bg-green-400/20 rounded-full" />
        </div>
      );
    case "error":
      return <AlertCircle className="h-8 w-8 text-red-500" />;
    default:
      return null;
  }
};

const getStateStyles = (state: ProgressState) => {
  switch (state) {
    case "processing":
      return {
        container: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
        bar: "bg-gradient-to-r from-blue-500 to-blue-600",
        track: "bg-blue-200/50",
        text: "text-blue-900",
        subtext: "text-blue-600",
      };
    case "completed":
      return {
        container: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
        bar: "bg-gradient-to-r from-green-500 to-emerald-500",
        track: "bg-green-200/50",
        text: "text-green-900",
        subtext: "text-green-700",
      };
    case "error":
      return {
        container: "bg-gradient-to-br from-red-50 to-orange-50 border-red-200",
        bar: "bg-gradient-to-r from-red-500 to-orange-500",
        track: "bg-red-200/50",
        text: "text-red-900",
        subtext: "text-red-700",
      };
    default:
      return {
        container: "bg-white border-gray-200",
        bar: "bg-blue-600",
        track: "bg-gray-200",
        text: "text-gray-900",
        subtext: "text-gray-500",
      };
  }
};

export function UploadProgress({
  progress,
  status,
  state = "processing",
  onCancel,
  errorMessage,
  className = "",
}: UploadProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const styles = getStateStyles(state);

  return (
    <div className={`w-full animate-fade-in-up ${className}`}>
      <div className={`rounded-2xl border p-6 shadow-lg transition-all duration-500 ${styles.container}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {getStateIcon(state)}
            </div>

            <div>
              <h3 className={`font-bold text-lg ${styles.text}`}>
                {status}
              </h3>
              {state === "processing" && (
                <p className={`text-sm mt-1 flex items-center gap-2 ${styles.subtext}`}>
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  AI is analyzing your CV...
                </p>
              )}
              {state === "completed" && (
                <p className={`text-sm mt-1 ${styles.subtext}`}>
                  Ready to edit and customize!
                </p>
              )}
            </div>
          </div>

          {state === "processing" && onCancel && (
            <button
              onClick={onCancel}
              className="
                p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 
                rounded-xl transition-all duration-200 hover:scale-110
                focus:outline-none focus:ring-2 focus:ring-gray-400
                shadow-sm hover:shadow-md
              "
              aria-label="Cancel processing"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="relative">
          <div className={`h-4 w-full rounded-full overflow-hidden ${styles.track} shadow-inner`}>
            <div
              className={`
                h-full rounded-full transition-all duration-500 ease-out relative
                ${styles.bar}
              `}
              style={{ width: `${clampedProgress}%` }}
              role="progressbar"
              aria-valuenow={clampedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className={`text-sm font-medium ${styles.subtext}`}>
              {state === "completed" ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Complete!
                </span>
              ) : state === "error" ? (
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Failed
                </span>
              ) : (
                `${Math.round(clampedProgress)}%`
              )}
            </span>
            {state === "processing" && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <FileSearch className="h-3 w-3" />
                Extracting text from image...
              </span>
            )}
          </div>
        </div>

        {state === "error" && errorMessage && (
          <div className="mt-5 p-4 bg-red-100/80 rounded-xl border border-red-200 animate-fade-in">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        )}

        {state === "completed" && (
          <div className="mt-5 p-4 bg-green-100/80 rounded-xl border border-green-200 animate-fade-in">
            <p className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Text extraction complete! You can now edit your CV.
            </p>
          </div>
        )}

        {state === "processing" && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`
                  h-1.5 rounded-full transition-all duration-500
                  ${progress > (i + 1) * 33
                    ? "w-6 bg-blue-500"
                    : "w-1.5 bg-blue-200"
                  }
                `}
                style={{ transitionDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CompactProgress({
  progress,
  status,
}: {
  progress: number;
  status: string;
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
          {status}
        </span>
        <span className="text-sm font-bold text-blue-600">{Math.round(clampedProgress)}%</span>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${clampedProgress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default UploadProgress;
