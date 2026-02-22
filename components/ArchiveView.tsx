'use client';

import React, { useState } from 'react';
import {
  Database,
  ArrowLeft,
  Play,
  Lock,
  Zap,
  Link as LinkIcon,
} from 'lucide-react';
import glossaryData from '@/data/glossary.json';
import spiderWebData from '@/data/spider_web.json';

type ArchiveViewProps = {
  unlockedTerms: string[];
  readTerms: string[];
  insightPoints: number;
  clearedData: { [epId: string]: { rank: string; tether: number } };
  unlockedTruths: Record<string, any>;
  onReturnTitle: () => void;
  onReturnGame: () => void;
  onPlayEpisode: (epId: string) => void;
  onResearch: () => void;
  onReadTerm: (termId: string) => void;
  onUnlockTruth: (pinId: string, truthData: any, cost: number) => void;
  onLinkFail: (cost: number) => void;
};

export default function ArchiveView({
  unlockedTerms,
  readTerms,
  insightPoints,
  clearedData,
  unlockedTruths,
  onReturnTitle,
  onPlayEpisode,
  onResearch,
  onReadTerm,
  onUnlockTruth,
  onLinkFail,
}: ArchiveViewProps) {
  const [activeTab, setActiveTab] = useState<'case' | 'index' | 'spider'>(
    'case'
  );
  const [activeTerm, setActiveTerm] = useState<any | null>(null);

  // ▼ 新規追加(復元): A-Zフィルタリング用のステート
  const [activeLetter, setActiveLetter] = useState<string>('ALL');
  const alphabet = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);
  const [linkFeedback, setLinkFeedback] = useState<{
    msg: string;
    type: 'success' | 'fail';
  } | null>(null);

  const availableEpisodes = ['#01', '#02', '#03', '#06'];

  const unsolvedPins = spiderWebData.pins.filter(
    (pin) => clearedData[pin.source_episode] && !unlockedTruths[pin.id]
  );

  const handleLink = () => {
    if (!selectedPinId || !selectedIndexId) return;
    if (insightPoints < 1) {
      setLinkFeedback({
        msg: 'インサイトポイントが不足しています。',
        type: 'fail',
      });
      return;
    }

    const targetPin = spiderWebData.pins.find((p) => p.id === selectedPinId);
    if (targetPin && targetPin.required_index_id === selectedIndexId) {
      onUnlockTruth(targetPin.id, targetPin.unlocked_truth, 1);
      setLinkFeedback({
        msg: 'LINK確立。真実がアンロックされました！',
        type: 'success',
      });
      setSelectedPinId(null);
      setSelectedIndexId(null);
    } else {
      onLinkFail(1);
      setLinkFeedback({
        msg: '推理が間違っています。糸が焼き切れました。（-1 pt）',
        type: 'fail',
      });
      setSelectedIndexId(null);
    }

    setTimeout(() => setLinkFeedback(null), 3000);
  };

  // ▼ 新規追加(復元): 選択中のA-Zタブに合わせて単語をフィルタリング
  const filteredTerms = glossaryData.terms.filter((term) => {
    if (activeLetter === 'ALL') return true;
    return term.en.toUpperCase().startsWith(activeLetter);
  });

  return (
    <div className="w-full max-w-2xl bg-[#FDF6E3] border-4 border-slate-800 shadow-2xl flex flex-col h-[100dvh] sm:h-[90vh]">
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <h1 className="font-bold tracking-widest uppercase font-serif">
            Main System
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-mono">INSIGHT PT</p>
            <p className="font-bold text-amber-400 font-mono text-xl">
              {insightPoints}
            </p>
          </div>
          <button
            onClick={onReturnTitle}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex bg-slate-200 border-b-2 border-slate-400 shrink-0">
        <button
          onClick={() => setActiveTab('case')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest ${
            activeTab === 'case'
              ? 'bg-[#FDF6E3] border-t-2 border-slate-800 text-slate-800'
              : 'text-slate-500 hover:bg-slate-300'
          }`}
        >
          CASE FILES
        </button>
        <button
          onClick={() => setActiveTab('index')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest ${
            activeTab === 'index'
              ? 'bg-[#FDF6E3] border-t-2 border-slate-800 text-slate-800'
              : 'text-slate-500 hover:bg-slate-300'
          }`}
        >
          GREAT INDEX
        </button>
        <button
          onClick={() => setActiveTab('spider')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 ${
            activeTab === 'spider'
              ? 'bg-[#FDF6E3] border-t-2 border-red-800 text-red-800'
              : 'text-red-900/50 hover:bg-slate-300'
          }`}
        >
          <LinkIcon className="w-3 h-3" /> SPIDER'S WEB
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'case' && (
          <div className="p-4 overflow-y-auto h-full space-y-3 custom-scrollbar">
            {availableEpisodes.map((epId) => {
              const data = clearedData[epId];
              return (
                <div
                  key={epId}
                  className="border-2 border-slate-800 bg-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <h3 className="font-bold font-serif text-lg uppercase">
                      CASE : {epId}
                    </h3>
                    {data ? (
                      <div className="text-sm font-mono mt-1 space-x-3">
                        <span className="text-slate-500">
                          TETHER:{' '}
                          <span className="text-slate-800 font-bold">
                            {data.tether}%
                          </span>
                        </span>
                        <span className="text-slate-500">
                          RANK:{' '}
                          <span
                            className={`font-bold ${
                              data.rank === 'LUCID'
                                ? 'text-green-700'
                                : data.rank === 'SYMPATHETIC'
                                ? 'text-blue-700'
                                : 'text-red-700'
                            }`}
                          >
                            {data.rank}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-mono mt-1 text-slate-400">
                        UNRESOLVED
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onPlayEpisode(epId)}
                    className="flex items-center gap-1 bg-slate-800 text-white px-4 py-2 font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all w-full sm:w-auto justify-center"
                  >
                    <Play className="w-4 h-4" />{' '}
                    {data ? 'REINVESTIGATE' : 'INVESTIGATE'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'index' && (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-slate-100 flex justify-between items-center shrink-0 border-b border-slate-300">
              <p className="text-xs font-bold text-slate-500 uppercase">
                Unlocked: {unlockedTerms.length} / {glossaryData.terms.length}
              </p>
              <button
                onClick={onResearch}
                disabled={insightPoints <= 0}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4" /> RESEARCH (Cost: 1pt)
              </button>
            </div>

            {/* ▼ 復元部分: A-Z フィルタリングバー */}
            <div className="flex overflow-x-auto bg-slate-800 p-2 shrink-0 custom-scrollbar gap-1">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setActiveLetter(letter)}
                  className={`px-3 py-1 text-xs font-bold font-mono rounded transition-colors whitespace-nowrap ${
                    activeLetter === letter
                      ? 'bg-amber-500 text-slate-900 shadow-sm'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
              {filteredTerms.map((term) => {
                const isUnlocked = unlockedTerms.includes(term.id);
                const isUnread = isUnlocked && !readTerms.includes(term.id);
                if (!isUnlocked) {
                  return (
                    <div
                      key={term.id}
                      className="p-3 bg-slate-200 border border-slate-300 text-slate-400 flex items-center gap-3"
                    >
                      <Lock className="w-4 h-4" />{' '}
                      <span className="font-mono text-sm">ENCRYPTED DATA</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={term.id}
                    className={`border-2 p-3 cursor-pointer transition-colors ${
                      activeTerm?.id === term.id
                        ? 'border-amber-600 bg-amber-50'
                        : isUnread
                        ? 'border-amber-400 bg-white'
                        : 'border-slate-300 bg-white hover:border-slate-500'
                    }`}
                    onClick={() => {
                      setActiveTerm(term);
                      onReadTerm(term.id);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">
                        {term.ja}{' '}
                        <span className="text-xs text-slate-500 font-mono ml-2">
                          {term.en}
                        </span>
                      </h3>
                      {isUnread && (
                        <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    {activeTerm?.id === term.id && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-700 leading-relaxed font-serif">
                        {term.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'spider' && (
          <div className="flex flex-col h-full bg-[#f4ecd8] relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/noise.png')] mix-blend-overlay"></div>

            {Object.keys(unlockedTruths).length > 0 && (
              <div className="bg-slate-900 p-4 shrink-0 border-b-4 border-red-900 overflow-x-auto whitespace-nowrap custom-scrollbar relative z-10">
                <p className="text-[10px] text-slate-400 font-mono mb-2 uppercase tracking-widest">
                  Established Truths (真実のノード)
                </p>
                <div className="flex gap-4">
                  {Object.entries(unlockedTruths).map(([pinId, truth]) => (
                    <div
                      key={pinId}
                      className="inline-block w-64 bg-slate-800 border border-slate-600 p-3 whitespace-normal"
                    >
                      <h4 className="text-red-400 font-bold text-xs mb-1 border-b border-slate-600 pb-1">
                        {truth.node_title}
                      </h4>
                      <p className="text-slate-300 text-[10px] font-serif leading-relaxed line-clamp-3">
                        {truth.hidden_note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden relative z-10">
              <div className="w-1/2 border-r-2 border-slate-400 p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 text-center border-b border-slate-400 pb-1">
                  Unsolved Pins
                </p>
                {unsolvedPins.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center mt-4">
                    未解決の証拠はありません。
                  </p>
                ) : (
                  unsolvedPins.map((pin) => (
                    <button
                      key={pin.id}
                      onClick={() => setSelectedPinId(pin.id)}
                      className={`text-left p-2 border-2 text-xs font-serif leading-tight transition-all ${
                        selectedPinId === pin.id
                          ? 'bg-red-900 border-red-500 text-white shadow-inner'
                          : 'bg-white border-slate-400 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold font-mono text-[10px] mb-1 opacity-70">
                        CASE {pin.source_episode}
                      </div>
                      <div className="font-bold mb-1">{pin.title}</div>
                      <div className="text-[10px] opacity-80">
                        {pin.question}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="w-1/2 p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 text-center border-b border-slate-400 pb-1">
                  Index Cards
                </p>
                {unlockedTerms.map((termId) => {
                  const term = glossaryData.terms.find((t) => t.id === termId);
                  if (!term) return null;
                  return (
                    <button
                      key={term.id}
                      onClick={() => setSelectedIndexId(term.id)}
                      className={`text-left p-2 border-2 text-xs font-serif leading-tight transition-all ${
                        selectedIndexId === term.id
                          ? 'bg-amber-900 border-amber-500 text-white shadow-inner'
                          : 'bg-white border-slate-400 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold mb-1">{term.ja}</div>
                      <div className="text-[10px] opacity-80 line-clamp-2">
                        {term.details}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-300 p-4 border-t-2 border-slate-400 shrink-0 relative z-10">
              {linkFeedback && (
                <div
                  className={`mb-3 p-2 text-center text-xs font-bold border ${
                    linkFeedback.type === 'success'
                      ? 'bg-green-100 text-green-800 border-green-400'
                      : 'bg-red-100 text-red-800 border-red-400'
                  }`}
                >
                  {linkFeedback.msg}
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex-1 text-center text-xs font-bold font-serif text-slate-800 truncate px-2">
                  {selectedPinId
                    ? spiderWebData.pins.find((p) => p.id === selectedPinId)
                        ?.title
                    : 'Select Pin...'}
                </div>
                <button
                  onClick={handleLink}
                  disabled={
                    !selectedPinId || !selectedIndexId || insightPoints < 1
                  }
                  className="mx-2 bg-red-800 hover:bg-red-700 disabled:bg-slate-400 text-white px-6 py-2 rounded font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:scale-100"
                >
                  <LinkIcon className="w-4 h-4" /> LINK (1pt)
                </button>
                <div className="flex-1 text-center text-xs font-bold font-serif text-slate-800 truncate px-2">
                  {selectedIndexId
                    ? glossaryData.terms.find((t) => t.id === selectedIndexId)
                        ?.ja
                    : 'Select Index...'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
