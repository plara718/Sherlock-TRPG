'use client';

import React, { useState } from 'react';
import { Lock, Search } from 'lucide-react';
import glossaryData from '@/data/glossary.json';

type ClearedData = {
  [epId: string]: { rank: string; tether: number };
};

type GreatIndexTabProps = {
  unlockedTerms: string[];
  readTerms: string[];
  insightPoints: number;
  clearedData: ClearedData;
  onResearch: () => void;
  onReadTerm: (termId: string) => void;
};

const ALPHABETS = [
  'ALL',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

export default function GreatIndexTab({
  unlockedTerms,
  readTerms,
  insightPoints,
  clearedData,
  onResearch,
  onReadTerm,
}: GreatIndexTabProps) {
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const unlockedCount = unlockedTerms.length;
  const totalCount = glossaryData.terms.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100) || 0;

  // ▼修正：プレフィックス S1- を削除し、そのままのエピソードIDを使用する
  const clearedEpIds = Object.keys(clearedData); 
  
  const unlockableTermsCount = glossaryData.terms.filter(
    (t) =>
      !unlockedTerms.includes(t.id) &&
      (t.appearance === 'general' || clearedEpIds.includes(t.appearance) || t.appearance === 'SP-01') // SP-01などの特殊タグも許容できる形に
  ).length;

  // タブのフィルタリング処理
  const filteredTerms = glossaryData.terms.filter((term) => {
    if (selectedLetter === 'ALL') return true;
    return term.id.startsWith(selectedLetter);
  });

  // そのアルファベットタブの中に未読（NEW）があるかどうかを判定
  const hasNewInLetter = (letter: string) => {
    return glossaryData.terms.some((term) => {
      if (letter !== 'ALL' && !term.id.startsWith(letter)) return false;
      return unlockedTerms.includes(term.id) && !readTerms.includes(term.id);
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-6 border-b border-slate-300 pb-4">
        <div>
          <p className="text-slate-600 text-xs sm:text-sm font-mono">
            大索引 - 網羅的犯罪アーカイブ
          </p>
          <h2 className="text-2xl font-bold text-slate-900 font-serif mt-1">
            THE GREAT INDEX
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-slate-800 text-amber-500 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-inner">
              INSIGHT: {insightPoints} pt
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
            Data Restored
          </p>
          <p className="text-xl font-bold text-amber-600 font-mono mb-3">
            {unlockPercentage}%{' '}
            <span className="text-sm text-slate-500">
              ({unlockedCount}/{totalCount})
            </span>
          </p>

          {unlockableTermsCount > 0 ? (
            <button
              onClick={onResearch}
              disabled={insightPoints <= 0}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow"
            >
              <Search size={14} /> 未解読データを解析 (消費:1)
            </button>
          ) : (
            <span className="text-[10px] text-green-700 font-bold border-2 border-green-700 px-3 py-1 rounded uppercase tracking-widest">
              Available Data Restored
            </span>
          )}
        </div>
      </div>

      {/* A-Z タブナビゲーション */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 border-b border-slate-300 pb-4">
        {ALPHABETS.map((letter) => {
          const showNewBadge = hasNewInLetter(letter);
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              onClick={() => {
                setSelectedLetter(letter);
                setExpandedTermId(null);
              }}
              className={`relative px-2.5 sm:px-3 py-1 font-mono font-bold text-[11px] sm:text-sm rounded border transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'bg-slate-800 text-amber-500 border-slate-800 shadow-md'
                  : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
              }`}
            >
              {letter}
              {showNewBadge && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-sm border border-slate-100" />
              )}
            </button>
          );
        })}
      </div>

      {/* フィルタリングされた用語リスト */}
      <div className="grid gap-4">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term) => {
            const isUnlocked = unlockedTerms.includes(term.id);
            const isRead = readTerms.includes(term.id);
            const isNew = isUnlocked && !isRead;
            const isExpanded = expandedTermId === term.id;

            return (
              <div
                key={term.id}
                className={`rounded-lg border-2 overflow-hidden transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-white border-slate-800 shadow-sm'
                    : 'bg-slate-200 border-slate-300 opacity-60'
                }`}
              >
                <div
                  onClick={() => {
                    if (isUnlocked) {
                      setExpandedTermId(isExpanded ? null : term.id);
                      if (!isRead) onReadTerm(term.id);
                    }
                  }}
                  className={`p-4 flex items-start justify-between ${
                    isUnlocked
                      ? 'cursor-pointer hover:bg-slate-50'
                      : 'cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[10px] font-mono font-bold text-slate-500">
                        {term.id} / {isUnlocked ? term.category : '???'}
                      </div>
                      {isNew && (
                        <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse shadow-sm">
                          NEW
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-bold text-lg font-serif ${
                        isUnlocked
                          ? 'text-slate-900'
                          : 'text-slate-400 blur-sm select-none'
                      }`}
                    >
                      {isUnlocked ? term.ja : 'UNKNOWN DATA FILE'}
                    </h3>
                    <p
                      className={`text-xs font-mono mt-1 ${
                        isUnlocked ? 'text-slate-500' : 'text-transparent'
                      }`}
                    >
                      {isUnlocked ? term.en : ''}
                    </p>
                  </div>
                  {!isUnlocked && (
                    <Lock size={20} className="text-slate-400 ml-4 mt-2" />
                  )}
                </div>

                {isUnlocked && isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-200 bg-slate-50 animate-in slide-in-from-top-2 mt-2">
                    <p className="text-sm text-slate-700 leading-relaxed pt-3">
                      {term.details}
                    </p>
                    <div className="mt-4 bg-[#FDF6E3] p-3 rounded border border-amber-200 shadow-inner">
                      <p className="text-[10px] font-mono text-amber-800 font-bold mb-1 tracking-widest">
                        Holmes's Critique :
                      </p>
                      <p className="text-sm text-slate-800 italic font-serif leading-relaxed">
                        「{term.critique}」
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-500 font-mono text-sm border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            No data found in section "{selectedLetter}".
          </div>
        )}
      </div>
    </div>
  );
}