'use client';

import React from 'react';
import { SaveDataProvider, useSaveData } from '@/lib/SaveDataContext';
import TitleView from '@/components/TitleView';
import GameView from '@/components/GameView';
import ArchiveView from '@/components/ArchiveView';
import EndRollView from '@/components/EndRollView';

function GameApp() {
  const ctx = useSaveData();

  if (!ctx.isInitialized) return <div className="h-[100dvh] bg-slate-900" />;

  return (
    <div className="h-[100dvh] w-full bg-slate-900 text-slate-800 font-sans overflow-hidden overscroll-none relative">
      {ctx.view === 'title' && (
        <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
          {/* Propsをすべて削除 */}
          <TitleView />
        </div>
      )}

      {ctx.view === 'game' && (
        <div className="absolute inset-0 z-20 bg-slate-900 animate-in slide-in-from-right-8 fade-in duration-300 shadow-2xl">
          {/* keyだけは再レンダリングのために残す */}
          <GameView key={ctx.currentEpisodeId} />
        </div>
      )}

      {ctx.view === 'archive' && (
        <div className="absolute inset-0 z-30 bg-[#f4ebd8] animate-in slide-in-from-bottom-8 fade-in duration-300">
          <ArchiveView />
        </div>
      )}

      {ctx.view === 'endroll' && (
        <div className="absolute inset-0 z-40 bg-[#1a1512] animate-in fade-in duration-1000">
          <EndRollView />
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <SaveDataProvider>
      <GameApp />
    </SaveDataProvider>
  );
}