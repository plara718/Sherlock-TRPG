'use client';

import React, { useState } from 'react';
import { Lock, Play, FolderOpen } from 'lucide-react';

// @ts-ignore
import rawArchiveData from '@/data/archive.json';
const archiveData = rawArchiveData as any;

type ChronologyTabProps = {
  currentSeason: number;
  clearedData: Record<string, any>;
  onPlayEpisode: (epId: string) => void;
  onShowReport?: (epId: string, epTitle: string) => void;
  clearedEpisodes: string[]; 
  playMode?: 'holmes' | 'moriarty';
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

// ▼ 修正箇所：M-12までの全シナリオを網羅
const MORIARTY_ACTS = [
  {
    title: "第1幕：等式の目覚め",
    episodes: [
      { id: "M-01", title: "等式の目覚め", summary: "若き数学教授は、階級社会の腐敗というバグを修正するため、初めて自らの手で完全犯罪を構成する。" },
      { id: "M-02", title: "黒い噂", summary: "豪華客船での公開処刑劇。自らを社会から追放させ、完全な影の支配者となるための儀式を完遂する。" },
      { id: "M-03", title: "犯罪卿の誕生", summary: "腐敗した警察幹部と裏社会のボスを同時にハッキングし、誰も逆らえない「犯罪相談役」の玉座に就く。" }
    ]
  },
  {
    title: "第2幕：方程式の証明",
    episodes: [
      { id: "M-04", title: "因果律の証明", summary: "アメリカから来た御者の復讐を支援し、ホームズという「有能な観測者」を認知する。" },
      { id: "M-05", title: "密室の物理学", summary: "暴君ロイロット博士に対し、毒蛇と探偵の介入を用いた「自滅の因果律」を設計する。" },
      { id: "M-06", title: "不純物の除去", summary: "ロンドンに進出しようとする海外マフィアを、探偵とヤードの力を使って一網打尽にさせる。" }
    ]
  },
  {
    title: "第3幕：盤面の支配",
    episodes: [
      { id: "M-07", title: "美しきノイズ", summary: "アイリーンという計算外の変数によるノイズを、美学（AESTHETIC）としてあえて許容する。" },
      { id: "M-08", title: "欲望の確率論", summary: "名馬を巡る強欲な調教師を、オッズ操作と借金という「確率論」の罠にかけて自滅させる。" },
      { id: "M-09", title: "経済の血液", summary: "架空の就職話で時間と空間を計算し、大英帝国の経済の中枢（マウソン商会）をハッキングする。" }
    ]
  },
  {
    title: "第4幕：グランドフィナーレ",
    episodes: [
      { id: "M-10", title: "虚構のトンネル", summary: "赤毛組合という滑稽な謎解きで警察の目を逸らし、その裏で真の要人を暗殺する。" },
      { id: "M-11", title: "盤面の浄化", summary: "肥大化した自らの犯罪インフラを解体するため、探偵に意図的に証拠をリークする。" },
      { id: "M-12", title: "究極の方程式", summary: "ライヘンバッハの滝。絶対的な「光」を伝説へと昇華させるための、最後のチェックメイト。" }
    ]
  }
];

export default function ChronologyTab({
  currentSeason,
  clearedData,
  onPlayEpisode,
  clearedEpisodes,
  playMode = 'holmes'
}: ChronologyTabProps) {
  const [activeTab, setActiveTab] = useState<number | string>(1);
  const [expandedEp, setExpandedEp] = useState<string | null>(null);

  const isMoriarty = playMode === 'moriarty';

  // ==========================================
  // Moriarty Mode Render
  // ==========================================
  if (isMoriarty) {
    return (
      <div className="space-y-12 animate-in fade-in duration-500 pb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-black font-serif text-theme-text-light tracking-widest mb-3">THE EQUATION</h2>
          <p className="text-sm text-theme-text-muted mb-6 font-serif leading-relaxed bg-theme-bg-dark-panel p-4 rounded-lg border border-theme-border-base/20 shadow-inner">
            法で裁けないロンドンの悪を浄化するための、冷徹なる方程式の記録。
          </p>
        </div>

        {MORIARTY_ACTS.map((act, idx) => (
          <div key={idx} className="relative">
            <h2 className="text-xl font-serif font-bold text-theme-text-light mb-6 border-b border-theme-border-base/50 pb-2 flex items-center gap-2">
              <span className="text-theme-accent-main">●</span> {act.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {act.episodes.map(ep => {
                const isCleared = clearedEpisodes.includes(ep.id);
                const cData = clearedData[ep.id];
                const isExpanded = expandedEp === ep.id;
                
                // M-01は常に解放。以降は前のエピソードをクリアしているかチェック
                const globalIndex = MORIARTY_ACTS.flatMap(a => a.episodes).findIndex(e => e.id === ep.id);
                const prevEpId = globalIndex > 0 ? MORIARTY_ACTS.flatMap(a => a.episodes)[globalIndex - 1].id : null;
                const isPlayable = globalIndex === 0 || (prevEpId && clearedEpisodes.includes(prevEpId));

                return (
                  <div
                    key={ep.id}
                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                      isPlayable
                        ? 'bg-theme-bg-panel border-theme-border-base/50 shadow-sm'
                        : 'bg-theme-bg-dark/30 border-transparent opacity-50'
                    }`}
                  >
                    <div
                      onClick={() => isPlayable && setExpandedEp(isExpanded ? null : ep.id)}
                      className={`p-4 flex items-center justify-between ${isPlayable ? 'cursor-pointer active:bg-theme-bg-dark-panel' : 'cursor-not-allowed'}`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="text-[10px] font-mono text-theme-accent-main mb-1 font-bold tracking-widest">{ep.id}</div>
                        <div className={`font-serif font-bold text-base leading-tight ${isPlayable ? 'text-theme-text-light' : 'text-theme-text-muted'}`}>
                          {isPlayable ? ep.title : '??? (LOCKED)'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {cData ? (
                          <span className={`text-[10px] text-white px-2 py-1 rounded font-bold tracking-widest shadow-sm ${
                              cData.rank === 'MASTERPIECE' ? 'bg-emerald-700' : cData.rank === 'COMPROMISED' ? 'bg-blue-700' : 'bg-rose-800'
                            }`}>
                            {cData.rank}
                          </span>
                        ) : isPlayable ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onPlayEpisode(ep.id); }}
                            className="text-[10px] text-white px-3 py-1.5 rounded-full font-bold tracking-widest shadow-md flex items-center gap-1 active:scale-95 transition-transform bg-theme-accent-main hover:opacity-80"
                          >
                            <Play size={12} className="fill-current" /> EXECUTE
                          </button>
                        ) : (
                          <Lock size={18} className="text-theme-text-muted" />
                        )}
                      </div>
                    </div>

                    {/* 詳細展開 */}
                    {isExpanded && isPlayable && (
                      <div className="p-4 border-t border-theme-border-base/20 bg-theme-bg-dark-panel animate-in slide-in-from-top-2">
                        <p className="text-sm text-theme-text-base leading-relaxed font-serif mb-4">
                          {ep.summary}
                        </p>
                        {cData && (
                          <div className="flex justify-between items-center mt-4">
                            <button
                              onClick={() => onPlayEpisode(ep.id)}
                              className="text-[10px] bg-theme-bg-dark text-theme-text-light hover:bg-theme-border-base px-4 py-2 rounded-full shadow font-bold tracking-widest uppercase active:scale-95 transition-colors border border-theme-border-base/50"
                            >
                              RECALCULATE
                            </button>
                            <span className="text-[9px] text-theme-text-muted font-mono">* 再計算報酬 1pt</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ==========================================
  // Holmes Mode Render (Default)
  // ==========================================
  const displaySeason = archiveData.seasons.find((s: any) => s.season_id === activeTab) || archiveData.seasons[0];
  const allEpisodes = archiveData.seasons.flatMap((s: any) => s.episodes);

  const checkSpecialPlayable = (epId: string) => {
    switch (epId) {
      case 'Interlude-S1': return clearedEpisodes.includes('#13');
      case 'Interlude-S2': return clearedEpisodes.includes('#29');
      case 'Interlude-S3': return clearedEpisodes.includes('#40');
      case 'SP-01': return clearedEpisodes.includes('#14');
      case 'SP-02': return clearedEpisodes.includes('#38');
      case 'SP-03': return clearedEpisodes.includes('SP-02');
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
                  ? 'bg-theme-text-base text-theme-bg-base border-theme-text-base'
                  : isLocked
                  ? 'bg-theme-bg-dark/30 text-theme-text-muted border-transparent cursor-not-allowed opacity-60'
                  : 'bg-theme-bg-panel text-theme-text-base border-theme-border-base/30 hover:bg-theme-bg-dark-panel'
              }`}
            >
              {s.title.includes(':') ? s.title.split(':')[0] : s.title}
              {isLocked && <Lock size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-theme-text-light mb-3">{displaySeason.title}</h2>
        <p className="text-sm text-theme-text-muted mb-6 font-serif leading-relaxed bg-theme-bg-panel p-4 rounded-lg border border-theme-border-base/20 shadow-inner">
          {displaySeason.description}
        </p>

        <div className="grid gap-4">
          {(() => {
            const groupedEpisodes = groupEpisodesByCategory(displaySeason.episodes);

            return Object.entries(groupedEpisodes).map(([category, episodes]) => (
              <div key={category} className="mb-6">
                
                {category !== 'default' && (
                  <div className="flex items-center gap-2 mb-4 mt-2 text-theme-text-muted">
                    <FolderOpen className="w-5 h-5 text-theme-border-dark" />
                    <h4 className="text-base font-bold border-b border-theme-border-base/30 pb-1 flex-1 font-serif">
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
                    
                    const isImplemented = ep.status !== 'locked';
                    let isPlayable = false;
                    
                    if (ep.id.startsWith('SP-') || ep.id.startsWith('Interlude-')) {
                      isPlayable = isImplemented && checkSpecialPlayable(ep.id);
                    } else if (ep.id === '#39') {
                      const is38Cleared = clearedEpisodes.includes('#38');
                      const areAllSpCleared = ['SP-01', 'SP-02', 'SP-03', 'SP-04', 'SP-05', 'SP-06'].every(spId => clearedEpisodes.includes(spId));
                      isPlayable = isImplemented && (!!cData || (is38Cleared && areAllSpCleared));
                    } else {
                      const isNextPlayable = globalIndex === 0 || (prevEp && clearedData[prevEp.id]);
                      isPlayable = isImplemented && (!!cData || isNextPlayable);
                    }

                    return (
                      <div
                        key={ep.id}
                        className={`rounded-xl border ${
                          isPlayable
                            ? 'bg-theme-bg-panel border-theme-border-base/40 shadow-sm'
                            : 'bg-theme-bg-dark/40 border-transparent opacity-60'
                        } overflow-hidden transition-all duration-300`}
                      >
                        <div
                          onClick={() => isPlayable && setExpandedEp(isExpanded ? null : ep.id)}
                          className={`p-4 sm:p-5 flex items-center justify-between ${isPlayable ? 'cursor-pointer active:bg-theme-bg-dark-panel' : 'cursor-not-allowed'}`}
                        >
                          <div className="flex-1 pr-4">
                            <div className="text-xs font-mono font-bold text-theme-text-muted mb-1 flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded ${
                                ep.id.startsWith('SP') ? 'bg-fuchsia-900/20 text-fuchsia-600 border border-fuchsia-900/30' 
                                : ep.id.startsWith('Interlude') ? 'bg-theme-text-base text-theme-bg-base'
                                : 'bg-theme-bg-dark text-theme-text-muted border border-theme-border-base/50'
                              }`}>
                                {ep.id}
                              </span>
                            </div>
                            <div className={`font-bold text-base leading-tight ${isPlayable ? 'text-theme-text-light' : 'text-theme-text-muted opacity-50'}`}>
                              {isPlayable ? ep.title : '??? (LOCKED)'}
                            </div>
                            
                            {isPlayable && ep.summary && (
                              <p className="text-[10px] sm:text-xs text-theme-text-muted mt-1.5 line-clamp-1 font-serif opacity-80">
                                {ep.summary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
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
                                  ep.id.startsWith('SP') ? 'bg-fuchsia-700' : ep.id.startsWith('Interlude') ? 'bg-theme-text-base text-theme-bg-base' : 'bg-theme-accent-main'
                                }`}
                              >
                                <Play size={12} className="fill-current" /> PLAY
                              </button>
                            ) : (
                              <Lock size={18} className="text-theme-text-muted" />
                            )}
                          </div>
                        </div>

                        {isExpanded && isPlayable && (
                          <div className="p-4 sm:p-5 border-t border-theme-border-base/20 bg-theme-bg-dark-panel animate-in slide-in-from-top-2">
                            <p className="text-sm text-theme-text-base leading-relaxed font-serif mb-4">
                              {ep.summary || '詳細データがありません。'}
                            </p>
                            {!cData && ep.id === '#39' && (
                                <p className="text-xs text-rose-600 font-bold mb-4 font-mono bg-rose-950/20 p-2 rounded border border-rose-900/50">
                                  [SYSTEM] 全てのSPシナリオクリアを確認。最終決戦のロックが解除されました。
                                </p>
                            )}
                            {cData && (
                              <div className="flex justify-between items-center mt-4">
                                <button
                                  onClick={() => onPlayEpisode(ep.id)}
                                  className="text-[10px] sm:text-xs bg-theme-bg-dark text-theme-text-light border border-theme-border-base/50 px-4 py-2 rounded-full shadow hover:bg-theme-border-base font-bold tracking-widest uppercase active:scale-95 transition-colors"
                                >
                                  REPLAY
                                </button>
                                <span className="text-[9px] text-theme-text-muted font-mono">* 再プレイ報酬 1pt</span>
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