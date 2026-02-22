'use client';

import React, { useRef, useEffect, useState } from 'react';
import TetherBar from '@/components/TetherBar';
import Controls from '@/components/Controls';
import GlossaryToast from '@/components/GlossaryToast';
import InterruptPanel from '@/components/InterruptPanel';
import { useGameLogic, ScenarioData } from '@/lib/useGameLogic';
import { FileText, ArrowRight } from 'lucide-react';

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
import interludeS1 from '@/data/interlude_s1.json'; // ← 追加: 幕間データ
import glossaryData from '@/data/glossary.json';

const SCENARIOS: Record<string, any> = {
  '#01': episode01,
  '#02': episode02,
  '#03': episode03,
  '#04': episode04,
  '#05': episode05,
  '#06': episode06,
  '#07': episode07,
  '#08': episode08,
  '#09': episode09,
  '#10': episode10,
  '#11': episode11,
  '#12': episode12,
  '#13': episode13,
  'interlude_s1': interludeS1, // ← 追加
};

type GameViewProps = {
  episodeId: string;
  onBack: () => void;
  unlockedTerms: string[];
  setUnlockedTerms: (terms: string[]) => void;
  onEpisodeComplete: (
    epId: string,
    rank: string,
    tether: number,
    points: number
  ) => void;
};

export default function GameView({
  episodeId,
  onBack,
  unlockedTerms,
  setUnlockedTerms,
  onEpisodeComplete,
}: GameViewProps) {
  const scenarioData = SCENARIOS[episodeId] || SCENARIOS['#01'];
  const [activeGlossary, setActiveGlossary] = useState<{
    word: string;
    desc: string;
  } | null>(null);

  const [isInterruptMode, setIsInterruptMode] = useState(false);

  const {
    currentBeat,
    displayedText,
    isStreaming,
    tether,
    feedback,
    handleInterrupt,
    nextBeat,
    skipStream,
    beatIndex,
    beats,
    collectedEvidence,
    selectedEvidence,
    collectEvidence,
    handleSelectEvidence,
    selectedSkill,
    isCompleted,
    endResult,
  } = useGameLogic(scenarioData as ScenarioData);

  const bottomRef = useRef<HTMLDivElement>(null);

  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  useEffect(() => {
    if (currentBeat?.text.includes('[<NOISE>]') && !isStreaming) {
      setIsInterruptMode(true);
    } else {
      setIsInterruptMode(false);
    }
  }, [currentBeat, isStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText, beatIndex, collectedEvidence, isInterruptMode]);

  const handleGlossaryClick = (term: any) => {
    setActiveGlossary({ word: term.ja, desc: term.details });
    if (!unlockedTerms.includes(term.id)) {
      const newTerms = [...unlockedTerms, term.id];
      setUnlockedTerms(newTerms);
      localStorage.setItem('tether_unlocked_terms', JSON.stringify(newTerms));
    }
  };

  const renderText = (text: string) => {
    let elements: (string | React.JSX.Element)[] = [];
    const parts = text.split(/(\{.*?\})/g);
    parts.forEach((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const word = part.slice(1, -1);
        const isCollected = collectedEvidence.includes(word);
        elements.push(
          <span
            key={`ev-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              collectEvidence(word);
            }}
            className={`font-bold cursor-pointer px-1 mx-0.5 rounded border transition-colors shadow-sm inline-flex items-center z-10 relative ${
              isCollected
                ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-default'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-300 active:scale-95'
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
        if (typeof el !== 'string') {
          newElements.push(el);
          return;
        }
        const gParts = el.split(term.trigger_word);
        gParts.forEach((gPart, j) => {
          newElements.push(gPart);
          if (j < gParts.length - 1) {
            newElements.push(
              <span
                key={`g-${term.id}-${j}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGlossaryClick(term);
                }}
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

  const latestSystemBeat = beats
    .slice(0, beatIndex + 1)
    .reverse()
    .find((b: any) => b.speaker === 'System');
  const chatHistory = beats
    .slice(0, beatIndex + 1)
    .filter((b: any) => b.speaker !== 'System');

  const handleTouchStart = (e: React.TouchEvent) => {
    isScrollingRef.current = false;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (dx > 10 || dy > 10) {
      isScrollingRef.current = true;
    }
  };

  const handleAreaClick = () => {
    if (isScrollingRef.current) return;
    const now = Date.now();
    if (now - lastActionTimeRef.current < 300) return;
    lastActionTimeRef.current = now;

    if (isStreaming) {
      skipStream();
    } else {
      nextBeat();
    }
  };

  return (
    <div className="w-full max-w-2xl border-0 sm:border-4 border-slate-800 sm:p-1 relative shadow-2xl bg-white flex flex-col h-[100dvh] sm:h-[85vh] touch-manipulation overscroll-none">
      <TetherBar tether={tether} onArchiveClick={onBack} />

      <div
        className="flex-1 flex flex-col bg-[#FDF6E3] relative overflow-hidden cursor-pointer"
        onClick={handleAreaClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {latestSystemBeat && (
          <div className="p-4 bg-slate-200 border-b-2 border-slate-400 shadow-inner flex-shrink-0 z-10">
            <h2 className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest font-mono">
              Scene Context : {episodeId}
            </h2>
            <p className="text-sm text-slate-800 italic font-serif leading-relaxed">
              {renderText(latestSystemBeat.text)}
            </p>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          {chatHistory.map((beat: any) => {
            const isCurrent = beat.id === currentBeat.id;
            const textToShow = isCurrent ? displayedText : beat.text;
            const cleanText = textToShow.replace(/\[<NOISE>\]/g, '');
            return (
              <div
                key={beat.id}
                className="relative p-4 bg-white border-2 border-slate-800 rounded shadow-sm"
              >
                <div className="absolute -top-3 left-4 bg-slate-800 text-white px-3 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest font-mono">
                  {beat.speaker}
                </div>
                <div className="mt-2 text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
                  {renderText(cleanText)}
                  {isCurrent && isStreaming && (
                    <span className="inline-block w-2 h-5 bg-slate-800 ml-1 animate-pulse align-middle" />
                  )}
                </div>
                {isCurrent && feedback && (
                  <div
                    className={`mt-4 p-3 border-l-4 text-xs font-bold italic shadow-sm animate-in slide-in-from-left-2 ${
                      feedback.type === 'success'
                        ? 'border-green-700 bg-green-50 text-green-900'
                        : 'border-red-700 bg-red-50 text-red-900'
                    }`}
                  >
                    {feedback.msg}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {!isInterruptMode && collectedEvidence.length > 0 && (
        <div className="p-2 sm:p-3 bg-slate-800 flex flex-wrap gap-2 border-t-2 border-slate-600 shrink-0 shadow-inner overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-mono text-slate-400 flex items-center mr-2 tracking-widest">
            EVIDENCE:
          </span>
          {collectedEvidence.map((ev) => (
            <button
              key={ev}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectEvidence(ev);
              }}
              disabled={isStreaming}
              className={`whitespace-nowrap text-[10px] sm:text-xs px-2 py-1.5 rounded border font-bold transition-all active:scale-95 z-20 relative ${
                selectedEvidence === ev
                  ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_8px_rgba(217,119,6,0.6)]'
                  : 'bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {ev}
            </button>
          ))}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        {isInterruptMode ? (
          <InterruptPanel
            collectedEvidences={collectedEvidence}
            onSubmit={(skill, evidence) => {
              handleSelectEvidence(evidence);
              setTimeout(() => {
                handleInterrupt(skill);
              }, 10);
              setIsInterruptMode(false);
            }}
            onTimeUp={() => {
              handleInterrupt('TIMEOUT');
              setIsInterruptMode(false);
            }}
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
        <GlossaryToast
          term={activeGlossary.word}
          desc={activeGlossary.desc}
          onClose={() => setActiveGlossary(null)}
        />
      )}

      {/* ▼ 修正: 通常エピソードクリア時（リザルト画面） */}
      {isCompleted && endResult && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div
            className="bg-[#f4ecd8] max-w-md w-full rounded shadow-[0_0_30px_rgba(0,0,0,0.8)] border-4 border-[#c2b280] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-amber-900" />
            <div className="p-6 relative z-10 font-serif text-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4 flex items-center gap-2">
                <FileText /> Investigation Report
              </h2>

              <div className="flex justify-between items-end border-b border-slate-400 border-dotted pb-2 mb-4 font-mono text-sm">
                <div>
                  <span className="text-slate-500">CASE ID:</span>{' '}
                  <span className="font-bold">{episodeId}</span>
                  <br />
                  <span className="text-slate-500">FINAL TETHER:</span>{' '}
                  <span className="text-lg font-bold">{tether}%</span>
                </div>
                <div
                  className={`border-4 px-2 py-1 font-bold text-xl uppercase tracking-widest rotate-6 opacity-80 bg-[#f4ecd8] ${
                    endResult.rank === 'LUCID'
                      ? 'border-green-700 text-green-700'
                      : endResult.rank === 'SYMPATHETIC'
                      ? 'border-blue-700 text-blue-700'
                      : 'border-red-800 text-red-800'
                  }`}
                >
                  {endResult.rank}
                </div>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {endResult.official_record && (
                  <div className="bg-slate-200 p-3 border-l-4 border-slate-500 font-mono text-xs shadow-inner">
                    <p className="text-slate-700">
                      {endResult.official_record}
                    </p>
                  </div>
                )}

                {endResult.watson_journal && (
                  <div className="p-3 border border-slate-400 bg-[#e8dec5] shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-400 pb-1 text-sm uppercase tracking-widest">
                      Watson's Journal
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-800">
                      {endResult.watson_journal}
                    </p>
                  </div>
                )}

                {endResult.holmes_note && (
                  <div className="p-3 bg-[#FDF6E3] border border-amber-200 shadow-sm">
                    <h3 className="font-bold text-amber-900 mb-1 italic text-xs">
                      Holmes's Note :
                    </h3>
                    <p className="text-sm leading-relaxed italic text-amber-800">
                      {endResult.holmes_note}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center border-t border-slate-300 pt-4">
                <p className="text-xs text-slate-500 tracking-widest uppercase mb-1">
                  Insight Points Acquired
                </p>
                <p className="text-3xl font-bold text-amber-700 font-mono">
                  +{endResult.points} pt
                </p>
              </div>

              <button
                onClick={() =>
                  onEpisodeComplete(
                    episodeId,
                    endResult.rank,
                    tether,
                    endResult.points
                  )
                }
                className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded tracking-widest transition-colors shadow-lg active:scale-95"
              >
                FILE ARCHIVE (記録完了)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ▼ 修正: カットシーン完了時（リザルトを出さずに次へ進むUI） */}
      {isCompleted && !endResult && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000">
          <p className="text-white text-lg font-serif tracking-widest mb-8 animate-pulse text-center">
            ―― そして、点と点が繋がる。
          </p>
          <button
            onClick={() => {
              // カットシーンなので、便宜上のランクやポイントを渡して完了処理へ
              onEpisodeComplete(episodeId, "INTERLUDE", tether, 0);
            }}
            className="bg-transparent border border-white text-white hover:bg-white hover:text-black font-bold py-3 px-8 rounded tracking-widest transition-all duration-300 flex items-center gap-2"
          >
            次へ進む <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}