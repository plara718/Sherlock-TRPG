'use client';

import React, { useState, memo, useCallback, useEffect } from 'react';
import { Lock, Search, AlertTriangle, X, Database } from 'lucide-react';
import glossaryData from '@/data/glossary.json';
import { useSaveData } from '@/lib/SaveDataContext';

const ALPHABETS = [
  'NEW', 'ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// 個別の用語カード（再描画防止）
const TermCard = memo(function TermCard({ 
  term, isUnlocked, isRead, isExpanded, onToggle, isGlitch, overrideJa, overrideEn, overrideDetails, overrideCritique, isPostReichenbach 
}: any) {
  const isNew = isUnlocked && !isRead;

  return (
    <div className={`rounded-xl border ${isUnlocked ? isGlitch ? 'bg-[#1a0f0f] border-rose-900/80 shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm' : 'bg-[#e6d5c3]/40 border-transparent opacity-60'} overflow-hidden transition-all duration-300`}>
      <div onClick={onToggle} className={`p-4 sm:p-5 flex items-start justify-between ${isUnlocked ? 'cursor-pointer active:bg-[#f4ebd8]' : 'cursor-not-allowed'}`}>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isGlitch ? 'bg-rose-950 text-rose-500' : 'bg-[#e6d5c3] text-[#8c7a6b]'}`}>
              {term.id} / {isUnlocked ? term.category : '???'}
            </div>
            {isNew && <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm tracking-widest">NEW</span>}
            {isGlitch && !isNew && <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-rose-500 animate-pulse uppercase tracking-widest border border-rose-900/50 bg-rose-950/50 px-1.5 py-0.5 rounded"><AlertTriangle size={10} /> CORRUPTED</span>}
          </div>
          <h3 className={`font-bold text-base leading-tight font-serif mt-1 ${isUnlocked ? (isGlitch ? 'text-rose-600 font-black tracking-widest' : 'text-[#3a2f29]') : 'text-[#8c7a6b] blur-sm select-none'}`}>
            {isUnlocked ? overrideJa : 'UNKNOWN DATA FILE'}
          </h3>
          <p className={`text-[10px] font-mono mt-1 ${isUnlocked ? (isGlitch ? 'text-rose-800' : 'text-[#8c7a6b]') : 'text-transparent'}`}>
            {isUnlocked ? overrideEn : ''}
          </p>
        </div>
        {!isUnlocked && <Lock size={18} className="text-[#8c7a6b] mt-2" />}
      </div>

      {isUnlocked && isExpanded && (
        <div className={`p-4 sm:p-5 border-t animate-in slide-in-from-top-2 ${isGlitch ? 'border-rose-900/50 bg-black/20' : 'border-[#8c7a6b]/20 bg-[#f4ebd8]/50'}`}>
          <p className={`text-sm leading-relaxed font-serif whitespace-pre-wrap ${isGlitch ? 'text-rose-500 font-bold' : 'text-[#3a2f29]'}`}>{overrideDetails}</p>
          <div className={`mt-4 p-3 rounded-lg border shadow-inner ${isGlitch ? 'bg-rose-950/30 border-rose-900/40' : 'bg-[#e6d5c3]/40 border-[#8c7a6b]/30'}`}>
            <p className={`text-[9px] font-mono font-bold mb-1 tracking-widest uppercase ${isGlitch ? 'text-rose-700' : 'text-[#5c4d43]'}`}>
              {isPostReichenbach && term.id === 'M021' ? "Watson's Journal :" : "Holmes's Critique :"}
            </p>
            <p className={`text-sm italic font-serif leading-relaxed ${isGlitch ? 'text-rose-400 font-bold animate-[pulse_2s_ease-in-out_infinite]' : 'text-[#3a2f29]'}`}>{overrideCritique}</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default function GreatIndexTab() {
  const { unlockedTerms, setUnlockedTerms, readTerms, insightPoints, clearedData, handleReadTerm, handleSpendPoint } = useSaveData();

  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  // ガチャ演出用のステート
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [newlyUnlockedTerm, setNewlyUnlockedTerm] = useState<any | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const unlockedCount = unlockedTerms.length;
  const totalCount = glossaryData.terms.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100) || 0;

  const clearedEpIds = Object.keys(clearedData); 
  const isSeason3Phase3 = clearedEpIds.includes('#38') || clearedEpIds.includes('#39');
  const isPostReichenbach = clearedEpIds.includes('#40');
  
  const availableTerms = glossaryData.terms.filter(
    (t) => !unlockedTerms.includes(t.id) && (t.appearance === 'general' || clearedEpIds.includes(t.appearance) || t.appearance.startsWith('SP-'))
  );

  // ガチャ実行ロジック
  const executeGacha = () => {
    if (insightPoints <= 0 || availableTerms.length === 0) return;
    
    // ポイント消費
    if (!handleSpendPoint(1)) return;

    // 用語を抽選
    const randomTerm = availableTerms[Math.floor(Math.random() * availableTerms.length)];
    
    // 演出開始
    setIsDecrypting(true);
    setNewlyUnlockedTerm(randomTerm);

    // 1.5秒のハッキング演出後にポップアップ表示
    setTimeout(() => {
      setIsDecrypting(false);
      setShowPopup(true);
      
      // データ的にアンロックを確定させる
      setUnlockedTerms([...unlockedTerms, randomTerm.id]);
    }, 1500);
  };

  // ポップアップを閉じる処理
  const closePopup = () => {
    setShowPopup(false);
    setNewlyUnlockedTerm(null);
    setSelectedLetter('NEW'); // 自動でNEWタブへ
    setExpandedTermId(null);
  };

  const filteredTerms = glossaryData.terms.filter((term) => {
    if (selectedLetter === 'NEW') return unlockedTerms.includes(term.id) && !readTerms.includes(term.id);
    if (selectedLetter === 'ALL') return true;
    return term.id.startsWith(selectedLetter);
  });

  const hasNewInLetter = useCallback((letter: string) => {
    if (letter === 'NEW') return false; 
    return glossaryData.terms.some((term) => {
      if (letter !== 'ALL' && !term.id.startsWith(letter)) return false;
      return unlockedTerms.includes(term.id) && !readTerms.includes(term.id);
    });
  }, [unlockedTerms, readTerms]);

  const handleToggleTerm = useCallback((termId: string, isUnlocked: boolean, isRead: boolean) => {
    if (isUnlocked) {
      setExpandedTermId(prev => prev === termId ? null : termId);
      if (!isRead) handleReadTerm(termId);
    }
  }, [handleReadTerm]);

  return (
    <div className="animate-in fade-in duration-300 relative min-h-screen">
      
      {/* ▼ ガチャ演出：ノイズ走査線画面（Z-Index高） */}
      {isDecrypting && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(16,185,129,0.1)_2px,rgba(16,185,129,0.1)_4px)] animate-[pulse_0.1s_infinite]" />
          <Database className="w-16 h-16 text-emerald-500 mb-6 animate-spin-slow opacity-80" />
          <h2 className="font-mono text-2xl md:text-4xl text-emerald-400 font-bold tracking-[0.5em] animate-pulse drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
            DECRYPTING...
          </h2>
          <p className="mt-4 font-mono text-emerald-600/60 text-xs tracking-widest">
            EXTRACTING DATA FROM THE INDEX
          </p>
          {/* ランダムな文字が流れるエフェクト */}
          <div className="absolute bottom-10 w-full text-center font-mono text-[10px] text-emerald-800/40 break-all px-4 overflow-hidden h-20 opacity-50">
            {Array.from({length: 200}).map(() => Math.random().toString(36).substring(2, 3)).join('')}
          </div>
        </div>
      )}

      {/* ▼ ガチャ演出：獲得結果ポップアップ */}
      {showPopup && newlyUnlockedTerm && (
        <div className="fixed inset-0 z-50 bg-[#1a1512]/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#fffcf7] max-w-sm w-full rounded-2xl shadow-2xl border-2 border-emerald-600/50 relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="p-6 text-center">
              <p className="text-[10px] font-mono font-bold text-emerald-600 tracking-widest uppercase mb-1 flex items-center justify-center gap-1">
                <Search size={12} /> DATA RESTORED
              </p>
              <h3 className="text-2xl font-serif font-bold text-[#3a2f29] mb-1">{newlyUnlockedTerm.ja}</h3>
              <p className="text-xs font-mono text-[#8c7a6b] mb-6">{newlyUnlockedTerm.en}</p>
              
              <div className="bg-[#e6d5c3]/30 p-4 rounded-lg border border-[#8c7a6b]/20 shadow-inner mb-6 text-left">
                <span className="text-[9px] text-[#8c7a6b] font-bold px-1.5 py-0.5 rounded border border-[#8c7a6b]/30 mb-2 inline-block">
                  {newlyUnlockedTerm.id} / {newlyUnlockedTerm.category}
                </span>
                <p className="text-sm font-serif text-[#5c4d43] leading-relaxed line-clamp-4">
                  {newlyUnlockedTerm.details}
                </p>
              </div>

              <button onClick={closePopup} className="w-full py-3 bg-[#5c4d43] hover:bg-[#3a2f29] text-[#f4ebd8] rounded-xl font-bold tracking-widest text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2">
                CLOSE & READ MORE <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 以下、通常の大索引UI（変更なし） */}
      <div className={`flex items-end justify-between mb-6 border-b pb-4 ${isSeason3Phase3 && !isPostReichenbach ? 'border-rose-900/50' : 'border-[#8c7a6b]/30'}`}>
        <div>
          <p className={`text-xs sm:text-sm font-mono tracking-widest ${isSeason3Phase3 && !isPostReichenbach ? 'text-rose-600 animate-pulse' : 'text-[#8c7a6b]'}`}>
            {isSeason3Phase3 && !isPostReichenbach ? 'SYSTEM ALERT - FATAL ERROR' : '大索引 - 網羅的犯罪アーカイブ'}
          </p>
          <h2 className={`text-2xl font-bold font-serif mt-1 ${isSeason3Phase3 && !isPostReichenbach ? 'text-rose-700' : 'text-[#3a2f29]'}`}>
            THE GREAT INDEX
          </h2>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-mono text-[#8c7a6b] uppercase tracking-widest mb-1">
            Data Restored
          </p>
          <p className="text-xl font-bold text-amber-600 font-mono mb-3">
            {unlockPercentage}% <span className="text-sm text-[#8c7a6b]">({unlockedCount}/{totalCount})</span>
          </p>

          {availableTerms.length > 0 ? (
            <button
              onClick={executeGacha} // ▼ 修正：ContextのhandleResearchではなく独自のexecuteGachaを呼ぶ
              disabled={insightPoints <= 0 || isDecrypting}
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

      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar snap-x">
        {ALPHABETS.map((letter) => {
          const showNewBadge = hasNewInLetter(letter);
          const isSelected = selectedLetter === letter;
          const isNewTab = letter === 'NEW';
          
          return (
            <button
              key={letter}
              onClick={() => { setSelectedLetter(letter); setExpandedTermId(null); }}
              className={`snap-start relative px-4 py-1.5 font-mono font-bold text-xs sm:text-sm rounded-full transition-colors flex-shrink-0 border ${isSelected ? isNewTab ? 'bg-rose-700 text-white border-rose-700 shadow-md' : 'bg-[#5c4d43] text-[#f4ebd8] border-[#5c4d43] shadow-md' : isNewTab ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-[#e6d5c3] text-[#5c4d43] border-[#8c7a6b]/30 hover:bg-[#d8c8b8]'}`}
            >
              {letter}
              {showNewBadge && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm border border-[#f4ebd8]" />}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term) => {
            const isUnlocked = unlockedTerms.includes(term.id);
            const isRead = readTerms.includes(term.id);
            const isExpanded = expandedTermId === term.id;
            
            let overrideJa = term.ja, overrideEn = term.en, overrideDetails = term.details, overrideCritique = term.critique, isGlitch = false;

            if (term.id === 'M021' && isSeason3Phase3 && !isPostReichenbach) {
              isGlitch = true;
              overrideDetails = "[SYSTEM OVERRIDE] 彼は数学の天才でも、犯罪界のナポレオンでもない。ただの鏡だ。私の論理が産み落とした、最も完璧な『殺意』そのものだ。インフラは燃えた。盤面は消えた。あとはただ、私と彼、どちらの知能が渊の底で冷たく死ぬかだけだ。";
              overrideCritique = "「彼を道連れにできるのなら、私は喜んでこの命を絶とう。」";
            }
            if (term.id === 'M021' && isPostReichenbach) {
              overrideDetails = "【公式記録】1891年5月4日、スイス・ライヘンバッハの滝において転落死。ロンドンを支配した巨大な犯罪ネットワークは、彼と共に完全に消滅した。";
              overrideCritique = "「（……この項に対するホームズの批評はない。彼もまた、淵の底へ消えたからだ）」";
            }
            if (term.id === 'I007' && clearedEpIds.includes('SP-03')) {
              overrideDetails = term.details + "\n\n【追記】彼女はボヘミア王の事件の後も大陸で暗躍を続け、モリアーティの資金網・情報網を単身で撹乱した。私（ワトスン）が知る限り、彼らの完全な数式を『盤面の外側』から破壊できたのは、彼女ただ一人である。";
            }

            return (
              <TermCard key={term.id} term={term} isUnlocked={isUnlocked} isRead={isRead} isExpanded={isExpanded} onToggle={() => handleToggleTerm(term.id, isUnlocked, isRead)} isGlitch={isGlitch} overrideJa={overrideJa} overrideEn={overrideEn} overrideDetails={overrideDetails} overrideCritique={overrideCritique} isPostReichenbach={isPostReichenbach} />
            );
          })
        ) : (
          <div className="text-center py-12 text-[#8c7a6b] font-mono text-xs border border-dashed border-[#8c7a6b]/30 rounded-xl bg-[#e6d5c3]/20">
            No unread data found in &quot;{selectedLetter}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}