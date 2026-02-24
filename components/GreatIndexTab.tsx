'use client';

import React, { useState } from 'react';
import { Lock, Search } from 'lucide-react';
import glossaryData from '@/data/glossary.json';

// --- 型定義 ---
type ClearedData = Record<string, any>; // 汎用的な Record 型に変更して型エラーを防ぐ

// ArchiveView から渡される Props と完全に一致させる
type GreatIndexTabProps = {
  unlockedTerms: string[];
  readTerms: string[];
  insightPoints: number;
  clearedData?: ClearedData; // optionalにすることで親からの受け渡しエラーを防ぐ
  onResearch: () => void;
  onReadTerm: (termId: string) => void;
};

const ALPHABETS = [
  'ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export default function GreatIndexTab({
  unlockedTerms = [],
  readTerms = [],
  insightPoints = 0,
  clearedData = {},
  onResearch,
  onReadTerm,
}: GreatIndexTabProps) {
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  const unlockedCount = unlockedTerms.length;
  const totalCount = glossaryData.terms.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100) || 0;

  const clearedEpIds = Object.keys(clearedData); 
  
  // 未解読で、かつ現在アンロック可能な用語の数を計算
  const unlockableTermsCount = glossaryData.terms.filter(
    (t) =>
      !unlockedTerms.includes(t.id) &&
      (t.appearance === 'general' || clearedEpIds.includes(t.appearance) || t.appearance.startsWith('SP-'))
  ).length;

  const filteredTerms = glossaryData.terms.filter((term) => {
    if (selectedLetter === 'ALL') return true;
    return term.id.startsWith(selectedLetter);
  });

  const hasNewInLetter = (letter: string) => {
    return glossaryData.terms.some((term) => {
      if (letter !== 'ALL' && !term.id.startsWith(letter)) return false;
      return unlockedTerms.includes(term.id) && !readTerms.includes(term.id);
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* ヘッダー部分 */}
      <div className="flex items-end justify-between mb-6 border-b border-[#8c7a6b]/30 pb-4">
        <div>
          <p className="text-[#8c7a6b] text-xs sm:text-sm font-mono tracking-widest">
            大索引 - 網羅的犯罪アーカイブ
          </p>
          <h2 className="text-2xl font-bold text-[#3a2f29] font-serif mt-1">
            THE GREAT INDEX
          </h2>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-mono text-[#8c7a6b] uppercase tracking-widest mb-1">
            Data Restored
          </p>
          <p className="text-xl font-bold text-amber-600 font-mono mb-3">
            {unlockPercentage}%{' '}
            <span className="text-sm text-[#8c7a6b]">
              ({unlockedCount}/{totalCount})
            </span>
          </p>

          {unlockableTermsCount > 0 ? (
            <button
              onClick={onResearch}
              disabled={insightPoints <= 0}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-full disabled:bg-[#d8c8b8] disabled:text-[#8c7a6b] disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
            >
              <Search size={14} /> 解析 (Cost:1)
            </button>
          ) : (
            <span className="text-[9px] text-emerald-700 font-bold border border-emerald-700/50 bg-emerald-700/10 px-2 py-1 rounded uppercase tracking-widest">
              Available Data Restored
            </span>
          )}
        </div>
      </div>

      {/* スマホ最適化：横スクロールのA-Zタブ */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar snap-x">
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
              className={`snap-start relative px-4 py-1.5 font-mono font-bold text-xs sm:text-sm rounded-full transition-colors flex-shrink-0 border ${
                isSelected
                  ? 'bg-[#5c4d43] text-[#f4ebd8] border-[#5c4d43] shadow-md'
                  : 'bg-[#e6d5c3] text-[#5c4d43] border-[#8c7a6b]/30 hover:bg-[#d8c8b8]'
              }`}
            >
              {letter}
              {showNewBadge && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm border border-[#f4ebd8]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 用語リスト */}
      <div className="grid gap-3">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term) => {
            const isUnlocked = unlockedTerms.includes(term.id);
            const isRead = readTerms.includes(term.id);
            const isNew = isUnlocked && !isRead;
            const isExpanded = expandedTermId === term.id;

            return (
              <div
                key={term.id}
                className={`rounded-xl border ${
                  isUnlocked
                    ? 'bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm'
                    : 'bg-[#e6d5c3]/40 border-transparent opacity-60'
                } overflow-hidden transition-all duration-300`}
              >
                <div
                  onClick={() => {
                    if (isUnlocked) {
                      setExpandedTermId(isExpanded ? null : term.id);
                      if (!isRead && onReadTerm) onReadTerm(term.id);
                    }
                  }}
                  className={`p-4 sm:p-5 flex items-start justify-between ${
                    isUnlocked ? 'cursor-pointer active:bg-[#f4ebd8]' : 'cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[10px] font-mono font-bold text-[#8c7a6b] px-1.5 py-0.5 rounded bg-[#e6d5c3]">
                        {term.id} / {isUnlocked ? term.category : '???'}
                      </div>
                      {isNew && (
                        <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm tracking-widest">
                          NEW
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base leading-tight font-serif mt-1 ${
                        isUnlocked ? 'text-[#3a2f29]' : 'text-[#8c7a6b] blur-sm select-none'
                      }`}
                    >
                      {isUnlocked ? term.ja : 'UNKNOWN DATA FILE'}
                    </h3>
                    <p className={`text-[10px] font-mono mt-1 ${isUnlocked ? 'text-[#8c7a6b]' : 'text-transparent'}`}>
                      {isUnlocked ? term.en : ''}
                    </p>
                  </div>
                  {!isUnlocked && (
                    <Lock size={18} className="text-[#8c7a6b] mt-2" />
                  )}
                </div>

                {isUnlocked && isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-[#8c7a6b]/20 bg-[#f4ebd8]/50 animate-in slide-in-from-top-2">
                    <p className="text-sm text-[#3a2f29] leading-relaxed font-serif">
                      {term.details}
                    </p>
                    <div className="mt-4 bg-[#e6d5c3]/40 p-3 rounded-lg border border-[#8c7a6b]/30 shadow-inner">
                      <p className="text-[9px] font-mono text-[#5c4d43] font-bold mb-1 tracking-widest uppercase">
                        Holmes's Critique :
                      </p>
                      <p className="text-sm text-[#3a2f29] italic font-serif leading-relaxed">
                        「{term.critique}」
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-[#8c7a6b] font-mono text-xs border border-dashed border-[#8c7a6b]/30 rounded-xl bg-[#e6d5c3]/20">
            No data found in section "{selectedLetter}".
          </div>
        )}
      </div>
    </div>
  );
}