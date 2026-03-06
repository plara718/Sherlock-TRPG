'use client';

import React from 'react';

type TitleViewProps = {
  hasSaveData: boolean;
  onStart: () => void;
  onReset: () => void;
  currentSeason?: number;
  clearedData?: Record<string, any>;
};

export default function TitleView({
  hasSaveData,
  onStart,
  onReset,
  currentSeason = 1,
  clearedData = {},
}: TitleViewProps) {
  
  // 進行度の判定
  const isPostReichenbach = currentSeason >= 4 || Object.keys(clearedData).includes('#40');
  const isSeason3 = currentSeason === 3 && !isPostReichenbach;

  // テーマカラーとテキストの設定
  const theme = {
    bg: isPostReichenbach ? 'bg-zinc-950' : isSeason3 ? 'bg-[#1a0f0f]' : 'bg-[#1a1512]',
    textAccent: isPostReichenbach ? 'text-zinc-500' : isSeason3 ? 'text-rose-700' : 'text-amber-700',
    borderAccent: isPostReichenbach ? 'border-zinc-800' : isSeason3 ? 'border-rose-900/50' : 'border-amber-700/80',
    buttonText: isPostReichenbach ? 'text-zinc-400' : isSeason3 ? 'text-rose-500' : 'text-amber-500',
    buttonHoverBg: isPostReichenbach ? 'hover:bg-zinc-900/40' : isSeason3 ? 'hover:bg-rose-900/40' : 'hover:bg-amber-900/40',
    buttonHoverText: isPostReichenbach ? 'hover:text-zinc-300' : isSeason3 ? 'hover:text-rose-400' : 'hover:text-amber-400',
    buttonHoverBorder: isPostReichenbach ? 'hover:border-zinc-600' : isSeason3 ? 'hover:border-rose-500' : 'hover:border-amber-500',
    shadow: isPostReichenbach ? 'shadow-[0_0_20px_rgba(82,82,91,0.15)]' : isSeason3 ? 'shadow-[0_0_30px_rgba(225,29,72,0.3)]' : 'shadow-[0_0_20px_rgba(180,83,9,0.15)]',
    subtitle: isPostReichenbach ? "Connect to the silent records." : isSeason3 ? "WARNING: FATAL PARANOIA DETECTED." : "Connect to the mind of Sherlock Holmes.",
    systemStatus: isPostReichenbach ? "SYSTEM STANDBY" : isSeason3 ? "SYSTEM COMPROMISED" : "SYSTEM READY"
  };

  return (
    <div className={`h-[100dvh] w-full ${theme.bg} flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-1000`}>
      
      {/* 背景の走査線/ノイズエフェクト */}
      <div className={`absolute inset-0 flex flex-col justify-between pointer-events-none z-0 ${isSeason3 ? 'opacity-20 animate-pulse' : 'opacity-10'}`}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`w-full h-px ${isPostReichenbach ? 'bg-zinc-600' : isSeason3 ? 'bg-rose-600' : 'bg-[#8c7a6b]/30'}`} />
        ))}
      </div>

      {/* Season 3 専用の禍々しい背景テキスト */}
      {isSeason3 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-10">
          <div className="text-[30vw] font-serif font-black text-rose-600 tracking-tighter whitespace-nowrap">
            M.C.
          </div>
        </div>
      )}

      {/* Season 3 クリア後の雨エフェクト（CSSによる疑似表現） */}
      {isPostReichenbach && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] animate-[slide-down_0.5s_linear_infinite]" />
      )}

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
        <h2 className={`${theme.textAccent} font-mono text-xs sm:text-sm tracking-[0.3em] mb-4 drop-shadow-md ${isSeason3 ? 'animate-pulse' : ''}`}>
          {theme.systemStatus}
        </h2>
        
        <h1 className={`text-5xl sm:text-7xl font-serif font-bold tracking-widest mb-2 border-b pb-4 ${isPostReichenbach ? 'text-zinc-300 border-zinc-700' : isSeason3 ? 'text-rose-100 border-rose-900' : 'text-[#f4ebd8] border-[#5c4d43]'}`}>
          TETHER
        </h1>
        
        <p className={`font-serif italic text-sm sm:text-base mb-16 max-w-sm ${isPostReichenbach ? 'text-zinc-600' : isSeason3 ? 'text-rose-500 font-bold tracking-widest' : 'text-[#8c7a6b]'}`}>
          {theme.subtitle}
        </p>

        <button
          onClick={onStart}
          className={`group relative px-8 py-4 bg-transparent border ${theme.borderAccent} ${theme.buttonText} font-bold font-mono tracking-widest rounded-full ${theme.buttonHoverBg} ${theme.buttonHoverText} ${theme.buttonHoverBorder} transition-all duration-300 active:scale-95 ${theme.shadow} backdrop-blur-sm`}
        >
          {hasSaveData ? '> RESUME CONNECTION' : '> INITIALIZE TETHER'}
        </button>

        {hasSaveData && (
          <button
            onClick={onReset}
            className={`mt-12 text-[10px] sm:text-xs font-mono transition-colors underline decoration-dotted tracking-widest active:scale-95 ${isPostReichenbach ? 'text-zinc-700 hover:text-zinc-400' : 'text-[#5c4d43] hover:text-rose-600'}`}
          >
            [ DEBUG: FORMAT SYSTEM ]
          </button>
        )}
      </div>
    </div>
  );
}