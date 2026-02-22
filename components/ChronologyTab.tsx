'use client';

import React, { useState } from 'react';
import { Lock, FileText, Play } from 'lucide-react';
import archiveData from '@/data/archive.json';

type ClearedData = {
  [epId: string]: { rank: string; tether: number };
};

type ChronologyTabProps = {
  currentSeason: number; // 追加: 現在の到達シーズン
  clearedData: ClearedData;
  onPlayEpisode: (epId: string) => void;
  onShowReport?: (epId: string, epTitle: string) => void; // 今回は使用しない場合もあるが予約
};

export default function ChronologyTab({
  currentSeason,
  clearedData,
  onPlayEpisode,
  onShowReport,
}: ChronologyTabProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [expandedEp, setExpandedEp] = useState<string | null>(null);

  const displaySeason =
    archiveData.seasons.find((s) => s.season_id === activeTab) ||
    archiveData.seasons[0];

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-slate-600 mb-6 text-xs sm:text-sm mt-2 font-mono">
        シャーロック・ホームズ完全年代記：全58話 + SP
      </p>

      {/* シーズン切り替えタブ */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-slate-300 custom-scrollbar">
        {archiveData.seasons.map((s) => {
          // currentSeasonより先、かつSPステージ（99）ではない場合はロック
          // ※SPステージは別途各エピソードの解放条件で制御
          const isLocked = s.season_id > currentSeason && s.season_id !== 99;

          return (
            <button
              key={s.season_id}
              onClick={() => {
                if (!isLocked) {
                  setActiveTab(s.season_id);
                  setExpandedEp(null);
                }
              }}
              className={`whitespace-nowrap px-4 py-2 font-bold text-sm sm:text-base rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === s.season_id
                  ? 'bg-slate-800 text-white'
                  : isLocked
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {s.title.split(':')[0]} {/* "Season 1" などの部分だけ表示 */}
              {isLocked && <Lock size={14} />}
            </button>
          );
        })}
      </div>

      {/* シーズン詳細とエピソードリスト */}
      <div className="mb-12">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
          {displaySeason.title}
        </h2>
        <p className="text-sm text-slate-600 mb-6 font-serif leading-relaxed bg-[#FDF6E3] p-3 border-l-4 border-slate-400 shadow-inner">
          {displaySeason.description}
        </p>

        <div className="grid gap-4">
          {displaySeason.episodes.map((ep) => {
            const isExpanded = expandedEp === ep.id;
            const cData = clearedData[ep.id];
            
            // 未解放判定（summaryに未解放という文字が含まれていればプレイ不可）
            const isPlayable = !ep.summary.includes('未解放') && !ep.summary.includes('到達すると解放');

            return (
              <div
                key={ep.id}
                className={`rounded-lg border-2 ${
                  isPlayable
                    ? 'bg-white border-slate-800 shadow-md'
                    : 'bg-slate-200 border-slate-300 opacity-60'
                } overflow-hidden transition-all duration-300`}
              >
                {/* エピソードヘッダー（クリックで展開） */}
                <div
                  onClick={() =>
                    isPlayable && setExpandedEp(isExpanded ? null : ep.id)
                  }
                  className={`p-4 flex items-center justify-between ${
                    isPlayable
                      ? 'cursor-pointer hover:bg-slate-50'
                      : 'cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-500 mb-1 flex items-center gap-2">
                      <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                        {ep.id}
                      </span>
                      <span>YEAR: {ep.year}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-base sm:text-lg">
                      {ep.title}
                    </div>
                  </div>

                  {/* ステータス＆アクションボタン */}
                  <div className="flex items-center gap-2">
                    {cData ? (
                      <>
                        <span
                          className={`text-[10px] sm:text-xs text-white px-2 py-1 rounded font-bold tracking-widest shadow ${
                            cData.rank === 'LUCID'
                              ? 'bg-green-700'
                              : cData.rank === 'SYMPATHETIC'
                              ? 'bg-blue-700'
                              : 'bg-red-800'
                          }`}
                        >
                          {cData.rank}
                        </span>
                        {onShowReport && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowReport(ep.id, ep.title);
                            }}
                            className="text-[10px] sm:text-xs bg-slate-200 text-slate-700 border border-slate-400 px-2 py-1 rounded font-bold hover:bg-slate-300 flex items-center gap-1"
                          >
                            <FileText size={12} /> REPORT
                          </button>
                        )}
                      </>
                    ) : isPlayable ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayEpisode(ep.id);
                        }}
                        className="text-[10px] sm:text-xs bg-amber-600 text-white px-3 py-1 rounded uppercase font-bold tracking-widest shadow hover:bg-amber-500 flex items-center gap-1"
                      >
                        <Play size={12} /> PLAY
                      </button>
                    ) : (
                      <Lock size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* エピソード詳細（展開時） */}
                {isExpanded && isPlayable && (
                  <div className="p-4 border-t border-slate-200 bg-[#f4ecd8] animate-in slide-in-from-top-2">
                    <p className="text-sm text-slate-800 leading-relaxed font-serif mb-4">
                      {ep.summary}
                    </p>
                    
                    {/* キーワードタグ */}
                    {ep.keywords && ep.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-[10px] font-mono text-slate-500 flex items-center mr-1">
                          KEYWORDS:
                        </span>
                        {ep.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] sm:text-xs bg-slate-300 text-slate-700 px-2 py-0.5 rounded border border-slate-400 font-bold"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {cData && (
                      <button
                        onClick={() => onPlayEpisode(ep.id)}
                        className="text-xs bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700 font-bold tracking-widest uppercase transition-transform active:scale-95"
                      >
                        Replay Investigation
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}