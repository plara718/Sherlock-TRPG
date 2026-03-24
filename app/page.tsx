'use client';

import React from 'react';
import { SaveDataProvider, useSaveData } from '@/lib/SaveDataContext';
import TitleView from '@/components/TitleView';
import GameView from '@/components/GameView';
import ArchiveView from '@/components/ArchiveView';
import EndRollView from '@/components/EndRollView';

function GameApp() {
  const ctx = useSaveData();

  // 初期化前はチラつき防止のために漆黒の画面を表示
  if (!ctx.isInitialized) return <div className="h-[100dvh] w-full bg-[#0a0a0a]" />;

  return (
    <div data-theme={ctx.playMode} className="h-[100dvh] w-full bg-theme-bg-base text-theme-text-base font-sans overflow-hidden overscroll-none relative transition-colors duration-1000">
      {ctx.view === 'title' && (
        <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
          {/* Propsをすべて削除 */}
          <TitleView />
        </div>
      )}

      {ctx.view === 'game' && (
        <div className="absolute inset-0 z-20 bg-theme-bg-base animate-in slide-in-from-right-8 fade-in duration-300 shadow-2xl">
          {/* keyだけは再レンダリングのために残す */}
          <GameView key={ctx.currentEpisodeId} />
        </div>
      )}

      {ctx.view === 'archive' && (
        <div className="absolute inset-0 z-30 bg-theme-bg-base animate-in slide-in-from-bottom-8 fade-in duration-300">
          <ArchiveView />
        </div>
      )}

      {ctx.view === 'endroll' && (
        <div className="absolute inset-0 z-40 bg-[#0a0a0a] animate-in fade-in duration-1000">
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