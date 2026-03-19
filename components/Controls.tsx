'use client';

import React from 'react';
import { Play } from 'lucide-react';

type ControlsProps = {
  isStreaming: boolean;
  onNext: () => void;
};

export default function Controls({
  isStreaming,
  onNext,
}: ControlsProps) {
  return (
    <div className="p-4 sm:p-5 bg-theme-bg-dark border-t border-theme-border-base/50 shrink-0 relative shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-2xl mx-auto flex justify-end">
        <button
          onClick={onNext}
          disabled={isStreaming}
          className="h-12 sm:h-14 px-8 bg-theme-bg-panel hover:bg-theme-bg-dark-panel text-theme-text-light rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 border border-theme-border-base/50 gap-2 w-full sm:w-auto"
          aria-label="Next Text"
        >
          <span className="tracking-[0.2em] text-sm sm:text-base font-serif">NEXT</span>
          <Play
            className={`w-4 h-4 sm:w-5 sm:h-5 fill-current ${
              isStreaming ? 'opacity-50' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}