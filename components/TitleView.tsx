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
    <div className="h-[100dvh] w-full bg-[#1a1512] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* 背景の走査線/ノイズエフェクト（ヴィンテージ風） */}
      <div className="absolute inset-0 opacity-10 flex flex-col justify-between pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-full h-px bg-[#8c7a6b]/30" />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
        <h2 className="text-amber-700 font-mono text-xs sm:text-sm tracking-[0.3em] mb-4 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]">
          SYSTEM READY
        </h2>
        
        <h1 className="text-5xl sm:text-7xl font-serif font-bold text-[#f4ebd8] tracking-widest mb-2 border-b border-[#5c4d43] pb-4">
          TETHER
        </h1>
        
        <p className="text-[#8c7a6b] font-serif italic text-sm sm:text-base mb-16 max-w-sm">
          Connect to the mind of Sherlock Holmes.
        </p>

        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-[#1a1512] border border-amber-700/80 text-amber-500 font-bold font-mono tracking-widest rounded-full hover:bg-amber-900/40 hover:text-amber-400 hover:border-amber-500 transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(180,83,9,0.15)]"
        >
          {hasSaveData ? '> RESUME CONNECTION' : '> INITIALIZE TETHER'}
        </button>

        {hasSaveData && (
          <button
            onClick={onReset}
            className="mt-12 text-[10px] sm:text-xs font-mono text-[#5c4d43] hover:text-rose-600 transition-colors underline decoration-dotted tracking-widest active:scale-95"
          >
            [ DEBUG: FORMAT SYSTEM ]
          </button>
        )}
      </div>
    </div>
  );
}