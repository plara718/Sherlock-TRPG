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
      className={`p-3 sm:p-4 border-b-2 sm:border-b-4 border-slate-800 flex justify-between items-center transition-colors duration-500 z-20 shadow-md ${
        flash === 'success'
          ? 'bg-green-100'
          : flash === 'damage'
          ? 'bg-red-100'
          : 'bg-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <BrainCircuit
          className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${
            flash === 'success'
              ? 'text-green-600'
              : flash === 'damage'
              ? 'text-red-600'
              : 'text-slate-800'
          }`}
        />
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-800 mb-1 font-mono tracking-widest">
            <span>TETHER</span>
            <span
              className={`transition-colors duration-500 ${
                flash === 'success'
                  ? 'text-green-700'
                  : flash === 'damage'
                  ? 'text-red-700'
                  : ''
              }`}
            >
              {tether}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-300 border border-slate-500 rounded-full overflow-hidden shadow-inner relative">
            {/* フラッシュ時のオーバーレイ */}
            {flash && (
              <div
                className={`absolute inset-0 z-10 opacity-50 animate-pulse ${
                  flash === 'success' ? 'bg-green-400' : 'bg-red-500'
                }`}
              />
            )}
            <div
              className={`h-full transition-all duration-700 ease-out relative z-0 ${
                tether >= 80
                  ? 'bg-blue-500'
                  : tether >= 40
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${tether}%` }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={onArchiveClick}
        className="ml-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded transition-colors shadow flex items-center gap-2 active:scale-95"
      >
        <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline text-xs font-bold tracking-widest">
          ARCHIVE
        </span>
      </button>
    </div>
  );
}
