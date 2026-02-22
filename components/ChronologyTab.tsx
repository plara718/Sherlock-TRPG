'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import archiveData from '@/data/archive.json';

type ClearedData = {
  [epId: string]: { rank: string; tether: number };
};

type ChronologyTabProps = {
  clearedData: ClearedData;
  onPlayEpisode: (epId: string) => void;
  onShowReport: (epId: string, epTitle: string) => void;
};

export default function ChronologyTab({
  clearedData,
  onPlayEpisode,
  onShowReport,
}: ChronologyTabProps) {
  const [activeTab, setActiveTab] = useState<string>('S1');
  const [expandedEp, setExpandedEp] = useState<string | null>(null);

  const currentSeason =
    archiveData.seasons.find((s) => s.id === activeTab) ||
    archiveData.seasons[0];

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-slate-600 mb-6 text-xs sm:text-sm mt-2 font-mono">
        シャーロック・ホームズ完全年代記：全52話
      </p>

      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-slate-300 custom-scrollbar">
        {archiveData.seasons.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveTab(s.id);
              setExpandedEp(null);
            }}
            className={`whitespace-nowrap px-4 py-2 font-bold text-sm sm:text-base rounded-t-lg transition-colors ${
              activeTab === s.id
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="mb-12">
        <h2 className="text-lg font-bold text-slate-800 mb-6">
          {currentSeason.subtitle}
        </h2>
        <div className="grid gap-4">
          {currentSeason.episodes.map((ep) => {
            const isExpanded = expandedEp === ep.no;
            const cData = clearedData[ep.no];
            const isPlayable = ep.no === '#01' || ep.no === '#02';

            return (
              <div
                key={ep.no}
                className={`rounded-lg border-2 ${
                  isPlayable
                    ? 'bg-white border-slate-800 shadow-md'
                    : 'bg-slate-200 border-slate-300 opacity-60'
                } overflow-hidden transition-all duration-300`}
              >
                <div
                  onClick={() =>
                    isPlayable && setExpandedEp(isExpanded ? null : ep.no)
                  }
                  className={`p-4 flex items-center justify-between ${
                    isPlayable
                      ? 'cursor-pointer hover:bg-slate-50'
                      : 'cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-500 mb-1">
                      {ep.no} / {ep.type} / {ep.year}
                    </div>
                    <div className="font-bold text-slate-800 text-base sm:text-lg">
                      {ep.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cData ? (
                      <>
                        <span
                          className={`text-[10px] sm:text-xs text-white px-2 py-1 rounded font-bold tracking-widest shadow ${
                            cData.rank === 'LUCID'
                              ? 'bg-green-700'
                              : 'bg-slate-800'
                          }`}
                        >
                          {cData.rank}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowReport(ep.no, ep.title);
                          }}
                          className="text-[10px] sm:text-xs bg-slate-200 text-slate-700 border border-slate-400 px-2 py-1 rounded font-bold hover:bg-slate-300"
                        >
                          Report
                        </button>
                      </>
                    ) : isPlayable ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayEpisode(ep.no);
                        }}
                        className="text-[10px] sm:text-xs bg-amber-600 text-white px-3 py-1 rounded uppercase font-bold tracking-widest shadow hover:bg-amber-500"
                      >
                        Play
                      </button>
                    ) : (
                      <Lock size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>
                {isExpanded && isPlayable && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50 animate-in slide-in-from-top-2">
                    <p className="text-sm text-slate-700 leading-relaxed font-serif mb-4">
                      {ep.synopsis}
                    </p>
                    {cData && (
                      <button
                        onClick={() => onPlayEpisode(ep.no)}
                        className="text-xs bg-slate-800 text-white px-4 py-2 rounded shadow hover:bg-slate-700 font-bold"
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
