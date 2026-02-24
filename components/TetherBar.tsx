'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Archive, BrainCircuit } from 'lucide-react';

type TetherBarProps = {
  tether: number;
  onArchiveClick: () => void;
};

export default function TetherBar({ tether, onArchiveClick }: TetherBarProps) {
  const [flash, setFlash] = useState<'success' | 'damage' | null>(null);
  const prevTether = useRef(tether);

  useEffect(() => {
    if (tether > prevTether.current) {
      setFlash('success');
    } else if (tether < prevTether.current) {
      setFlash('damage');
    }
    prevTether.current = tether;

    const timer = setTimeout(() => {
      setFlash(null);
    }, 1000); // 1秒後に元の色に戻す

    return () => clearTimeout(timer);
  }, [tether]);

  return (
    <div
      className={`p-3 sm:p-4 border-b border-[#3a2f29] flex justify-between items-center transition-colors duration-500 z-20 shadow-md shrink-0 ${
        flash === 'success'
          ? 'bg-emerald-900/20'
          : flash === 'damage'
          ? 'bg-rose-900/20'
          : 'bg-[#2a2420]'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <BrainCircuit
          className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${
            flash === 'success'
              ? 'text-emerald-500'
              : flash === 'damage'
              ? 'text-rose-500'
              : 'text-amber-600'
          }`}
        />
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1 font-mono tracking-widest">
            <span className="text-[#8c7a6b]">TETHER</span>
            <span
              className={`transition-colors duration-500 ${
                flash === 'success'
                  ? 'text-emerald-400'
                  : flash === 'damage'
                  ? 'text-rose-400'
                  : 'text-amber-500'
              }`}
            >
              {tether}%
            </span>
          </div>
          <div className="w-full h-2.5 sm:h-3 bg-[#1a1512] border border-[#5c4d43] rounded-full overflow-hidden shadow-inner relative">
            {/* フラッシュ時のオーバーレイ */}
            {flash && (
              <div
                className={`absolute inset-0 z-10 opacity-40 animate-pulse ${
                  flash === 'success' ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
            )}
            <div
              className={`h-full transition-all duration-700 ease-out relative z-0 ${
                tether >= 80
                  ? 'bg-emerald-600'
                  : tether >= 40
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${tether}%` }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={onArchiveClick}
        className="ml-4 bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8] p-2 sm:px-4 sm:py-2 rounded-full border border-[#5c4d43] transition-colors shadow-sm flex items-center gap-2 active:scale-95"
      >
        <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-[#d8c8b8]" />
        <span className="hidden sm:inline text-[10px] sm:text-xs font-bold tracking-widest text-[#d8c8b8]">
          ARCHIVE
        </span>
      </button>
    </div>
  );
}