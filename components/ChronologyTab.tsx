'use client';

import React from 'react';
import { Lock, PlayCircle, Star, Hash } from 'lucide-react';
import archiveData from '@/data/archive.json';

type ChronologyTabProps = {
  currentSeason: number;
  clearedData: any;
  clearedEpisodes: string[];
  onPlayEpisode: (id: string) => void;
  activeGameData?: any;
  clearActiveGameData?: () => void;
};

export default function ChronologyTab({ currentSeason, clearedData, clearedEpisodes, onPlayEpisode, activeGameData, clearActiveGameData }: ChronologyTabProps) {
  const currentSeasonData = archiveData.seasons.find(s => s.id === currentSeason);

  return (
    <div className="animate-in fade-in duration-500">
      
      <div className="mb-8 border-b-2 border-[#3a2f29] pb-4 flex justify-between items-end">
        <div>
          <p className="text-xs font-mono tracking-widest text-[#8c7a6b] uppercase">Chronology - Season {currentSeasonData?.id}</p>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#3a2f29] mt-1 tracking-wider">{currentSeasonData?.title}</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-[#8c7a6b] uppercase tracking-widest mb-1">Completion</p>
          <p className="text-xl font-bold text-amber-600 font-mono">
            {Math.round((clearedEpisodes.filter(id => currentSeasonData?.episodes.some(e => e.id === id)).length / (currentSeasonData?.episodes.length || 1)) * 100)}%
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[27px] sm:left-[31px] top-0 bottom-0 w-1 bg-gradient-to-b from-[#8c7a6b]/20 via-[#8c7a6b]/40 to-transparent rounded-full" />
        
        <div className="space-y-6 sm:space-y-8">
          {currentSeasonData?.episodes.map((ep, index) => {
            const isCleared = clearedEpisodes.includes(ep.id);
            const isPlayable = isCleared || (index === 0 || clearedEpisodes.includes(currentSeasonData.episodes[index - 1].id));
            const epResult = clearedData[ep.id];

            return (
              <div key={ep.id} className={`relative flex items-start gap-4 sm:gap-6 ${isPlayable ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                
                <div className={`relative z-10 flex shrink-0 items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 shadow-lg transition-transform ${isCleared ? 'bg-amber-100 border-amber-500 text-amber-700' : isPlayable ? 'bg-[#fffcf7] border-[#3a2f29] text-[#3a2f29]' : 'bg-[#e6d5c3] border-[#8c7a6b] text-[#8c7a6b]'}`}>
                  {isCleared ? <Star className="fill-amber-500" size={24} /> : <Hash size={24} />}
                </div>

                <div className={`flex-1 rounded-xl border-2 p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${isPlayable ? 'bg-[#fffcf7] border-[#8c7a6b]/30 shadow-[4px_4px_10px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_15px_rgba(0,0,0,0.1)] hover:border-[#8c7a6b]/50' : 'bg-[#e6d5c3]/50 border-[#8c7a6b]/20'}`}>
                  
                  {isCleared && (
                    <div className="absolute -right-6 top-4 bg-amber-600 text-amber-50 text-[10px] font-bold px-8 py-1 rotate-45 shadow-sm uppercase tracking-widest font-mono">
                      CLEARED
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border ${isPlayable ? 'bg-[#e6d5c3] border-[#8c7a6b]/30 text-[#5c4d43]' : 'bg-transparent border-[#8c7a6b]/20 text-[#8c7a6b]'}`}>
                      FILE No. {ep.id}
                    </span>
                    {!isPlayable && <Lock size={12} className="text-[#8c7a6b]" />}
                  </div>

                  <h3 className={`text-lg sm:text-xl font-bold font-serif leading-tight ${isPlayable ? 'text-[#3a2f29]' : 'text-[#8c7a6b]'}`}>
                    {isPlayable ? ep.title : '????????????????'}
                  </h3>

                  {isPlayable && ep.summary && (
                    <p className="mt-3 text-sm text-[#5c4d43] leading-relaxed font-serif opacity-80 line-clamp-2">
                      {ep.summary}
                    </p>
                  )}

                  {isCleared && epResult && (
                    <div className="mt-4 p-3 bg-[#f4ebd8]/50 rounded-lg border border-[#8c7a6b]/20 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-[#8c7a6b]">Evaluation: </span>
                        <span className={`font-bold uppercase tracking-widest ${epResult.rank === 'LUCID' || epResult.rank === 'CLEARED' ? 'text-emerald-700' : epResult.rank === 'SYMPATHETIC' ? 'text-blue-700' : 'text-rose-700'}`}>{epResult.rank}</span>
                      </div>
                      <div>
                        <span className="text-[#8c7a6b]">Tether: </span>
                        <span className="font-bold text-[#3a2f29]">{epResult.tether}%</span>
                      </div>
                    </div>
                  )}

                  {/* ▼ 新規：再開ボタン（中断データがある場合） */}
                  {activeGameData && activeGameData.episodeId === ep.id && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => onPlayEpisode(ep.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-xs rounded shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1">
                        <PlayCircle size={14} /> RESUME (再開)
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm('中断データを破棄して最初からやり直しますか？')){ if(clearActiveGameData) clearActiveGameData(); onPlayEpisode(ep.id); } }} className="px-3 py-2 bg-[#2a2420] text-[#8c7a6b] hover:bg-rose-900 hover:text-white font-bold tracking-widest text-xs rounded transition-colors border border-[#8c7a6b]/30">
                        RESTART
                      </button>
                    </div>
                  )}

                  {/* 既存のPLAYボタン */}
                  {(!activeGameData || activeGameData.episodeId !== ep.id) && (
                    <button onClick={() => onPlayEpisode(ep.id)} className={`mt-4 w-full py-2.5 rounded font-bold tracking-widest text-xs sm:text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2 ${isPlayable ? 'bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8]' : 'bg-[#e6d5c3] text-[#8c7a6b] cursor-not-allowed opacity-50'}`} disabled={!isPlayable}>
                      <PlayCircle size={16} />
                      {isCleared ? 'REPLAY FILE' : isPlayable ? 'INITIATE SYNC' : 'FILE LOCKED'}
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}