'use client';

import React from 'react';
import { Play } from 'lucide-react';

type ControlsProps = {
  isStreaming: boolean;
  onNext: () => void;
  // selectedSkill, onInterrupt は不要になるため型定義からも削除（※親コンポーネント側でエラーが出ないよう注意）
};

export default function Controls({
  isStreaming,
  onNext,
}: ControlsProps) {
  return (
    <div className="p-4 sm:p-5 bg-theme-bg-dark border-t border-theme-border-base/50 shrink-0 relative shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-center">
      
      <div className="flex justify-end items-end w-full max-w-2xl mx-auto">
        <button
          onClick={onNext}
          disabled={isStreaming}
          className="h-12 sm:h-14 px-8 bg-theme-accent-main hover:bg-theme-accent-main-hover text-white rounded-xl font-bold flex items-center justify-center transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 border border-theme-accent-main/80"
          aria-label="Next Text"
        >
          <span className="mr-2 tracking-widest text-sm uppercase">NEXT</span>
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