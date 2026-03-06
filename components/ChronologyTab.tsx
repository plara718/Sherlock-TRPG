'use client';

import React, { useState } from 'react';
import { Lock, FileText, Play, FolderOpen } from 'lucide-react';

// @ts-ignore
import rawArchiveData from '@/data/archive.json';
const archiveData = rawArchiveData as any;

type ChronologyTabProps = {
  currentSeason: number;
  clearedData: Record<string, any>;
  onPlayEpisode: (epId: string) => void;
  onShowReport?: (epId: string, epTitle: string) => void;
  clearedEpisodes: string[]; 
};

type Episode = {
  id: string;
  year?: string;
  title: string;
  summary?: string;
  keywords?: string[];
  status?: string;
  category?: string;
};

export default function ChronologyTab({
  currentSeason,
  clearedData,
  onPlayEpisode,
  onShowReport,
  clearedEpisodes,
}: ChronologyTabProps) {
  const [activeTab, setActiveTab] = useState<number | string>(1);
  const [expandedEp, setExpandedEp] = useState<string | null>(null);

  const displaySeason = archiveData.seasons.find((s: any) => s.season_id === activeTab) || archiveData.seasons[0];
  const allEpisodes = archiveData.seasons.flatMap((s: any) => s.episodes);

  // ▼ 特殊エピソード（SPおよび幕間）の解放条件を判定する関数
  const checkSpecialPlayable = (epId: string) => {
    switch (epId) {
      // 幕間
      case 'Interlude-S1': return clearedEpisodes.includes('#13');
      case 'Interlude-S2': return clearedEpisodes.includes('#29');
      case 'Interlude-S3': return clearedEpisodes.includes('#40');
      // SP（アイリーン編）
      case 'SP-01': return clearedEpisodes.includes('#14');
      case 'SP-02': return clearedEpisodes.includes('#38');
      case 'SP-03': return clearedEpisodes.includes('SP-02');
      // SP（遊撃隊編）
      case 'SP-04': return clearedEpisodes.includes('#29');
      case 'SP-05': return clearedEpisodes.includes('SP-04');
      case 'SP-06': return clearedEpisodes.includes('SP-05');
      default: return false;
    }
  };

  const groupEpisodesByCategory = (episodes: Episode[]) => {
    return episodes.reduce((acc, ep) => {
      const cat = ep.category || 'default';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ep);
      return acc;
    }, {} as Record<string, Episode[]>);
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* スマホ最適化：折り返し表示（自動ラップ）のシーズン選択ピル */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        {archiveData.seasons.map((s: any) => {
          const isLocked = typeof s.season_id === 'number' && s.season_id > currentSeason;
          return (
            <button
              key={s.season_id}
              onClick={() => {
                if (!isLocked) { setActiveTab(s.season_id); setExpandedEp(null); }
              }}
              className={`px-3 py-1.5 sm:px-5 sm:py-2.5 font-bold text-xs sm:text-sm rounded-full transition-colors flex items-center gap-1.5 border shadow-sm ${
                activeTab === s.season_id
                  ? 'bg-[#5c4d43] text-[#f4ebd8] border-[#5c4d43]'
                  : isLocked
                  ? 'bg-[#d8c8b8]/30 text-[#8c7a6b] border-transparent cursor-not-allowed opacity-60'
                  : 'bg-[#e6d5c3] text-[#5c4d43] border-[#8c7a6b]/30 hover:bg-[#d8c8b8]'
              }`}
            >
              {s.title.split(':')[0]}
              {isLocked && <Lock size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#3a2f29] mb-3">{displaySeason.title}</h2>
        <p className="text-sm text-[#5c4d43] mb-6 font-serif leading-relaxed bg-[#e6d5c3]/50 p-4 rounded-lg border border-[#8c7a6b]/20 shadow-inner">
          {displaySeason.description}
        </p>

        <div className="grid gap-4">
          {(() => {
            const groupedEpisodes = groupEpisodesByCategory(displaySeason.episodes);

            return Object.entries(groupedEpisodes).map(([category, episodes]) => (
              <div key={category} className="mb-6">
                
                {category !== 'default' && (
                  <div className="flex items-center gap-2 mb-4 mt-2 text-[#5c4d43]">
                    <FolderOpen className="w-5 h-5 text-[#8c7a6b]" />
                    <h4 className="text-base font-bold border-b border-[#8c7a6b]/30 pb-1 flex-1 font-serif">
                      {category}
                    </h4>
                  </div>
                )}

                <div className="grid gap-3">
                  {episodes.map((ep: Episode) => {
                    const isExpanded = expandedEp === ep.id;
                    const cData = clearedData[ep.id];
                    const globalIndex = allEpisodes.findIndex((e: any) => e.id === ep.id);
                    const prevEp = globalIndex > 0 ? allEpisodes[globalIndex - 1] : null;
                    
                    // 実装状況の判定
                    const isImplemented = ep.status !== 'locked';
                    
                    // ▼ 解放条件の判定ロジック
                    let isPlayable = false;
                    
                    if (ep.id.startsWith('SP-') || ep.id.startsWith('Interlude-')) {
                      // SPおよび幕間は個別の特殊条件で解放
                      isPlayable = isImplemented && checkSpecialPlayable(ep.id);
                    } else if (ep.id === '#39') {
                      // ▼ 第39話の特別解放条件：第38話クリア ＋ すべてのSPシナリオクリア
                      const is38Cleared = clearedEpisodes.includes('#38');
                      const areAllSpCleared = ['SP-01', 'SP-02', 'SP-03', 'SP-04', 'SP-05', 'SP-06'].every(spId => clearedEpisodes.includes(spId));
                      isPlayable = isImplemented && (!!cData || (is38Cleared && areAllSpCleared));
                    } else {
                      // 通常の本編は、最初のエピソードか、1つ前のエピソードがクリア済みなら解放
                      const isNextPlayable = globalIndex === 0 || (prevEp && clearedData[prevEp.id]);
                      isPlayable = isImplemented && (!!cData || isNextPlayable);
                    }

                    return (
                      <div
                        key={ep.id}
                        className={`rounded-xl border ${
                          isPlayable
                            ? 'bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm'
                            : 'bg-[#e6d5c3]/40 border-transparent opacity-60'
                        } overflow-hidden transition-all duration-300`}
                      >
                        {/* タップエリア */}
                        <div
                          onClick={() => isPlayable && setExpandedEp(isExpanded ? null : ep.id)}
                          className={`p-4 sm:p-5 flex items-center justify-between ${isPlayable ? 'cursor-pointer active:bg-[#f4ebd8]' : 'cursor-not-allowed'}`}
                        >
                          <div className="flex-1 pr-4">
                            <div className="text-xs font-mono font-bold text-[#8c7a6b] mb-1 flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded ${
                                ep.id.startsWith('SP') ? 'bg-fuchsia-100 text-fuchsia-800' 
                                : ep.id.startsWith('Interlude') ? 'bg-[#3a2f29] text-[#f4ebd8]'
                                : 'bg-[#e6d5c3] text-[#5c4d43]'
                              }`}>
                                {ep.id}
                              </span>
                            </div>
                            <div className={`font-bold text-base leading-tight ${isPlayable ? 'text-[#3a2f29]' : 'text-[#8c7a6b]'}`}>
                              {isPlayable ? ep.title : '??? (LOCKED)'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {cData ? (
                              <span className={`text-[10px] text-white px-2 py-1 rounded font-bold tracking-widest shadow-sm ${
                                  cData.rank === 'LUCID' || cData.rank === 'CLEARED' ? 'bg-emerald-700' : cData.rank === 'SYMPATHETIC' ? 'bg-blue-700' : 'bg-rose-800'
                                }`}>
                                {cData.rank}
                              </span>
                            ) : isPlayable ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); onPlayEpisode(ep.id); }}
                                className={`text-[10px] text-white px-3 py-1.5 rounded-full font-bold tracking-widest shadow-md flex items-center gap-1 active:scale-95 transition-transform ${
                                  ep.id.startsWith('SP') ? 'bg-fuchsia-700' : ep.id.startsWith('Interlude') ? 'bg-[#3a2f29]' : 'bg-amber-600'
                                }`}
                              >
                                <Play size={12} className="fill-current" /> PLAY
                              </button>
                            ) : (
                              <Lock size={18} className="text-[#8c7a6b]" />
                            )}
                          </div>
                        </div>

                        {/* 展開時詳細エリア */}
                        {isExpanded && isPlayable && (
                          <div className="p-4 sm:p-5 border-t border-[#8c7a6b]/20 bg-[#f4ebd8]/50 animate-in slide-in-from-top-2">
                            <p className="text-sm text-[#3a2f29] leading-relaxed font-serif mb-4">
                              {ep.summary || '詳細データがありません。'}
                            </p>
                            {/* 未クリアで第39話の場合、特殊な警告を表示 */}
                            {!cData && ep.id === '#39' && (
                                <p className="text-xs text-rose-600 font-bold mb-4 font-mono bg-rose-100/50 p-2 rounded border border-rose-200">
                                  [SYSTEM] 全てのSPシナリオクリアを確認。最終決戦のロックが解除されました。
                                </p>
                            )}
                            {cData && (
                              <div className="flex justify-between items-center mt-4">
                                <button
                                  onClick={() => onPlayEpisode(ep.id)}
                                  className="text-[10px] sm:text-xs bg-[#5c4d43] text-white px-4 py-2 rounded-full shadow hover:bg-[#3a2f29] font-bold tracking-widest uppercase active:scale-95 transition-transform"
                                >
                                  REPLAY
                                </button>
                                <span className="text-[9px] text-[#8c7a6b] font-mono">* 再プレイ報酬 1pt</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}