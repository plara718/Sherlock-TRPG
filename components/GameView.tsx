'use client';

import React, { useRef, useEffect, useState } from 'react';
import TetherBar from '@/components/TetherBar';
import Controls from '@/components/Controls';
import GlossaryToast from '@/components/GlossaryToast';
import InterruptPanel from '@/components/InterruptPanel';
import ChatLog from '@/components/ChatLog'; 
import { useGameLogic, ScenarioData } from '@/lib/useGameLogic';
import { FileText, ArrowRight, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import glossaryData from '@/data/glossary.json';
import { useSaveData } from '@/lib/SaveDataContext';

export default function GameView() {
  const ctx = useSaveData();
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setScenarioData(null);
    setError(false);

    const fetchScenario = async () => {
      try {
        let fileName = '';
        if (ctx.currentEpisodeId.startsWith('Interlude')) fileName = `interlude_${ctx.currentEpisodeId.split('-')[1].toLowerCase()}`;
        else if (ctx.currentEpisodeId.startsWith('SP-')) fileName = `episode_sp${ctx.currentEpisodeId.split('-')[1]}`;
        else fileName = `episode_${ctx.currentEpisodeId.replace('#', '')}`;
        
        const scenarioModule = await import(`@/data/${fileName}.json`);
        if (isMounted) setScenarioData(scenarioModule.default || scenarioModule);
      } catch (err) {
        console.error("Failed to load scenario data:", err);
        if (isMounted) setError(true);
      }
    };
    fetchScenario();
    return () => { isMounted = false; };
  }, [ctx.currentEpisodeId]);

  if (error) {
    return (
      <div className="h-[100dvh] supports-[height:100svh]:h-[100svh] w-full bg-[#1a0f0f] flex flex-col items-center justify-center font-mono text-rose-500 tracking-widest text-xs p-4 text-center">
        <AlertTriangle className="mb-4 text-rose-600 animate-pulse" size={32} />
        <p>SYSTEM ERROR: DATA NOT FOUND.</p>
        <button onClick={() => ctx.setView('archive')} className="mt-8 border border-rose-900 text-rose-600 px-6 py-2 hover:bg-rose-950 rounded-full transition-colors active:scale-95">RETURN TO ARCHIVE</button>
      </div>
    );
  }

  if (!scenarioData) {
    return (
      <div className="h-[100dvh] supports-[height:100svh]:h-[100svh] w-full bg-theme-bg-dark flex flex-col items-center justify-center font-mono text-theme-text-muted tracking-[0.3em] text-xs">
        <div className="w-8 h-8 border-2 border-t-theme-text-muted border-r-theme-text-muted border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
        LOADING TETHER DATA...
      </div>
    );
  }
  return <GameContent scenarioData={scenarioData} initialSaveData={ctx.activeGameData && ctx.activeGameData.episodeId === ctx.currentEpisodeId ? ctx.activeGameData : null} />;
}

function GameContent({ scenarioData, initialSaveData }: { scenarioData: any, initialSaveData: any }) {
  const ctx = useSaveData(); 
  const episodeId = ctx.currentEpisodeId;
  const onBack = () => {
    ctx.setView('archive');
  };

  const protagonist = scenarioData.meta?.protagonist || 'watson';
  const [activeGlossary, setActiveGlossary] = useState<{ word: string; desc: string; } | null>(null);
  const [isInterruptMode, setIsInterruptMode] = useState(false);
  const [screenEffect, setScreenEffect] = useState<'none' | 'flash' | 'shake' | 'glass-shatter'>('none');
  const [cutin, setCutin] = useState<{type: 'success' | 'fail' | 'penalty', msg: string, isCritical?: boolean} | null>(null);
  const [acquiredEvidencePopup, setAcquiredEvidencePopup] = useState<string | null>(null);

  const [isWigginsActive, setIsWigginsActive] = useState(false);
  const [isSanityZero, setIsSanityZero] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  
  // ▼ 追加：ボタン誤爆防止用のクールタイムステート
  const [interactionCooldown, setInteractionCooldown] = useState(false);
  const isReplay = Boolean(ctx.clearedData[episodeId]);

  const {
    currentBeat, displayedText, isStreaming, tether, feedback, handleInterrupt, evaluatePanelInterrupt,
    nextBeat, handleChoice, skipStream, chatHistory, collectedEvidence, selectedEvidence,
    collectEvidence, handleSelectEvidence, selectedSkill, isCompleted, endResult,
    uiLabels, isMoriarty, isIrene
  } = useGameLogic(scenarioData as ScenarioData, isReplay, ctx.textSpeed, initialSaveData, ctx.setActiveGameData);

  const rawIntervention = scenarioData.meta?.intervention;
  const interventionType = ['Irene', 'Mycroft', 'Wiggins'].includes(rawIntervention as string) ? (rawIntervention as 'Irene' | 'Mycroft' | 'Wiggins') : null;
  const isInterventionAvailable = interventionType === 'Irene' ? (ctx.unlockedTerms.includes('I007') && !isIrene && !isMoriarty) : interventionType === 'Mycroft' ? (!isIrene && !isMoriarty) : interventionType === 'Wiggins' ? (ctx.unlockedTerms.includes('W040') && !isIrene && !isMoriarty) : false;
  const [interventionUsed, setInterventionUsed] = useState(false);

  useEffect(() => { setInterventionUsed(false); setIsSanityZero(false); }, [episodeId]);
  useEffect(() => { setIsSanityZero(tether <= 0 && !isCompleted && !(scenarioData.meta?.type === 'interlude' || scenarioData.meta?.episode_id?.includes('Interlude'))); }, [tether, isCompleted, scenarioData]);

  // ▼ 追加：ストリーミング完了後、0.6秒間は選択肢や証拠品のタップを無効化する
  useEffect(() => {
    if (!isStreaming) {
      setInteractionCooldown(true);
      const timer = setTimeout(() => setInteractionCooldown(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastActionTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (feedback) {
      setCutin({ type: feedback.type, msg: feedback.msg, isCritical: feedback.isCriticalSuccess });
      if (!ctx.reduceEffects) setScreenEffect(feedback.isCriticalSuccess ? 'glass-shatter' : feedback.type === 'success' ? 'flash' : 'shake');
      const timer = setTimeout(() => {
        setScreenEffect('none');
        setCutin(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [feedback, ctx.reduceEffects]);

  useEffect(() => {
    const hasTrigger = currentBeat?.text.includes('[<NOISE>]') || currentBeat?.text.includes('[<FLAW>]');
    setIsInterruptMode(hasTrigger && !isStreaming);
    setIsWigginsActive(false);
  }, [currentBeat, isStreaming]);

  useEffect(() => { 
    if (!isScrollingRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' }); 
    }
  }, [displayedText, chatHistory.length, collectedEvidence, isInterruptMode, isStreaming]);

  const handleGlossaryClick = (term: any) => {
    if (ctx.unlockedTerms.includes(term.id)) {
      setActiveGlossary({ word: term.ja, desc: "このデータは既に大索引に登録されています。詳細はアーカイブで確認してください。" });
    } else {
      ctx.setUnlockedTerms([...ctx.unlockedTerms, term.id]);
      setActiveGlossary({ word: term.ja, desc: "【NEW】大索引に新規データが登録されました！ 事件解決後、アーカイブから詳細を解読できます。" });
    }
  };

  const handleCollectEvidence = (word: string) => {
    if (!collectedEvidence.includes(word)) {
      collectEvidence(word);
      setAcquiredEvidencePopup(word);
      setTimeout(() => setAcquiredEvidencePopup(null), 2000);
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
        const wigginsStyle = (isWigginsActive && !isCollected) ? 'ring-2 ring-theme-accent-muted ring-offset-1 bg-amber-200 animate-pulse' : '';
        elements.push(
          <span key={`ev-${i}`} onClick={(e) => { e.stopPropagation(); handleCollectEvidence(word); }} className={`font-bold cursor-pointer px-1.5 mx-0.5 rounded transition-all shadow-sm inline-flex items-center z-10 relative ${wigginsStyle} ${isCollected ? 'bg-theme-bg-panel text-theme-text-muted cursor-default' : isSanityZero ? 'text-rose-900 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-600/50 active:scale-95 animate-pulse' : 'text-theme-text-base bg-theme-accent-main hover:opacity-80 border border-theme-border-base/50 active:scale-95 text-white'}`}>{word}</span>
        );
      } else { elements.push(part); }
    });

    glossaryData.terms.forEach((term) => {
      const newElements: (string | React.JSX.Element)[] = [];
      elements.forEach((el) => {
        if (typeof el !== 'string') { newElements.push(el); return; }
        const gParts = el.split(term.trigger_word);
        gParts.forEach((gPart, j) => {
          newElements.push(gPart);
          if (j < gParts.length - 1) {
            newElements.push(<span key={`g-${term.id}-${j}`} onClick={(e) => { e.stopPropagation(); handleGlossaryClick(term); }} className={`underline decoration-dotted cursor-help transition-colors font-bold z-10 relative ${isSanityZero ? 'text-rose-600 hover:text-rose-400' : 'text-theme-accent-main hover:opacity-80'}`}>{term.trigger_word}</span>);
          }
        });
      });
      elements = newElements;
    });
    return elements;
  };

  return (
    <div data-theme={isMoriarty ? 'moriarty' : 'holmes'} className={`w-full max-w-2xl mx-auto relative flex flex-col h-[100dvh] supports-[height:100svh]:h-[100svh] touch-manipulation overscroll-none transition-transform duration-75 select-none ${screenEffect === 'shake' ? '-translate-x-2' : ''} bg-theme-bg-base`}>
      
      {screenEffect === 'flash' && <div className="absolute inset-0 bg-white z-[60] animate-out fade-out duration-500 pointer-events-none mix-blend-overlay" />}
      {screenEffect === 'shake' && <div className="absolute inset-0 bg-theme-accent-main opacity-20 z-[60] animate-out fade-out duration-500 pointer-events-none" />}
      {screenEffect === 'glass-shatter' && (
        <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-white/80 animate-out fade-out duration-700 mix-blend-overlay" />
          <div className="text-4xl font-black text-rose-600 tracking-[0.5em] animate-out zoom-out-150 fade-out duration-700 rotate-12 drop-shadow-2xl">NOISE CLEARED</div>
        </div>
      )}

      {acquiredEvidencePopup && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[70] pointer-events-none flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-theme-accent-main text-white font-black px-6 py-2 rounded-full shadow-lg border-2 border-theme-border-base flex items-center gap-2 text-sm sm:text-base tracking-widest">
            <FileText size={18} /> EVIDENCE ACQUIRED
          </div>
          <div className="mt-2 bg-theme-bg-dark text-theme-text-light px-4 py-1.5 rounded-lg border border-theme-accent-main shadow-lg text-sm sm:text-base font-bold font-serif max-w-[80vw] truncate">
            {acquiredEvidencePopup}
          </div>
        </div>
      )}

      {cutin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />
          <div className={`relative px-8 py-6 rounded-2xl border-4 transform -rotate-3 animate-in zoom-in-50 fade-in duration-300 shadow-2xl backdrop-blur-sm flex flex-col items-center text-center max-w-[90%]
            ${cutin.type === 'success' ? 'bg-[#1a2f23]/90 border-emerald-500 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-[#2f1a1a]/90 border-rose-600 text-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)]'}`}
          >
            <div className={`absolute -top-5 w-10 h-10 rounded-full border-4 flex items-center justify-center bg-theme-bg-dark ${cutin.type === 'success' ? 'border-emerald-500 text-emerald-500' : 'border-rose-600 text-rose-500'}`}>
              {cutin.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[0.1em] font-mono mt-2 mb-2 uppercase drop-shadow-md">{cutin.type === 'success' ? 'SUCCESS' : 'FAILED'}</h2>
            <div className={`w-full h-px mb-3 ${cutin.type === 'success' ? 'bg-emerald-500/30' : 'bg-rose-600/30'}`} />
            <p className="text-sm sm:text-base font-bold font-serif opacity-90 break-words whitespace-pre-wrap leading-relaxed">{cutin.msg.replace(/（.+?）/g, '')}</p>
            {cutin.isCritical && <div className="absolute -bottom-4 bg-theme-accent-main text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border-2 border-theme-border-base animate-pulse whitespace-nowrap shadow-lg">CRITICAL HIT</div>}
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${cutin.type === 'success' ? 'from-emerald-400/0 via-emerald-400/10 to-emerald-400/0' : 'from-rose-500/0 via-rose-500/10 to-rose-500/0'} transform -skew-x-12 animate-[pulse_1s_infinite] pointer-events-none rounded-xl`} />
          </div>
        </div>
      )}

      {isSanityZero && !isCompleted && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-multiply opacity-50 flex flex-col">
           <div className={`absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.1)_2px,rgba(225,29,72,0.1)_4px)] ${ctx.reduceEffects ? '' : 'animate-[pulse_0.1s_infinite]'}`} />
           <div className={`absolute top-[20%] w-full bg-rose-600/20 border-y-2 border-rose-600 text-rose-500 font-mono font-bold text-center py-2 tracking-[0.3em] shadow-[0_0_20px_rgba(225,29,72,0.5)] ${ctx.reduceEffects ? '' : 'animate-[pulse_1.5s_infinite]'}`}>
             <AlertTriangle className="inline-block mr-2 w-5 h-5 mb-1" /> WARNING: SANITY COMPROMISED <AlertTriangle className="inline-block ml-2 w-5 h-5 mb-1" />
           </div>
        </div>
      )}

      {showBacklog && (
        <div className="absolute inset-0 z-[120] bg-black/80 flex flex-col animate-in fade-in duration-200">
          <div className="p-4 border-b flex justify-between items-center shrink-0 bg-theme-bg-base border-theme-border-base/30 pt-[max(env(safe-area-inset-top),1rem)]">
            <h2 className="font-mono text-sm tracking-widest font-bold text-theme-text-base">COMMUNICATION LOG</h2>
            <button onClick={() => setShowBacklog(false)} className="p-2 rounded-full transition-colors bg-theme-bg-panel text-theme-text-muted hover:opacity-80">
              <AlertTriangle className="rotate-180" size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-theme-bg-base pb-[env(safe-area-inset-bottom)]">
            {chatHistory.map((beat: any, idx: number) => (
              <ChatLog key={`log-${idx}`} speaker={beat.speaker} text={renderText(beat.text)} feedback={null} isMetaNotice={beat.speaker === 'System' && beat.text.startsWith('【')} />
            ))}
          </div>
        </div>
      )}

      <header className="shrink-0 border-b flex items-center justify-between p-3 sm:p-4 z-10 shadow-sm relative bg-theme-bg-base border-theme-border-base/20 backdrop-blur-md pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono tracking-widest uppercase text-theme-text-muted">Active File</span>
          <h1 className="text-xs sm:text-sm font-bold font-serif tracking-widest text-theme-text-base">
            {scenarioData.meta?.title || 'UNKNOWN RECORD'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBacklog(true)} className="px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-widest rounded-full transition-transform active:scale-95 shadow-sm border bg-theme-bg-panel text-theme-text-muted border-theme-border-base/30">
            LOG
          </button>
          {isReplay && <span className="text-[10px] font-bold px-2 py-1 rounded border bg-theme-bg-panel text-theme-text-muted border-theme-border-base/30">REPLAY</span>}
          <button onClick={onBack} className="px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-widest rounded-full transition-transform active:scale-95 shadow-sm bg-theme-bg-panel hover:bg-theme-bg-dark text-theme-text-base">
            SUSPEND
          </button>
        </div>
      </header>

      <TetherBar tether={tether} onArchiveClick={onBack} protagonist={protagonist} gaugeName={uiLabels.gaugeName} />

      <div 
        className="flex-1 flex flex-col relative overflow-hidden cursor-pointer transition-colors duration-1000 bg-theme-bg-base" 
        onClick={() => { 
          if (!isScrollingRef.current && (Date.now() - lastActionTimeRef.current > 500)) { 
            lastActionTimeRef.current = Date.now(); 
            isStreaming ? skipStream() : nextBeat(); 
          } 
        }} 
        onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} 
        onTouchMove={(e) => { if (touchStartRef.current && (Math.abs(e.touches[0].clientX - touchStartRef.current.x) > 10 || Math.abs(e.touches[0].clientY - touchStartRef.current.y) > 10)) isScrollingRef.current = true; }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-theme-text-base opacity-[0.03] to-transparent" />
        
        <div 
          ref={scrollContainerRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar relative z-20"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            isScrollingRef.current = scrollHeight - scrollTop - clientHeight > 50;
          }}
        >
          {chatHistory.map((beat: any, idx: number) => {
            const isCurrent = idx === chatHistory.length - 1;
            const textToShow = isCurrent ? displayedText : beat.text;
            let cleanText = (textToShow || "").replace(/\[<NOISE>\]/g, '').replace(/\[<FLAW>\]/g, '');

            if (isCurrent && isStreaming) {
              cleanText = cleanText.replace(/\{([^}]*)$/, '$1');
            }

            const isMetaNotice = beat.speaker === 'System' && cleanText.startsWith('【');

            return (
              <div key={idx} className={isSanityZero && isCurrent ? (ctx.reduceEffects ? '' : 'animate-[shake_0.5s_infinite]') : ''}>
                <ChatLog speaker={beat.speaker} text={renderText(cleanText)} feedback={isCurrent ? feedback : null} isMetaNotice={isMetaNotice} />
              </div>
            );
          })}
          {isStreaming && currentBeat.speaker !== 'System' && <div className="inline-block w-2.5 h-5 ml-1 animate-pulse align-middle bg-theme-text-base" />}
          <div ref={bottomRef} className="h-20" />
        </div>

        {!isStreaming && currentBeat?.text.match(/\{.*?\}/g)?.some(match => !collectedEvidence.includes(match.slice(1, -1))) && !isInterruptMode && !isWigginsActive && ctx.unlockedTerms.includes('W040') && (
          <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-20 animate-in fade-in zoom-in duration-300">
             <button onClick={(e) => { e.stopPropagation(); if (ctx.insightPoints >= 1 && !isWigginsActive && ctx.handleSpendPoint(1)) setIsWigginsActive(true); }} disabled={ctx.insightPoints < 1} className="bg-amber-700 hover:bg-amber-600 disabled:bg-[#d8c8b8] disabled:text-[#8c7a6b] disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"><Eye size={16} /> WIGGINS EYE (1pt)</button>
          </div>
        )}
      </div>

      {!isInterruptMode && collectedEvidence.length > 0 && (
        <div className="p-3 flex flex-wrap gap-2 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] overflow-x-auto custom-scrollbar border-t z-20 relative bg-theme-bg-dark-panel border-theme-border-dark">
          <span className="text-[10px] font-mono flex items-center mr-1 tracking-widest uppercase text-theme-text-muted">EVIDENCE:</span>
          {collectedEvidence.map((ev) => (
            <button key={ev} onClick={(e) => { e.stopPropagation(); handleSelectEvidence(ev); }} disabled={isStreaming || interactionCooldown} 
              className={`whitespace-nowrap text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full font-bold transition-all z-20 relative 
              ${acquiredEvidencePopup === ev ? 'ring-4 ring-theme-accent-main ring-offset-2 ring-offset-theme-bg-dark bg-theme-accent-main text-white scale-110 shadow-lg z-30 duration-300' : ''} 
              ${selectedEvidence === ev ? 'bg-theme-accent-main text-white shadow-md' : 'bg-theme-bg-panel text-theme-text-muted hover:bg-theme-border-base hover:text-theme-text-light'} ${interactionCooldown ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {ev}
            </button>
          ))}
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()} className="shrink-0 relative z-30 pb-[env(safe-area-inset-bottom)] bg-theme-bg-base">
        {currentBeat?.choices && !isStreaming && (
          <div className="absolute bottom-full left-0 w-full h-[100dvh] supports-[height:100svh]:h-[100svh] bg-black/60 pointer-events-none animate-in fade-in duration-700 z-0" />
        )}
        
        {currentBeat?.choices && !isStreaming ? (
          <div className="p-4 flex flex-col gap-3 border-t-2 border-theme-border-base/30 bg-theme-bg-dark shadow-[0_-20px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500 relative z-10">
            <p className="text-[10px] font-mono text-theme-accent-main mb-1 text-center tracking-[0.3em] uppercase animate-pulse flex items-center justify-center gap-2">
              <span className="w-10 h-px bg-theme-accent-main opacity-50" /> LOGIC BRANCH <span className="w-10 h-px bg-theme-accent-main opacity-50" />
            </p>
            {/* ▼ 修正：選択肢ボタンにクールタイムを適用し、連打による誤爆を防止 */}
            {currentBeat.choices.map((choice: any, idx: number) => (
              <button 
                key={idx} 
                disabled={interactionCooldown}
                onClick={() => handleChoice(choice.next_beat_id)} 
                className={`w-full py-3.5 sm:py-4 bg-theme-bg-dark-panel border border-theme-border-base/50 text-theme-text-light font-bold font-serif tracking-widest rounded-lg shadow-md transition-all text-sm ${interactionCooldown ? 'opacity-50 cursor-not-allowed' : 'hover:bg-theme-bg-panel active:scale-95'}`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : isInterruptMode ? (
          <InterruptPanel collectedEvidences={collectedEvidence} hintText={currentBeat?.interrupt?.hint} interventionType={interventionType} isInterventionAvailable={isInterventionAvailable} interventionUsed={interventionUsed} onUseIntervention={() => setInterventionUsed(true)} onSubmit={(skill, evidence) => { evaluatePanelInterrupt(skill, evidence); setIsInterruptMode(false); }} onTimeUp={() => { handleInterrupt('TIMEOUT'); setIsInterruptMode(false); }} protagonist={protagonist} isMoriarty={isMoriarty} uiLabels={uiLabels} isEvidenceRequired={!!currentBeat?.interrupt?.required_evidence} />
        ) : (
          <Controls isStreaming={isStreaming && currentBeat.speaker !== 'System'} selectedSkill={selectedSkill} onNext={() => { const now = Date.now(); if (now - lastActionTimeRef.current > 500) { nextBeat(); lastActionTimeRef.current = now; } }} onInterrupt={handleInterrupt} />
        )}
      </div>

      {activeGlossary && <GlossaryToast term={activeGlossary.word} desc={activeGlossary.desc} onClose={() => setActiveGlossary(null)} />}

      {isCompleted && endResult && (
        <div className="absolute inset-0 z-50 bg-theme-bg-dark opacity-95 flex items-center justify-center p-4 animate-in fade-in duration-500 backdrop-blur-sm">
          <div className="bg-theme-bg-base max-w-md w-full rounded-xl shadow-2xl border-2 border-theme-border-base relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-theme-border-dark" />
            <div className="p-6 sm:p-8 relative z-10 font-serif text-theme-text-base">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest border-b border-theme-border-base/30 pb-3 mb-5 flex items-center gap-2"><FileText className="text-theme-text-muted" /> Investigation Report</h2>
              <div className="flex justify-between items-end border-b border-theme-border-base/30 border-dotted pb-3 mb-5 font-mono text-sm">
                <div><span className="text-theme-text-muted">CASE ID:</span> <span className="font-bold">{episodeId}</span><br /><span className="text-theme-text-muted">FINAL {uiLabels.gaugeName}:</span> <span className="text-lg font-bold text-theme-accent-main">{tether}%</span></div>
                <div className={`border-2 px-3 py-1 font-bold text-lg uppercase tracking-widest rotate-6 opacity-90 rounded-sm bg-theme-bg-base shadow-sm ${endResult.rank === 'LUCID' || endResult.rank === 'CLEARED' ? 'border-emerald-700 text-emerald-800' : endResult.rank === 'SYMPATHETIC' ? 'border-blue-700 text-blue-800' : 'border-rose-800 text-rose-800'}`}>{endResult.rank}</div>
              </div>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {endResult.consequenceData?.official_record && <div className="bg-theme-bg-panel/50 p-3 sm:p-4 rounded-lg border border-theme-border-base/20 font-mono text-xs shadow-inner"><p className="text-theme-text-base leading-relaxed">{endResult.consequenceData.official_record}</p></div>}
                {endResult.consequenceData?.watson_journal && <div className="p-4 rounded-lg border border-theme-border-base/30 bg-theme-bg-light shadow-sm"><h3 className="font-bold text-theme-text-base mb-2 border-b border-theme-border-base/20 pb-1 text-xs uppercase tracking-widest">{isIrene ? "Irene's Journal" : "Watson's Journal"}</h3><p className="text-sm leading-relaxed text-theme-text-muted">{endResult.consequenceData.watson_journal}</p></div>}
                {endResult.consequenceData?.holmes_note && <div className="p-4 rounded-lg bg-theme-accent-main opacity-90 border border-theme-accent-muted shadow-sm"><h3 className="font-bold text-white mb-1.5 italic text-xs uppercase tracking-widest">{isMoriarty ? "M.C. Report :" : "Holmes's Note :"}</h3><p className="text-sm leading-relaxed italic text-white/90">{endResult.consequenceData.holmes_note}</p></div>}
              </div>
              <div className="mt-6 text-center pt-4"><p className="text-[10px] text-theme-text-muted tracking-widest uppercase mb-1 font-mono">Insight Points Acquired</p><p className="text-4xl font-bold text-theme-accent-main font-mono drop-shadow-sm">+{endResult.points} pt</p>{isReplay && <p className="text-[9px] text-theme-text-muted mt-1 font-mono tracking-tighter">*再プレイ報酬適用</p>}</div>
              <button onClick={() => ctx.handleEpisodeComplete(episodeId, endResult.rank, tether, endResult.points)} className="w-full mt-6 bg-theme-bg-dark hover:bg-theme-bg-dark-panel text-theme-text-light font-bold py-3.5 rounded-full tracking-widest transition-transform active:scale-95 shadow-md text-sm">FILE ARCHIVE (記録完了)</button>
            </div>
          </div>
        </div>
      )}

      {isCompleted && !endResult && (
        <div className="absolute inset-0 z-50 bg-theme-bg-dark opacity-95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000 backdrop-blur-md">
          <p className="text-theme-text-light text-lg font-serif tracking-widest mb-10 animate-pulse text-center">―― そして、記録は次へ繋がる。</p>
          <button onClick={() => ctx.handleEpisodeComplete(episodeId, "INTERLUDE", tether, 0)} className="bg-transparent border border-theme-border-base text-theme-text-light hover:bg-theme-text-light hover:text-theme-bg-dark font-bold py-3 px-8 rounded-full tracking-widest transition-all duration-300 flex items-center gap-2 active:scale-95">次へ進む <ArrowRight size={20} /></button>
        </div>
      )}
    </div>
  );
}