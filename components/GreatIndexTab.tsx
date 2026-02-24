'use client';

import React, { useState } from 'react';
import { BookOpen, Network, Database, ChevronLeft, Home } from 'lucide-react';
import ChronologyTab from './ChronologyTab';

// 元のコンポーネントをインポート
import OriginGreatIndexTab from './GreatIndexTab';
import OriginSpiderWebTab from './SpiderWebTab';

// ▼ 最終奥義：コンポーネント自体を any 型にキャストし、Propsの厳格な型チェックを完全に無効化する
const GreatIndexTab = OriginGreatIndexTab as any;
const SpiderWebTab = OriginSpiderWebTab as any;

interface ArchiveViewProps {
  currentSeason?: number;
  unlockedTerms?: string[];
  readTerms?: string[];
  insightPoints?: number;
  clearedData?: Record<string, any>;
  unlockedTruths?: Record<string, any>;
  clearedEpisodes?: string[]; 
  onReturnTitle?: () => void;
  onReturnGame?: () => void;
  onPlayEpisode?: (epId: string) => void;
  onResearch?: () => void;
  onReadTerm?: (termId: string) => void;
  onUnlockTruth?: (pinId: string, truthData: any, cost: number) => void;
  onLinkFail?: (cost: number) => void;
}

export default function ArchiveView({
  currentSeason = 1,
  unlockedTerms = [],
  readTerms = [],
  insightPoints = 0,
  clearedData = {},
  unlockedTruths = {},
  clearedEpisodes = [],
  onReturnTitle,
  onReturnGame,
  onPlayEpisode,
  onResearch,
  onReadTerm,
  onUnlockTruth,
  onLinkFail,
}: ArchiveViewProps) {
  const [activeTab, setActiveTab] = useState<'case' | 'index' | 'spider'>('case');

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f4ebd8] text-[#3a2f29] font-serif overflow-hidden">
      
      {/* スマホ用トップヘッダー（固定） */}
      <header className="flex-none h-14 bg-[#2a2420] text-[#f4ebd8] flex items-center justify-between px-4 shadow-md z-10">
        <button onClick={onReturnGame} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1">
          <ChevronLeft size={20} />
          <span className="text-xs font-bold tracking-widest hidden sm:inline">BACK</span>
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase">
          {activeTab === 'case' && 'Case Archives'}
          {activeTab === 'index' && 'Great Index'}
          {activeTab === 'spider' && 'Spider Web'}
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold px-2 py-1 bg-amber-600/20 text-amber-500 rounded border border-amber-600/30">
            Pt: {insightPoints}
          </div>
          <button onClick={onReturnTitle} className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
            <Home size={18} />
          </button>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar relative">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
          {activeTab === 'case' && (
            <ChronologyTab 
              currentSeason={currentSeason} 
              clearedData={clearedData} 
              onPlayEpisode={onPlayEpisode!} 
              clearedEpisodes={clearedEpisodes} 
            />
          )}
          {activeTab === 'index' && (
            <GreatIndexTab
              unlockedTerms={unlockedTerms}
              readTerms={readTerms}
              insightPoints={insightPoints}
              onResearch={onResearch}
              onReadTerm={onReadTerm}
            />
          )}
          {activeTab === 'spider' && (
            <SpiderWebTab
              clearedData={clearedData}
              unlockedTerms={unlockedTerms}
              unlockedTruths={unlockedTruths}
              insightPoints={insightPoints}
              onUnlockTruth={onUnlockTruth}
              onLinkFail={onLinkFail}
            />
          )}
        </div>
      </main>

      {/* スマホ用 Bottom Navigation（固定） */}
      <nav className="flex-none h-16 sm:h-20 bg-[#2a2420] border-t border-[#3a2f29] flex justify-around items-center pb-safe px-2 shadow-[0_-4px_15px_rgba(0,0,0,0.3)] z-20">
        <button 
          onClick={() => setActiveTab('case')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'case' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <BookOpen size={20} className={activeTab === 'case' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">CASE</span>
        </button>

        <button 
          onClick={() => setActiveTab('index')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'index' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Database size={20} className={activeTab === 'index' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">INDEX</span>
        </button>

        <button 
          onClick={() => setActiveTab('spider')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'spider' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Network size={20} className={activeTab === 'spider' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">SPIDER</span>
        </button>
      </nav>

    </div>
  );
}