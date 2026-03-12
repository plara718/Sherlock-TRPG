'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Archive, BrainCircuit, Sparkles, Skull } from 'lucide-react';

type TetherBarProps = {
  tether: number;
  onArchiveClick: () => void;
  protagonist?: string;
  gaugeName: string;
};

export default function TetherBar({ tether, onArchiveClick, protagonist = 'watson', gaugeName }: TetherBarProps) {
  const [flash, setFlash] = useState<'success' | 'damage' | null>(null);
  const prevTether = useRef(tether);
  
  const isIrene = protagonist === 'irene';
  const isMoriarty = gaugeName === 'DOMINATION';

  useEffect(() => {
    if (tether > prevTether.current) {
      setFlash('success');
    } else if (tether < prevTether.current) {
      setFlash('damage');
    }
    prevTether.current = tether;

    const timer = setTimeout(() => {
      setFlash(null);
    }, 1000); 

    return () => clearTimeout(timer);
  }, [tether]);

  const IconComponent = isMoriarty ? Skull : (isIrene ? Sparkles : BrainCircuit);
  const defaultColor = 'text-theme-accent-main';

  return (
    <div
      className={`p-3 sm:p-4 border-b border-theme-border-dark flex justify-between items-center transition-colors duration-500 z-20 shadow-md shrink-0 ${
        flash === 'success'
          ? 'bg-emerald-900/20'
          : flash === 'damage'
          ? 'bg-rose-900/20'
          : 'bg-theme-bg-dark-panel'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <IconComponent
          className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${
            flash === 'success'
              ? 'text-emerald-500'
              : flash === 'damage'
              ? 'text-rose-500'
              : defaultColor
          }`}
        />
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1 font-mono tracking-widest">
            <span className="text-theme-text-muted">{gaugeName}</span>
            <span
              className={`transition-colors duration-500 ${
                flash === 'success'
                  ? 'text-emerald-400'
                  : flash === 'damage'
                  ? 'text-rose-400'
                  : 'text-theme-accent-main'
              }`}
            >
              {tether}%
            </span>
          </div>
          <div className="w-full h-2.5 sm:h-3 bg-theme-bg-dark border border-theme-border-base rounded-full overflow-hidden shadow-inner relative">
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
                  ? 'bg-theme-accent-main'
                  : tether >= 40
                  ? 'bg-theme-accent-muted'
                  : 'bg-theme-border-dark'
              }`}
              style={{ width: `${tether}%` }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={onArchiveClick}
        className="ml-4 bg-theme-bg-dark hover:bg-theme-border-dark text-theme-text-light p-2 sm:px-4 sm:py-2 rounded-full border border-theme-border-base transition-colors shadow-sm flex items-center gap-2 active:scale-95"
      >
        <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-theme-text-light-muted" />
        <span className="hidden sm:inline text-[10px] sm:text-xs font-bold tracking-widest text-theme-text-light-muted">
          ARCHIVE
        </span>
      </button>
    </div>
  );
}