import React from "react";
import { AlertTriangle, Home } from "lucide-react";

interface NotFoundProps {
  onBackToHome: () => void;
}

export default function NotFound({ onBackToHome }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-4">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 rounded-2xl border border-amber-200/50 dark:border-amber-900/50">
        <AlertTriangle className="h-10 w-10 animate-pulse" />
      </div>
      <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white">
        Academic Route Not Discovered
      </h1>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
        The requested panel resource or node mapping could not be resolved by the system.
      </p>
      <button
        onClick={onBackToHome}
        className="bg-blue-600 hover:bg-blue-750 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 flex items-center space-x-1.5 transition-all cursor-pointer"
      >
        <Home className="h-4 w-4" />
        <span>Back to dashboard</span>
      </button>
    </div>
  );
}
