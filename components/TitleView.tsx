'use client';

import React from 'react';

type TitleViewProps = {
  hasSaveData: boolean;
  onStart: () => void;
  onReset: () => void;
};

export default function TitleView({
  hasSaveData,
  onStart,
  onReset,
}: TitleViewProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* 背景の走査線エフェクト */}
      <div className="absolute inset-0 opacity-10 flex flex-col justify-between pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-full h-px bg-slate-500" />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center text-center">
        <h2 className="text-amber-500 font-mono text-xs tracking-[0.3em] mb-4">
          SYSTEM READY
        </h2>
        <h1 className="text-5xl sm:text-7xl font-serif font-bold text-white tracking-widest mb-2 border-b-2 border-slate-700 pb-4">
          TETHER
        </h1>
        <p className="text-slate-400 font-serif italic text-sm sm:text-base mb-16 max-w-sm">
          Connect to the mind of Sherlock Holmes.
        </p>

        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-transparent border-2 border-amber-600 text-amber-500 font-bold font-mono tracking-widest hover:bg-amber-600 hover:text-slate-900 transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
        >
          {hasSaveData ? '> RESUME CONNECTION' : '> INITIALIZE TETHER'}
        </button>

        {hasSaveData && (
          <button
            onClick={onReset}
            className="mt-8 text-[10px] font-mono text-slate-500 hover:text-red-500 transition-colors underline decoration-dotted tracking-widest"
          >
            [ DEBUG: FORMAT SYSTEM ]
          </button>
        )}
      </div>
    </div>
  );
}
