'use client';

import React, { useState } from 'react';
import { Database, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import ChronologyTab from '@/components/ChronologyTab';
import GreatIndexTab from '@/components/GreatIndexTab';
import SpiderWebTab from '@/components/SpiderWebTab';

type ArchiveViewProps = {
  currentSeason?: number;
  unlockedTerms: string[];
  readTerms: string[];
  insightPoints: number;
  clearedData: { [epId: string]: { rank: string; tether: number } };
  
  // ▼ 以下3つは新しいSpiderWebTabでは自動判定になったため内部では未使用ですが、
  // page.tsx 側でのエラーを防ぐために型定義のみ残しています。
  unlockedTruths?: Record<string, any>;
  onUnlockTruth?: (pinId: string, truthData: any, cost: number) => void;
  onLinkFail?: (cost: number) => void;
  
  onReturnTitle: () => void;
  onReturnGame?: () => void;
  onPlayEpisode: (epId: string) => void;
  onResearch: () => void;
  onReadTerm: (termId: string) => void;
};

export default function ArchiveView({
  currentSeason = 1,
  unlockedTerms,
  readTerms,
  insightPoints,
  clearedData,
  onReturnTitle,
  onPlayEpisode,
  onResearch,
  onReadTerm,
}: ArchiveViewProps) {
  const [activeTab, setActiveTab] = useState<'case' | 'index' | 'spider'>('case');

  return (
    <div className="w-full max-w-2xl bg-[#FDF6E3] border-4 border-slate-800 shadow-2xl flex flex-col h-[100dvh] sm:h-[90vh]">
      
      {/* ヘッダー */}
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <h1 className="font-bold tracking-widest uppercase font-serif">
            Main System
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={onReturnTitle}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title="タイトルへ戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex bg-slate-200 border-b-2 border-slate-400 shrink-0">
        <button
          onClick={() => setActiveTab('case')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'case'
              ? 'bg-[#FDF6E3] border-t-2 border-slate-800 text-slate-800'
              : 'text-slate-500 hover:bg-slate-300'
          }`}
        >
          CASE FILES
        </button>
        <button
          onClick={() => setActiveTab('index')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'index'
              ? 'bg-[#FDF6E3] border-t-2 border-slate-800 text-slate-800'
              : 'text-slate-500 hover:bg-slate-300'
          }`}
        >
          GREAT INDEX
        </button>
        <button
          onClick={() => setActiveTab('spider')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'spider'
              ? 'bg-[#FDF6E3] border-t-2 border-red-800 text-red-800'
              : 'text-red-900/50 hover:bg-slate-300'
          }`}
        >
          <LinkIcon className="w-3 h-3" /> SPIDER'S WEB
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* CASE FILES (ChronologyTab) */}
        {activeTab === 'case' && (
          <div className="p-4 overflow-y-auto h-full custom-scrollbar">
            <ChronologyTab
              currentSeason={currentSeason}
              clearedData={clearedData}
              onPlayEpisode={onPlayEpisode}
            />
          </div>
        )}

        {/* GREAT INDEX (GreatIndexTab) */}
        {activeTab === 'index' && (
          <div className="p-4 overflow-y-auto h-full custom-scrollbar">
            <GreatIndexTab
              unlockedTerms={unlockedTerms}
              readTerms={readTerms}
              insightPoints={insightPoints}
              clearedData={clearedData}
              onResearch={onResearch}
              onReadTerm={onReadTerm}
            />
          </div>
        )}

        {/* SPIDER'S WEB (SpiderWebTab) */}
        {activeTab === 'spider' && (
          <div className="h-full">
            <SpiderWebTab
              clearedData={clearedData}
              unlockedTerms={unlockedTerms}
            />
          </div>
        )}

      </div>
    </div>
  );
}