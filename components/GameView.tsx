'use client';

import React, { useRef, useEffect, useState } from 'react';
import TetherBar from '@/components/TetherBar';
import Controls from '@/components/Controls';
import GlossaryToast from '@/components/GlossaryToast';
import InterruptPanel from '@/components/InterruptPanel';
import ChatLog from '@/components/ChatLog'; 
import { useGameLogic, ScenarioData } from '@/lib/useGameLogic';
import { FileText, ArrowRight, Eye, AlertTriangle } from 'lucide-react';

// 本編エピソード
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
import episode20 from '@/data/episode_20.json';
import episode21 from '@/data/episode_21.json';
import episode22 from '@/data/episode_22.json';
import episode23 from '@/data/episode_23.json';
import episode24 from '@/data/episode_24.json';
import episode25 from '@/data/episode_25.json';
import episode26 from '@/data/episode_26.json';
import episode27 from '@/data/episode_27.json';
import episode28 from '@/data/episode_28.json';
import episode29 from '@/data/episode_29.json';
import episode30 from '@/data/episode_30.json';
import episode31 from '@/data/episode_31.json';
import episode32 from '@/data/episode_32.json';
import episode33 from '@/data/episode_33.json';
import episode34 from '@/data/episode_34.json';
import episode35 from '@/data/episode_35.json';
import episode36 from '@/data/episode_36.json';
import episode37 from '@/data/episode_37.json';
import episode38 from '@/data/episode_38.json';
import episode39 from '@/data/episode_39.json';
import episode40 from '@/data/episode_40.json';
import episode41 from '@/data/episode_41.json';
import episode42 from '@/data/episode_42.json';
import episode43 from '@/data/episode_43.json';
import episode44 from '@/data/episode_44.json';

// 幕間（Interlude）
import interludeS1 from '@/data/interlude_s1.json';
import interludeS2 from '@/data/interlude_s2.json';
import interludeS3 from '@/data/interlude_s3.json';

// SPエピソード
import episodeSp01 from '@/data/episode_sp01.json';
import episodeSp02 from '@/data/episode_sp02.json';
import episodeSp03 from '@/data/episode_sp03.json';
import episodeSp04 from '@/data/episode_sp04.json';
import episodeSp05 from '@/data/episode_sp05.json';
import episodeSp06 from '@/data/episode_sp06.json';

// 大索引データ
import glossaryData from '@/data/glossary.json';

const SCENARIOS: Record<string, any> = {
  '#00': episode00, '#01': episode01, '#02': episode02, '#03': episode03,
  '#04': episode04, '#05': episode05, '#06': episode06, '#07': episode07,
  '#08': episode08, '#09': episode09, '#10': episode10, '#11': episode11,
  '#12': episode12, '#13': episode13, '#14': episode14, '#15': episode15,
  '#16': episode16, '#17': episode17, '#18': episode18, '#19': episode19,
  '#20': episode20, '#21': episode21, '#22': episode22, '#23': episode23,
  '#24': episode24, '#25': episode25, '#26': episode26, '#27': episode27,
  '#28': episode28, '#29': episode29, '#30': episode30, '#31': episode31,
  '#32': episode32, '#33': episode33, '#34': episode34, '#35': episode35,
  '#36': episode36, '#37': episode37, '#38': episode38, '#39': episode39,
  '#40': episode40, '#41': episode41, '#42': episode42, '#43': episode43,
  '#44': episode44,
  'Interlude-S1': interludeS1, 'Interlude-S2': interludeS2, 'Interlude-S3': interludeS3,
  'SP-01': episodeSp01, 'SP-02': episodeSp02, 'SP-03': episodeSp03,
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

  const [activeGlossary, setActiveGlossary] = useState<{ word: string; desc: string; } | null>(null);
  const [isInterruptMode, setIsInterruptMode] = useState(false);
  const [screenEffect, setScreenEffect] = useState<'none' | 'flash' | 'shake' | 'glass-shatter'>('none');
  const [isWigginsActive, setIsWigginsActive] = useState(false);

  // ▼ 新規：Tether 0% 状態の管理
  const [isSanityZero, setIsSanityZero] = useState(false);

  const isReplay = Boolean(clearedData[episodeId]);

  const {
    currentBeat, displayedText, isStreaming, tether, feedback, handleInterrupt,
    nextBeat, skipStream, beatIndex, beats, collectedEvidence, selectedEvidence,
    collectEvidence, handleSelectEvidence, selectedSkill, isCompleted, endResult,
    uiLabels, isMoriarty, isIrene
  } = useGameLogic(scenarioData as ScenarioData, isReplay);

  // 介入システムの状態管理
  const rawIntervention = scenarioData.meta?.intervention;
  const interventionType = ['Irene', 'Mycroft', 'Wiggins'].includes(rawIntervention as string) 
    ? (rawIntervention as 'Irene' | 'Mycroft' | 'Wiggins') 
    : null;

  const isInterventionAvailable = 
    interventionType === 'Irene' ? (unlockedTerms.includes('I007') && !isIrene && !isMoriarty) :
    interventionType === 'Mycroft' ? (!isIrene && !isMoriarty) :
    interventionType === 'Wiggins' ? (unlockedTerms.includes('W040') && !isIrene && !isMoriarty) :
    false;

  const [interventionUsed, setInterventionUsed] = useState(false);

  useEffect(() => {
    setInterventionUsed(false);
    setIsSanityZero(false);
  }, [episodeId]);

  // ▼ Tether 0% の監視
  useEffect(() => {
    if (tether <= 0 && !isCompleted && !isInterlude(scenarioData)) {
      setIsSanityZero(true);
    } else {
      setIsSanityZero(false);
    }
  }, [tether, isCompleted, scenarioData]);

  // 幕間判定用ヘルパー
  const isInterlude = (data: any) => data.meta?.type === 'interlude' || data.meta?.episode_id?.includes('Interlude');

  const bottomRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  useEffect(() => {
    if (feedback) {
      if (feedback.isCriticalSuccess) {
        setScreenEffect('glass-shatter');
      } else if (feedback.type === 'success') {
        setScreenEffect('flash');
      } else {
        setScreenEffect('shake');
      }
      const timer = setTimeout(() => setScreenEffect('none'), 800);
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
                : isSanityZero 
                  ? 'text-rose-900 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-600/50 active:scale-95 animate-pulse'
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
                className={`underline decoration-dotted cursor-help transition-colors font-bold z-10 relative ${
                  isSanityZero ? 'text-rose-600 hover:text-rose-400' : 'text-amber-700 hover:text-amber-600'
                }`}
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

  const chatHistory = beats.slice(0, beatIndex + 1);

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
    <div className={`w-full max-w-2xl mx-auto relative flex flex-col h-[100dvh] touch-manipulation overscroll-none transition-transform duration-75 ${
      screenEffect === 'shake' ? '-translate-x-2' : ''
    } ${isSanityZero ? 'bg-[#1a0f0f]' : 'bg-[#f4ebd8]'}`}>

      {screenEffect === 'flash' && <div className="absolute inset-0 bg-white z-[60] animate-out fade-out duration-500 pointer-events-none mix-blend-overlay" />}
      {screenEffect === 'shake' && <div className="absolute inset-0 bg-rose-900/20 z-[60] animate-out fade-out duration-500 pointer-events-none" />}
      
      {screenEffect === 'glass-shatter' && (
        <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-white/80 animate-out fade-out duration-700 mix-blend-overlay" />
          <div className="text-4xl font-black text-rose-600 tracking-[0.5em] animate-out zoom-out-150 fade-out duration-700 rotate-12 drop-shadow-2xl">
            NOISE CLEARED
          </div>
        </div>
      )}

      {/* ▼ 発狂（Tether 0%）時のノイズオーバーレイ ▼ */}
      {isSanityZero && !isCompleted && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-multiply opacity-50 flex flex-col">
           {/* ノイズスキャンライン */}
           <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.1)_2px,rgba(225,29,72,0.1)_4px)] animate-[pulse_0.1s_infinite]" />
           {/* 警告バナー */}
           <div className="absolute top-[20%] w-full bg-rose-600/20 border-y-2 border-rose-600 text-rose-500 font-mono font-bold text-center py-2 tracking-[0.3em] backdrop-blur-sm animate-[pulse_1.5s_infinite] shadow-[0_0_20px_rgba(225,29,72,0.5)]">
             <AlertTriangle className="inline-block mr-2 w-5 h-5 mb-1" />
             WARNING: SANITY COMPROMISED
             <AlertTriangle className="inline-block ml-2 w-5 h-5 mb-1" />
           </div>
        </div>
      )}

      <TetherBar tether={tether} onArchiveClick={onBack} protagonist={protagonist} gaugeName={uiLabels.gaugeName} />

      <div
        className={`flex-1 flex flex-col relative overflow-hidden cursor-pointer transition-colors duration-1000 ${
          isSanityZero ? 'bg-[#1a0f0f]' : 'bg-[#f4ebd8]'
        }`}
        onClick={handleAreaClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${
          isSanityZero ? 'from-rose-900/20 opacity-30' : 'from-[#3a2f29] opacity-[0.03]'
        } to-transparent`} />

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar relative z-20">
          {chatHistory.map((beat: any) => {
            const isCurrent = beat.id === currentBeat.id;
            const textToShow = isCurrent ? displayedText : beat.text;
            const cleanText = (textToShow || "").replace(/\[<NOISE>\]/g, '');

            return (
              <div key={beat.id} className={isSanityZero && isCurrent ? 'animate-[shake_0.5s_infinite]' : ''}>
                <ChatLog 
                  speaker={beat.speaker} 
                  text={renderText(cleanText)} 
                  feedback={isCurrent ? feedback : null} 
                  // ChatLog 側で isSanityZero を受け取れるよう拡張するならここに追加可能
                />
              </div>
            );
          })}
          
          {isStreaming && currentBeat.speaker !== 'System' && (
            <div className={`inline-block w-2.5 h-5 ml-1 animate-pulse align-middle ${isSanityZero ? 'bg-rose-500' : 'bg-[#3a2f29]'}`} />
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
                <Eye size={16} /> WIGGINS EYE (1pt)
             </button>
          </div>
        )}
      </div>

      {!isInterruptMode && collectedEvidence.length > 0 && (
        <div className={`p-3 flex flex-wrap gap-2 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] overflow-x-auto custom-scrollbar border-t z-20 relative ${
          isSanityZero ? 'bg-[#2a0f15] border-rose-900/50' : 'bg-[#2a2420] border-[#3a2f29]'
        }`}>
          <span className={`text-[10px] font-mono flex items-center mr-1 tracking-widest uppercase ${isSanityZero ? 'text-rose-500' : 'text-[#8c7a6b]'}`}>
            EVIDENCE:
          </span>
          {collectedEvidence.map((ev) => (
            <button
              key={ev}
              onClick={(e) => { e.stopPropagation(); handleSelectEvidence(ev); }}
              disabled={isStreaming}
              className={`whitespace-nowrap text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full font-bold transition-all active:scale-95 z-20 relative ${
                selectedEvidence === ev
                  ? isSanityZero 
                    ? 'bg-rose-600 text-[#1a0f0f] shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                    : 'bg-amber-500 text-[#3a2f29] shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : isSanityZero
                    ? 'bg-rose-950 text-rose-200 hover:bg-rose-900'
                    : 'bg-[#5c4d43] text-[#f4ebd8] hover:bg-[#8c7a6b]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {ev}
            </button>
          ))}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()} className="shrink-0 relative z-30">
        {isInterruptMode ? (
          <InterruptPanel
            collectedEvidences={collectedEvidence}
            hintText={currentBeat?.interrupt?.hint}
            interventionType={interventionType}
            isInterventionAvailable={isInterventionAvailable}
            interventionUsed={interventionUsed}
            onUseIntervention={() => setInterventionUsed(true)}
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
            isMoriarty={isMoriarty}
            uiLabels={uiLabels}
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
                  <span className="text-[#8c7a6b]">FINAL {uiLabels.gaugeName}:</span> <span className={`text-lg font-bold ${isMoriarty ? 'text-fuchsia-600' : isIrene ? 'text-rose-600' : 'text-amber-700'}`}>{tether}%</span>
                </div>
                <div className={`border-2 px-3 py-1 font-bold text-lg uppercase tracking-widest rotate-6 opacity-90 rounded-sm bg-[#f4ebd8] shadow-sm ${
                    endResult.rank === 'LUCID' || endResult.rank === 'CLEARED' ? 'border-emerald-700 text-emerald-800' : endResult.rank === 'SYMPATHETIC' ? 'border-blue-700 text-blue-800' : 'border-rose-800 text-rose-800'
                  }`}>
                  {endResult.rank}
                </div>
              </div>

              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {endResult.consequenceData?.official_record && (
                  <div className="bg-[#e6d5c3]/50 p-3 sm:p-4 rounded-lg border border-[#8c7a6b]/20 font-mono text-xs shadow-inner">
                    <p className="text-[#5c4d43] leading-relaxed">{endResult.consequenceData.official_record}</p>
                  </div>
                )}
                {endResult.consequenceData?.watson_journal && (
                  <div className="p-4 rounded-lg border border-[#8c7a6b]/30 bg-[#fffcf7] shadow-sm">
                    <h3 className="font-bold text-[#3a2f29] mb-2 border-b border-[#8c7a6b]/20 pb-1 text-xs uppercase tracking-widest">
                      {isIrene ? "Irene's Journal" : "Watson's Journal"}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#5c4d43]">{endResult.consequenceData.watson_journal}</p>
                  </div>
                )}
                {endResult.consequenceData?.holmes_note && (
                  <div className="p-4 rounded-lg bg-amber-600/5 border border-amber-700/20 shadow-sm">
                    <h3 className="font-bold text-amber-900 mb-1.5 italic text-xs uppercase tracking-widest">
                      {isMoriarty ? "M.C. Report :" : "Holmes's Note :"}
                    </h3>
                    <p className="text-sm leading-relaxed italic text-amber-800/90">{endResult.consequenceData.holmes_note}</p>
                  </div>
                )}
                {endResult.consequenceData?.mycroft_note && (
                  <div className="p-4 rounded-lg bg-blue-900/5 border border-blue-900/20 shadow-sm">
                    <h3 className="font-bold text-blue-900 mb-1.5 italic text-xs uppercase tracking-widest">
                      Mycroft's Note :
                    </h3>
                    <p className="text-sm leading-relaxed italic text-blue-900/90">{endResult.consequenceData.mycroft_note}</p>
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