'use client';

import React, { useState, memo, useCallback, useRef } from 'react';
import { Lock, Search, AlertTriangle, X, Database, Paperclip, Link as LinkIcon } from 'lucide-react';
import glossaryData from '@/data/glossary.json';
import { useSaveData } from '@/lib/SaveDataContext';

const ALPHABETS = [
  'NEW', 'ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// ▼ 新規追加：大分類カテゴリの定義と、キーワードによる振り分けルール（強化版）
const MAIN_CATEGORIES = [
  'ALL',
  '人物 (容疑者/被害者/関係者)',
  '組織・派閥',
  '地理・場所',
  '事件・証拠・凶器',
  '科学・知識・歴史',
  'その他'
];

const getCategoryGroup = (categoryString: string): string => {
  if (!categoryString) return 'その他';
  
  const cat = categoryString;
  // 1. 人物系
  if (cat.includes('人物') || cat.includes('依頼人') || cat.includes('容疑者') || 
      cat.includes('協力者') || cat.includes('犯罪者') || cat.includes('被害者') || 
      cat.includes('貴族') || cat.includes('警察') || cat.includes('医師') || 
      cat.includes('家政婦') || cat.includes('執事') || cat.includes('証言者') || 
      cat.includes('探偵') || cat.includes('著者') || cat.includes('乗組員') || 
      cat.includes('科学者') || cat.includes('関係者') || cat.includes('偽名') || cat.includes('肉屋') || cat.includes('動物') || cat.includes('数学者') || cat.includes('人物集団')) {
    return '人物 (容疑者/被害者/関係者)';
  }
  // 2. 組織系
  if (cat.includes('組織') || cat.includes('結社') || cat.includes('マフィア') || cat.includes('宗教') || cat.includes('企業')) {
    return '組織・派閥';
  }
  // 3. 場所・地理系
  if (cat.includes('地名') || cat.includes('場所') || cat.includes('国家') || cat.includes('地理') || cat.includes('環境') || cat.includes('拠点')) {
    return '地理・場所';
  }
  // 4. 科学・知識・歴史系
  if (cat.includes('科学') || cat.includes('知識') || cat.includes('歴史') || 
      cat.includes('言及') || cat.includes('学問') || cat.includes('法医学') || 
      cat.includes('研究') || cat.includes('文献') || cat.includes('概念') || 
      cat.includes('技術') || cat.includes('技能') || cat.includes('生物') || 
      cat.includes('思想') || cat.includes('オカルト')) {
    return '科学・知識・歴史';
  }
  // 5. 事件・証拠系
  if (cat.includes('事件') || cat.includes('悲劇') || cat.includes('証拠') || 
      cat.includes('凶器') || cat.includes('アイテム') || cat.includes('暗号') || 
      cat.includes('動機') || cat.includes('偽装') || cat.includes('交通') || 
      cat.includes('船舶') || cat.includes('物証') || cat.includes('薬物') || 
      cat.includes('記録') || cat.includes('犯罪類型') || cat.includes('アーカイブ') || cat.includes('奇譚') || cat.includes('傷害') || cat.includes('観察') || cat.includes('トリック') || cat.includes('奇行')) {
    return '事件・証拠・凶器';
  }

  return 'その他';
};

const TermCard = memo(function TermCard({ 
  term, isUnlocked, isRead, isExpanded, onToggle, isGlitch, overrideJa, overrideEn, overrideDetails, overrideCritique, isPostReichenbach, onLinkClick, unlockedTerms, allTerms
}: any) {
  const isNew = isUnlocked && !isRead;

  return (
    <div id={`term-${term.id}`} className={`relative rounded-sm border-2 ${isUnlocked ? isGlitch ? 'bg-[#1a0f0f] border-rose-900/80 shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-[#fdfbf7] border-[#8c7a6b]/40 shadow-[2px_4px_8px_rgba(0,0,0,0.05)]' : 'bg-[#e6d5c3]/30 border-dashed border-[#8c7a6b]/30 opacity-70'} overflow-visible transition-all duration-300 mt-2`}>
      
      {isUnlocked && !isGlitch && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#e6d5c3]/90 shadow-sm border border-[#8c7a6b]/10 -rotate-1 z-10" />
      )}

      <div onClick={onToggle} className={`relative p-4 sm:p-5 flex items-start justify-between ${isUnlocked ? 'cursor-pointer hover:bg-[#f4ebd8]/30' : 'cursor-not-allowed'}`}>
        
        {isNew && (
          <div className="absolute top-3 right-12 border-2 border-rose-600/60 text-rose-600/60 font-mono text-[10px] font-bold px-1.5 py-0.5 rotate-[15deg] rounded-sm tracking-widest pointer-events-none mix-blend-multiply">
            UNREAD
          </div>
        )}

        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm border ${isGlitch ? 'bg-rose-950/50 border-rose-800 text-rose-500' : 'bg-[#fffcf7] border-[#8c7a6b]/30 text-[#5c4d43]'}`}>
              FILE No. {term.id}
            </div>
            <div className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm border ${isGlitch ? 'border-rose-800 text-rose-500' : 'border-[#8c7a6b]/20 text-[#8c7a6b]'}`}>
              {isUnlocked ? `${getCategoryGroup(term.category)} (${term.category})` : '???'}
            </div>
            {isGlitch && !isNew && <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-rose-500 animate-pulse uppercase tracking-widest"><AlertTriangle size={10} /> CORRUPTED</span>}
          </div>
          <h3 className={`font-bold text-lg leading-tight font-serif mt-1 ${isUnlocked ? (isGlitch ? 'text-rose-600 font-black tracking-widest' : 'text-[#3a2f29]') : 'text-[#8c7a6b] blur-sm select-none'}`}>
            {isUnlocked ? overrideJa : 'UNKNOWN DATA FILE'}
          </h3>
          <p className={`text-[10px] font-mono mt-1 ${isUnlocked ? (isGlitch ? 'text-rose-800' : 'text-[#8c7a6b]') : 'text-transparent'}`}>
            {isUnlocked ? overrideEn : ''}
          </p>
        </div>
        {!isUnlocked && <Lock size={18} className="text-[#8c7a6b] mt-2" />}
      </div>

      {isUnlocked && isExpanded && (
        <div className={`p-5 sm:p-6 border-t-2 border-dashed animate-in slide-in-from-top-2 relative ${isGlitch ? 'border-rose-900/50 bg-black/40' : 'border-[#8c7a6b]/20 bg-gradient-to-b from-[#fcf8f2] to-[#f4ebd8]/30'}`}>
          
          <div className={`font-serif text-sm leading-loose whitespace-pre-wrap ${isGlitch ? 'text-rose-500 font-bold' : 'text-[#3a2f29]'}`}>
            {overrideDetails}
          </div>

          {overrideCritique && (
            <div className={`relative mt-8 p-4 rounded-sm shadow-md rotate-1 ${isGlitch ? 'bg-rose-950/80 border border-rose-900/50' : 'bg-[#fffcf7] border border-[#8c7a6b]/20'}`}>
              <div className="absolute -top-3 left-4 text-slate-400 rotate-[-15deg]">
                <Paperclip size={20} />
              </div>
              <p className={`text-[10px] font-mono font-bold mb-2 tracking-widest uppercase border-b pb-1 ${isGlitch ? 'text-rose-500 border-rose-500/30' : 'text-[#8c7a6b] border-[#8c7a6b]/30'}`}>
                {isPostReichenbach && term.id === 'M021' ? "Watson's Journal :" : "Holmes's Note :"}
              </p>
              <p className={`text-sm italic font-serif leading-relaxed ${isGlitch ? 'text-rose-400 font-bold animate-[pulse_2s_ease-in-out_infinite]' : 'text-[#5c4d43]'}`}>
                {overrideCritique}
              </p>
            </div>
          )}

          {term.links && term.links.length > 0 && (
            <div className="mt-8 pt-4 border-t border-[#8c7a6b]/20">
              <p className="text-[10px] font-mono font-bold mb-3 tracking-widest text-[#8c7a6b] flex items-center gap-1">
                <LinkIcon size={12} className="text-rose-700" /> RELATED FILES
              </p>
              <div className="flex flex-wrap gap-2">
                {term.links.map((linkId: string) => {
                  const targetTerm = allTerms.find((t: any) => t.id === linkId);
                  if (!targetTerm) return null;
                  
                  const isTargetUnlocked = unlockedTerms.includes(linkId);
                  
                  return (
                    <button
                      key={linkId}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isTargetUnlocked) onLinkClick(linkId);
                      }}
                      disabled={!isTargetUnlocked}
                      className={`text-xs font-serif px-3 py-1.5 rounded-sm border transition-all flex items-center gap-1.5 
                        ${isTargetUnlocked 
                          ? 'bg-[#fffcf7] border-rose-900/30 text-[#5c4d43] hover:bg-rose-50 hover:border-rose-900/50 shadow-sm active:scale-95' 
                          : 'bg-[#e6d5c3]/20 border-[#8c7a6b]/20 text-[#8c7a6b] opacity-60 cursor-not-allowed'}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700/80" />
                      {isTargetUnlocked ? targetTerm.ja : '??? (LOCKED)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function GreatIndexTab() {
  const { unlockedTerms, setUnlockedTerms, readTerms, insightPoints, clearedData, handleReadTerm, handleSpendPoint } = useSaveData();

  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [isDecrypting, setIsDecrypting] = useState(false);
  const [newlyUnlockedTerm, setNewlyUnlockedTerm] = useState<any | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const unlockedCount = unlockedTerms.length;
  const totalCount = glossaryData.terms.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100) || 0;

  const clearedEpIds = Object.keys(clearedData); 
  const isSeason3Phase3 = clearedEpIds.includes('#38') || clearedEpIds.includes('#39');
  const isPostReichenbach = clearedEpIds.includes('#40');
  
  // ▼ 修正：appearanceが設定されていない場合でも安全に読み込めるように修正
  const availableTerms = glossaryData.terms.filter(
    (t: any) => {
      if (unlockedTerms.includes(t.id)) return false;
      const app = t.appearance || 'general';
      return app === 'general' || clearedEpIds.includes(app) || app.startsWith('SP-');
    }
  );

  const executeGacha = () => {
    if (insightPoints <= 0 || availableTerms.length === 0) return;
    if (!handleSpendPoint(1)) return;

    const randomTerm = availableTerms[Math.floor(Math.random() * availableTerms.length)];
    
    setIsDecrypting(true);
    setNewlyUnlockedTerm(randomTerm);

    setTimeout(() => {
      setIsDecrypting(false);
      setShowPopup(true);
      setUnlockedTerms([...unlockedTerms, randomTerm.id]);
    }, 1500);
  };

  const closePopup = () => {
    setShowPopup(false);
    setNewlyUnlockedTerm(null);
    setSelectedLetter('NEW'); 
    setExpandedTermId(null);
  };

  const filteredTerms = glossaryData.terms.filter((term) => {
    if (searchQuery.trim() !== '') {
      const isUnlocked = unlockedTerms.includes(term.id);
      if (!isUnlocked) return false;
      if (selectedCategory !== 'ALL' && getCategoryGroup(term.category) !== selectedCategory) return false;

      const q = searchQuery.toLowerCase();
      const matchJa = term.ja?.toLowerCase().includes(q);
      const matchEn = term.en?.toLowerCase().includes(q);
      const matchDetails = term.description?.toLowerCase().includes(q);
      return matchJa || matchEn || matchDetails;
    }

    if (selectedLetter === 'NEW') {
      if (!(unlockedTerms.includes(term.id) && !readTerms.includes(term.id))) return false;
    } else if (selectedLetter !== 'ALL') {
      if (!term.id.startsWith(selectedLetter)) return false;
    }

    if (selectedCategory !== 'ALL' && getCategoryGroup(term.category) !== selectedCategory) {
      return false;
    }

    return true;
  });

  const hasNewInLetter = useCallback((letter: string) => {
    if (letter === 'NEW') return false; 
    return glossaryData.terms.some((term) => {
      if (letter !== 'ALL' && !term.id.startsWith(letter)) return false;
      if (selectedCategory !== 'ALL' && getCategoryGroup(term.category) !== selectedCategory) return false;
      return unlockedTerms.includes(term.id) && !readTerms.includes(term.id);
    });
  }, [unlockedTerms, readTerms, selectedCategory]);

  const handleToggleTerm = useCallback((termId: string, isUnlocked: boolean, isRead: boolean) => {
    if (isUnlocked) {
      setExpandedTermId(prev => prev === termId ? null : termId);
      if (!isRead) handleReadTerm(termId);
    }
  }, [handleReadTerm]);

  const handleLinkClick = useCallback((targetId: string) => {
    setSearchQuery(''); 
    setSelectedLetter('ALL');
    setSelectedCategory('ALL');
    setExpandedTermId(targetId);
    if (!readTerms.includes(targetId)) handleReadTerm(targetId);
    
    setTimeout(() => {
      const element = document.getElementById(`term-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [readTerms, handleReadTerm]);

  return (
    <div className="animate-in fade-in duration-300 relative min-h-screen">
      
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
          <div className="absolute bottom-10 w-full text-center font-mono text-[10px] text-emerald-800/40 break-all px-4 overflow-hidden h-20 opacity-50">
            {Array.from({length: 200}).map(() => Math.random().toString(36).substring(2, 3)).join('')}
          </div>
        </div>
      )}

      {showPopup && newlyUnlockedTerm && (
        <div className="fixed inset-0 z-50 bg-[#1a1512]/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#fdfbf7] max-w-sm w-full rounded-sm shadow-2xl border-2 border-emerald-600/50 relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="p-6 text-center">
              <p className="text-[10px] font-mono font-bold text-emerald-600 tracking-widest uppercase mb-1 flex items-center justify-center gap-1">
                <Search size={12} /> DATA RESTORED
              </p>
              <h3 className="text-2xl font-serif font-bold text-[#3a2f29] mb-1">{newlyUnlockedTerm.ja}</h3>
              <p className="text-xs font-mono text-[#8c7a6b] mb-6">{newlyUnlockedTerm.en}</p>
              
              <div className="bg-[#e6d5c3]/20 p-4 rounded-sm border border-dashed border-[#8c7a6b]/30 mb-6 text-left relative">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-3 bg-[#e6d5c3]/80 rotate-2" />
                <span className="text-[9px] text-[#8c7a6b] font-bold px-1.5 py-0.5 rounded-sm border border-[#8c7a6b]/30 mb-2 inline-block">
                  FILE No.{newlyUnlockedTerm.id} / {getCategoryGroup(newlyUnlockedTerm.category)}
                </span>
                <p className="text-sm font-serif text-[#5c4d43] leading-relaxed line-clamp-4">
                  {newlyUnlockedTerm.description}
                </p>
              </div>

              <button onClick={closePopup} className="w-full py-3 bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8] rounded-sm font-bold tracking-widest text-sm transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2">
                CLOSE & READ MORE <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex items-end justify-between mb-4 border-b-2 pb-4 ${isSeason3Phase3 && !isPostReichenbach ? 'border-rose-900/50' : 'border-[#3a2f29]'}`}>
        <div>
          <p className={`text-xs sm:text-sm font-mono tracking-widest ${isSeason3Phase3 && !isPostReichenbach ? 'text-rose-600 animate-pulse' : 'text-[#8c7a6b]'}`}>
            {isSeason3Phase3 && !isPostReichenbach ? 'SYSTEM ALERT - FATAL ERROR' : '大索引 - 網羅的犯罪アーカイブ'}
          </p>
          <h2 className={`text-2xl font-bold font-serif mt-1 tracking-wider ${isSeason3Phase3 && !isPostReichenbach ? 'text-rose-700' : 'text-[#3a2f29]'}`}>
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
              onClick={executeGacha}
              disabled={insightPoints <= 0 || isDecrypting}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-sm disabled:bg-[#d8c8b8] disabled:text-[#8c7a6b] disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
            >
              <Search size={14} /> 解析 (Cost:1)
            </button>
          ) : (
            <span className="text-[9px] text-emerald-700 font-bold border border-emerald-700/50 bg-emerald-700/10 px-2 py-1 rounded-sm uppercase tracking-widest">
              Available Data Restored
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7a6b] w-4 h-4" />
          <input 
            type="text" 
            placeholder="インデックス内を検索 (アンロック済みのデータのみ)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#fdfbf7] border-2 border-[#8c7a6b]/30 text-[#3a2f29] rounded-sm pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5c4d43] placeholder:text-[#8c7a6b]/50 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7a6b] hover:text-[#3a2f29] transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar snap-x">
          {MAIN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setExpandedTermId(null); }}
              className={`snap-start px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-sm border-2 transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-[#3a2f29] text-[#f4ebd8] border-[#3a2f29] shadow-md' : 'bg-[#e6d5c3]/30 text-[#5c4d43] border-[#8c7a6b]/30 hover:bg-[#d8c8b8]'}`}
            >
              {cat === 'ALL' ? 'すべてのカテゴリ' : cat}
            </button>
          ))}
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
              onClick={() => { setSelectedLetter(letter); setExpandedTermId(null); setSearchQuery(''); }}
              className={`snap-start relative px-3 py-1.5 font-mono font-bold text-xs sm:text-sm rounded-sm transition-colors flex-shrink-0 border-2 ${isSelected ? isNewTab ? 'bg-rose-700 text-white border-rose-700 shadow-md' : 'bg-[#3a2f29] text-[#f4ebd8] border-[#3a2f29] shadow-md' : isNewTab ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-[#e6d5c3]/30 text-[#5c4d43] border-[#8c7a6b]/30 hover:bg-[#d8c8b8]'}`}
            >
              {letter}
              {showNewBadge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm border border-[#f4ebd8]" />}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 pb-20" ref={listRef}>
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term: any) => {
            const isUnlocked = unlockedTerms.includes(term.id);
            const isRead = readTerms.includes(term.id);
            const isExpanded = expandedTermId === term.id;
            
            let overrideJa = term.ja, overrideEn = term.en, overrideDetails = term.description, overrideCritique = term.critique, isGlitch = false;

            if (term.overrides && Array.isArray(term.overrides)) {
              term.overrides.forEach((ov: any) => {
                if (clearedEpIds.includes(ov.condition)) {
                  if (ov.ja) overrideJa = ov.ja;
                  if (ov.en) overrideEn = ov.en;
                  if (ov.description) overrideDetails = ov.description;
                  if (ov.critique) overrideCritique = ov.critique;
                  if (ov.glitch) isGlitch = true;
                }
              });
            }

            if (term.id === 'M021' && isSeason3Phase3 && !isPostReichenbach) {
              isGlitch = true;
              overrideDetails = "[SYSTEM OVERRIDE] 彼は数学の天才でも、犯罪界のナポレオンでもない。ただの鏡だ。私の論理が産み落とした、最も完璧な『殺意』そのものだ。インフラは燃えた。盤面は消えた。あとはただ、私と彼、どちらの知能が渊の底で冷たく死ぬかだけだ。";
              overrideCritique = "「彼を道連れにできるのなら、私は喜んでこの命を絶とう。」";
            }
            if (term.id === 'M021' && isPostReichenbach) {
              overrideDetails = "【公式記録】1891年5月4日、スイス・ライヘンバッハの滝において転落死。ロンドンを支配した巨大な犯罪ネットワークは、彼と共に完全に消滅した。";
              overrideCritique = "「（……この項に対するホームズの批評はない。彼もまた、淵の底へ消えたからだ）」";
            }

            return (
              <TermCard 
                key={term.id} 
                term={term} 
                isUnlocked={isUnlocked} 
                isRead={isRead} 
                isExpanded={isExpanded} 
                onToggle={() => handleToggleTerm(term.id, isUnlocked, isRead)} 
                isGlitch={isGlitch} 
                overrideJa={overrideJa} 
                overrideEn={overrideEn} 
                overrideDetails={overrideDetails} 
                overrideCritique={overrideCritique} 
                isPostReichenbach={isPostReichenbach} 
                onLinkClick={handleLinkClick}
                unlockedTerms={unlockedTerms}
                allTerms={glossaryData.terms}
              />
            );
          })
        ) : (
          <div className="text-center py-12 text-[#8c7a6b] font-mono text-xs border-2 border-dashed border-[#8c7a6b]/30 rounded-sm bg-[#e6d5c3]/20">
            {searchQuery ? `No matches found for "${searchQuery}".` : `No unread data found in "${selectedLetter}".`}
          </div>
        )}
      </div>
    </div>
  );
}