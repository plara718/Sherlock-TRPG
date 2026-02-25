'use client';

import React, { useRef, useEffect, useState } from 'react';
import TetherBar from '@/components/TetherBar';
import Controls from '@/components/Controls';
import GlossaryToast from '@/components/GlossaryToast';
import InterruptPanel from '@/components/InterruptPanel';
import ChatLog from '@/components/ChatLog'; 
import { useGameLogic, ScenarioData } from '@/lib/useGameLogic';
import { FileText, ArrowRight, Eye } from 'lucide-react';

import episode00 from '@/data/episode_00.json';
import episode01 from '@/data/episode_01.json';
import episode02 from '@/data/episode_02.json';
import episode03 from '@/data/episode_03.json';
import episode04 from '@/data/episode_04.json';
import episode05 from '@/data/episode_05.json';
import episode06 from '@/data/episode_06.json';
import episode07 from '@/data/episode_07.json';
import episode08 from '@/data/episode_08.json';
import episode09 from '@/data/episode_09.json';
import episode10 from '@/data/episode_10.json';
import episode11 from '@/data/episode_11.json';
import episode12 from '@/data/episode_12.json';
import episode13 from '@/data/episode_13.json';
import episode14 from '@/data/episode_14.json';
import episode15 from '@/data/episode_15.json';
import episode16 from '@/data/episode_16.json';
import episode17 from '@/data/episode_17.json';
import episode18 from '@/data/episode_18.json';
import episode19 from '@/data/episode_19.json';
// 新規追加エピソード
import episode22 from '@/data/episode_22.json';
import episode23 from '@/data/episode_23.json';
import episode24 from '@/data/episode_24.json';
// import episode25 from '@/data/episode_25.json';
// import episode26 from '@/data/episode_26.json';

import glossaryData from '@/data/glossary.json';

// SPエピソード
import episodeSp01 from '@/data/episode_sp01.json';
//import episodeSp02 from '@/data/episode_sp02.json';
//import episodeSp03 from '@/data/episode_sp03.json';
import episodeSp04 from '@/data/episode_sp04.json';
import episodeSp05 from '@/data/episode_sp05.json';
import episodeSp06 from '@/data/episode_sp06.json';

const SCENARIOS: Record<string, any> = {
  '#00': episode00, '#01': episode01, '#02': episode02, '#03': episode03,
  '#04': episode04, '#05': episode05, '#06': episode06, '#07': episode07,
  '#08': episode08, '#09': episode09, '#10': episode10, '#11': episode11,
  '#12': episode12, '#13': episode13, '#14': episode14, '#15': episode15,
  '#16': episode16, '#17': episode17, '#18': episode18, '#19': episode19,
  '#22': episode22, '#23': episode23, '#24': episode24, //'#25': episode25, '#26': episode26,
  'SP-01': episodeSp01, //'SP-02': episodeSp02, 'SP-03': episodeSp03,
  'SP-04': episodeSp04, 'SP-05': episodeSp05, 'SP-06': episodeSp06,
};

type GameViewProps = {
  episodeId: string;
  onBack: () => void;
  unlockedTerms: string[];
  setUnlockedTerms: (terms: string[]) => void;
  clearedData: { [epId: string]: { rank: string; tether: number } };
  insightPoints: number;
  onSpendPoint: (amount: number) => boolean;
  onEpisodeComplete: (epId: string, rank: string, tether: number, points: number) => void;
};

export default function GameView({
  episodeId, onBack, unlockedTerms, setUnlockedTerms, clearedData, insightPoints, onSpendPoint, onEpisodeComplete,
}: GameViewProps) {
  const scenarioData = SCENARIOS[episodeId] || SCENARIOS['#00'];
  const protagonist = scenarioData.meta?.protagonist || 'watson';
  const isIrene = protagonist === 'irene';

  const [activeGlossary, setActiveGlossary] = useState<{ word: string; desc: string; } | null>(null);
  const [isInterruptMode, setIsInterruptMode] = useState(false);
  const [screenEffect, setScreenEffect] = useState<'none' | 'flash' | 'shake'>('none');
  const [isWigginsActive, setIsWigginsActive] = useState(false);
  const [ireneUsed, setIreneUsed] = useState(false);

  const isReplay = Boolean(clearedData[episodeId]);
  const canUseIrene = unlockedTerms.includes('I007') && !isIrene; 

  const {
    currentBeat, displayedText, isStreaming, tether, feedback, handleInterrupt,
    nextBeat, skipStream, beatIndex, beats, collectedEvidence, selectedEvidence,
    collectEvidence, handleSelectEvidence, selectedSkill, isCompleted, endResult,
  } = useGameLogic(scenarioData as ScenarioData, isReplay);

  const bottomRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  useEffect(() => {
    if (feedback) {
      if (feedback.type === 'success') setScreenEffect('flash');
      else setScreenEffect('shake');
      const timer = setTimeout(() => setScreenEffect('none'), 500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (currentBeat?.text.includes('[<NOISE>]') && !isStreaming) setIsInterruptMode(true);
    else setIsInterruptMode(false);
    setIsWigginsActive(false);
  }, [currentBeat, isStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText, beatIndex, collectedEvidence, isInterruptMode]);

  const handleGlossaryClick = (term: any) => {
    if (unlockedTerms.includes(term.id)) {
      setActiveGlossary({ word: term.ja, desc: "このデータは既に大索引に登録されています。詳細はアーカイブで確認してください。" });
    } else {
      const newTerms = [...unlockedTerms, term.id];
      setUnlockedTerms(newTerms);
      setActiveGlossary({ word: term.ja, desc: "【NEW】大索引に新規データが登録されました！ 事件解決後、アーカイブから詳細を解読できます。" });
    }
  };

  const handleWigginsEye = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insightPoints >= 1 && !isWigginsActive) {
      if (onSpendPoint(1)) setIsWigginsActive(true);
    }
  };

  const renderText = (text: string) => {
    if (!text) return "";
    let elements: (string | React.JSX.Element)[] = [];
    const parts = text.split(/(\{.*?\})/g);
    parts.forEach((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const word = part.slice(1, -1);
        const isCollected = collectedEvidence.includes(word);
        const wigginsStyle = (isWigginsActive && !isCollected) ? 'ring-2 ring-amber-500 ring-offset-1 bg-amber-200 animate-pulse' : '';

        elements.push(
          <span
            key={`ev-${i}`}
            onClick={(e) => { e.stopPropagation(); collectEvidence(word); }}
            className={`font-bold cursor-pointer px-1.5 mx-0.5 rounded transition-all shadow-sm inline-flex items-center z-10 relative ${wigginsStyle} ${
              isCollected
                ? 'bg-[#d8c8b8] text-[#8c7a6b] cursor-default'
                : 'text-[#3a2f29] bg-amber-500/20 hover:bg-amber-500/40 border border-amber-600/30 active:scale-95'
            }`}
          >
            {word}
          </span>
        );
      } else {
        elements.push(part);
      }
    });

    glossaryData.terms.forEach((term) => {
      const newElements: (string | React.JSX.Element)[] = [];
      elements.forEach((el) => {
        if (typeof el !== 'string') { newElements.push(el); return; }
        const gParts = el.split(term.trigger_word);
        gParts.forEach((gPart, j) => {
          newElements.push(gPart);
          if (j < gParts.length - 1) {
            newElements.push(
              <span
                key={`g-${term.id}-${j}`}
                onClick={(e) => { e.stopPropagation(); handleGlossaryClick(term); }}
                className="text-amber-700 underline decoration-dotted cursor-help hover:text-amber-600 transition-colors font-bold z-10 relative"
              >
                {term.trigger_word}
              </span>
            );
          }
        });
      });
      elements = newElements;
    });
    return elements;
  };

  const latestSystemBeat = beats.slice(0, beatIndex + 1).reverse().find((b: any) => b.speaker === 'System');
  const chatHistory = beats.slice(0, beatIndex + 1).filter((b: any) => b.speaker !== 'System');

  const handleTouchStart = (e: React.TouchEvent) => {
    isScrollingRef.current = false;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (dx > 10 || dy > 10) isScrollingRef.current = true;
  };

  const handleAreaClick = () => {
    if (isScrollingRef.current) return;
    const now = Date.now();
    if (now - lastActionTimeRef.current < 300) return;
    lastActionTimeRef.current = now;
    if (isStreaming) skipStream();
    else nextBeat();
  };

  const hasUncollectedEvidence = currentBeat?.text.match(/\{.*?\}/g)?.some(match => !collectedEvidence.includes(match.slice(1, -1)));

  return (
    <div className={`w-full max-w-2xl mx-auto relative bg-[#f4ebd8] flex flex-col h-[100dvh] touch-manipulation overscroll-none transition-transform duration-75 ${
      screenEffect === 'shake' ? '-translate-x-2' : ''
    }`}>

      {screenEffect === 'flash' && <div className="absolute inset-0 bg-white z-[60] animate-out fade-out duration-500 pointer-events-none mix-blend-overlay" />}
      {screenEffect === 'shake' && <div className="absolute inset-0 bg-rose-900/20 z-[60] animate-out fade-out duration-500 pointer-events-none" />}

      <TetherBar tether={tether} onArchiveClick={onBack} protagonist={protagonist} />

      <div
        className="flex-1 flex flex-col bg-[#f4ebd8] relative overflow-hidden cursor-pointer"
        onClick={handleAreaClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3a2f29] to-transparent" />

        {latestSystemBeat && (
          <div className="p-4 sm:p-5 bg-[#e6d5c3] border-b border-[#8c7a6b]/30 shadow-sm flex-shrink-0 z-10 animate-in fade-in slide-in-from-top-2">
            <h2 className="text-[10px] font-bold text-[#8c7a6b] mb-1.5 uppercase tracking-widest font-mono">
              Scene Context : {episodeId}
            </h2>
            <p className="text-sm sm:text-base text-[#5c4d43] italic font-serif leading-relaxed">
              {/* [<NOISE>] タグを除去してから renderText に渡す */}
              {renderText((latestSystemBeat.text || "").replace(/\[<NOISE>\]/g, ''))}
            </p>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar relative">
          {chatHistory.map((beat: any) => {
            const isCurrent = beat.id === currentBeat.id;
            const textToShow = isCurrent ? displayedText : beat.text;
            
            // [<NOISE>] タグを除去
            const cleanText = (textToShow || "").replace(/\[<NOISE>\]/g, '');

            return (
              <ChatLog 
                key={beat.id} 
                speaker={beat.speaker} 
                text={renderText(cleanText)} 
                feedback={isCurrent ? feedback : null} 
              />
            );
          })}
          
          {isStreaming && currentBeat.speaker !== 'System' && (
            <div className="inline-block w-2.5 h-5 bg-[#3a2f29] ml-1 animate-pulse align-middle" />
          )}

          <div ref={bottomRef} className="h-20" />
        </div>

        {!isStreaming && hasUncollectedEvidence && !isInterruptMode && !isWigginsActive && unlockedTerms.includes('W040') && (
          <div className="absolute bottom-6 right-6 z-20 animate-in fade-in zoom-in duration-300">
             <button
                onClick={handleWigginsEye}
                disabled={insightPoints < 1}
                className="bg-amber-700 hover:bg-amber-600 disabled:bg-[#d8c8b8] disabled:text-[#8c7a6b] disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
             >
                <Eye size={16} /> WIGGINS (1pt)
             </button>
          </div>
        )}
      </div>

      {!isInterruptMode && collectedEvidence.length > 0 && (
        <div className="p-3 bg-[#2a2420] flex flex-wrap gap-2 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] overflow-x-auto custom-scrollbar border-t border-[#3a2f29]">
          <span className="text-[10px] font-mono text-[#8c7a6b] flex items-center mr-1 tracking-widest uppercase">
            EVIDENCE:
          </span>
          {collectedEvidence.map((ev) => (
            <button
              key={ev}
              onClick={(e) => { e.stopPropagation(); handleSelectEvidence(ev); }}
              disabled={isStreaming}
              className={`whitespace-nowrap text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full font-bold transition-all active:scale-95 z-20 relative ${
                selectedEvidence === ev
                  ? 'bg-amber-500 text-[#3a2f29] shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-[#5c4d43] text-[#f4ebd8] hover:bg-[#8c7a6b]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {ev}
            </button>
          ))}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()} className="shrink-0 bg-[#f4ebd8]">
        {isInterruptMode ? (
          <InterruptPanel
            collectedEvidences={collectedEvidence}
            hintText={currentBeat?.interrupt?.hint}
            canUseIrene={canUseIrene}
            ireneUsed={ireneUsed}
            onUseIrene={() => setIreneUsed(true)}
            onSubmit={(skill, evidence) => {
              if (evidence) handleSelectEvidence(evidence);
              setTimeout(() => handleInterrupt(skill), 10);
              setIsInterruptMode(false);
            }}
            onTimeUp={() => {
              handleInterrupt('TIMEOUT');
              setIsInterruptMode(false);
            }}
            protagonist={protagonist}
          />
        ) : (
          <Controls
            isStreaming={isStreaming && currentBeat.speaker !== 'System'}
            selectedSkill={selectedSkill}
            onNext={nextBeat}
            onInterrupt={handleInterrupt}
          />
        )}
      </div>

      {activeGlossary && (
        <GlossaryToast term={activeGlossary.word} desc={activeGlossary.desc} onClose={() => setActiveGlossary(null)} />
      )}

      {isCompleted && endResult && (
        <div className="absolute inset-0 z-50 bg-[#1a1512]/90 flex items-center justify-center p-4 animate-in fade-in duration-500 backdrop-blur-sm">
          <div className="bg-[#f4ebd8] max-w-md w-full rounded-xl shadow-2xl border-2 border-[#8c7a6b] relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-[#3a2f29]" />
            <div className="p-6 sm:p-8 relative z-10 font-serif text-[#3a2f29]">
              
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest border-b border-[#8c7a6b]/30 pb-3 mb-5 flex items-center gap-2">
                <FileText className="text-[#8c7a6b]" /> Investigation Report
              </h2>

              <div className="flex justify-between items-end border-b border-[#8c7a6b]/30 border-dotted pb-3 mb-5 font-mono text-sm">
                <div>
                  <span className="text-[#8c7a6b]">CASE ID:</span> <span className="font-bold">{episodeId}</span><br />
                  <span className="text-[#8c7a6b]">FINAL {isIrene ? 'ELEGANCE' : 'TETHER'}:</span> <span className={`text-lg font-bold ${isIrene ? 'text-rose-600' : 'text-amber-700'}`}>{tether}%</span>
                </div>
                <div className={`border-2 px-3 py-1 font-bold text-lg uppercase tracking-widest rotate-6 opacity-90 rounded-sm bg-[#f4ebd8] shadow-sm ${
                    endResult.rank === 'LUCID' ? 'border-emerald-700 text-emerald-800' : endResult.rank === 'SYMPATHETIC' ? 'border-blue-700 text-blue-800' : 'border-rose-800 text-rose-800'
                  }`}>
                  {endResult.rank}
                </div>
              </div>

              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {endResult.official_record && (
                  <div className="bg-[#e6d5c3]/50 p-3 sm:p-4 rounded-lg border border-[#8c7a6b]/20 font-mono text-xs shadow-inner">
                    <p className="text-[#5c4d43] leading-relaxed">{endResult.official_record}</p>
                  </div>
                )}
                {endResult.watson_journal && (
                  <div className="p-4 rounded-lg border border-[#8c7a6b]/30 bg-[#fffcf7] shadow-sm">
                    <h3 className="font-bold text-[#3a2f29] mb-2 border-b border-[#8c7a6b]/20 pb-1 text-xs uppercase tracking-widest">
                      {isIrene ? "Irene's Journal" : "Watson's Journal"}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#5c4d43]">{endResult.watson_journal}</p>
                  </div>
                )}
                {endResult.holmes_note && (
                  <div className="p-4 rounded-lg bg-amber-600/5 border border-amber-700/20 shadow-sm">
                    <h3 className="font-bold text-amber-900 mb-1.5 italic text-xs uppercase tracking-widest">
                      {isIrene ? "M.C. Report :" : "Holmes's Note :"}
                    </h3>
                    <p className="text-sm leading-relaxed italic text-amber-800/90">{endResult.holmes_note}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center pt-4">
                <p className="text-[10px] text-[#8c7a6b] tracking-widest uppercase mb-1 font-mono">Insight Points Acquired</p>
                <p className="text-4xl font-bold text-amber-600 font-mono drop-shadow-sm">+{endResult.points} pt</p>
                {isReplay && <p className="text-[9px] text-amber-800/70 mt-1 font-mono tracking-tighter">*再プレイ報酬適用</p>}
              </div>

              <button
                onClick={() => onEpisodeComplete(episodeId, endResult.rank, tether, endResult.points)}
                className="w-full mt-6 bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8] font-bold py-3.5 rounded-full tracking-widest transition-transform active:scale-95 shadow-md text-sm"
              >
                FILE ARCHIVE (記録完了)
              </button>
            </div>
          </div>
        </div>
      )}

      {isCompleted && !endResult && (
        <div className="absolute inset-0 z-50 bg-[#1a1512]/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000 backdrop-blur-md">
          <p className="text-[#f4ebd8] text-lg font-serif tracking-widest mb-10 animate-pulse text-center">
            ―― そして、記録は次へ繋がる。
          </p>
          <button
            onClick={() => onEpisodeComplete(episodeId, "INTERLUDE", tether, 0)}
            className="bg-transparent border border-[#8c7a6b] text-[#f4ebd8] hover:bg-[#f4ebd8] hover:text-[#1a1512] font-bold py-3 px-8 rounded-full tracking-widest transition-all duration-300 flex items-center gap-2 active:scale-95"
          >
            次へ進む <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}