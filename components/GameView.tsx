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
      <div className="h-[100dvh] w-full bg-[#1a0f0f] flex flex-col items-center justify-center font-mono text-rose-500 tracking-widest text-xs p-4 text-center">
        <AlertTriangle className="mb-4 text-rose-600 animate-pulse" size={32} />
        <p>SYSTEM ERROR: DATA NOT FOUND.</p>
        <button onClick={() => ctx.setView('archive')} className="mt-8 border border-rose-900 text-rose-600 px-6 py-2 hover:bg-rose-950 rounded-full transition-colors active:scale-95">RETURN TO ARCHIVE</button>
      </div>
    );
  }

  if (!scenarioData) {
    return (
      <div className="h-[100dvh] w-full bg-[#1a1512] flex flex-col items-center justify-center font-mono text-[#8c7a6b] tracking-[0.3em] text-xs">
        <div className="w-8 h-8 border-2 border-t-[#8c7a6b] border-r-[#8c7a6b] border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
        LOADING TETHER DATA...
      </div>
    );
  }
  return <GameContent scenarioData={scenarioData} />;
}

function GameContent({ scenarioData }: { scenarioData: any }) {
  const ctx = useSaveData(); 
  const episodeId = ctx.currentEpisodeId;
  const onBack = () => ctx.setView('archive');

  const protagonist = scenarioData.meta?.protagonist || 'watson';
  const [activeGlossary, setActiveGlossary] = useState<{ word: string; desc: string; } | null>(null);
  const [isInterruptMode, setIsInterruptMode] = useState(false);
  const [screenEffect, setScreenEffect] = useState<'none' | 'flash' | 'shake' | 'glass-shatter'>('none');
  const [cutin, setCutin] = useState<{type: 'success' | 'fail' | 'penalty', msg: string, isCritical?: boolean} | null>(null);
  
  // ▼ 新規：証拠獲得ポップアップ用のステート
  const [acquiredEvidencePopup, setAcquiredEvidencePopup] = useState<string | null>(null);

  const [isWigginsActive, setIsWigginsActive] = useState(false);
  const [isSanityZero, setIsSanityZero] = useState(false);
  const isReplay = Boolean(ctx.clearedData[episodeId]);

  const {
    currentBeat, displayedText, isStreaming, tether, feedback, handleInterrupt, evaluatePanelInterrupt,
    nextBeat, handleChoice, skipStream, chatHistory, collectedEvidence, selectedEvidence,
    collectEvidence, handleSelectEvidence, selectedSkill, isCompleted, endResult,
    uiLabels, isMoriarty, isIrene
  } = useGameLogic(scenarioData as ScenarioData, isReplay);

  const rawIntervention = scenarioData.meta?.intervention;
  const interventionType = ['Irene', 'Mycroft', 'Wiggins'].includes(rawIntervention as string) ? (rawIntervention as 'Irene' | 'Mycroft' | 'Wiggins') : null;
  const isInterventionAvailable = interventionType === 'Irene' ? (ctx.unlockedTerms.includes('I007') && !isIrene && !isMoriarty) : interventionType === 'Mycroft' ? (!isIrene && !isMoriarty) : interventionType === 'Wiggins' ? (ctx.unlockedTerms.includes('W040') && !isIrene && !isMoriarty) : false;
  const [interventionUsed, setInterventionUsed] = useState(false);

  useEffect(() => { setInterventionUsed(false); setIsSanityZero(false); }, [episodeId]);
  useEffect(() => { setIsSanityZero(tether <= 0 && !isCompleted && !(scenarioData.meta?.type === 'interlude' || scenarioData.meta?.episode_id?.includes('Interlude'))); }, [tether, isCompleted, scenarioData]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastActionTimeRef = useRef<number>(Date.now());

  // 判定結果のカットイン処理
  useEffect(() => {
    if (feedback) {
      setCutin({ type: feedback.type, msg: feedback.msg, isCritical: feedback.isCriticalSuccess });
      setScreenEffect(feedback.isCriticalSuccess ? 'glass-shatter' : feedback.type === 'success' ? 'flash' : 'shake');
      const timer = setTimeout(() => {
        setScreenEffect('none');
        setCutin(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    setIsInterruptMode(currentBeat?.text.includes('[<NOISE>]') && !isStreaming);
    setIsWigginsActive(false);
  }, [currentBeat, isStreaming]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [displayedText, chatHistory.length, collectedEvidence, isInterruptMode]);

  const handleGlossaryClick = (term: any) => {
    if (ctx.unlockedTerms.includes(term.id)) {
      setActiveGlossary({ word: term.ja, desc: "このデータは既に大索引に登録されています。詳細はアーカイブで確認してください。" });
    } else {
      ctx.setUnlockedTerms([...ctx.unlockedTerms, term.id]);
      setActiveGlossary({ word: term.ja, desc: "【NEW】大索引に新規データが登録されました！ 事件解決後、アーカイブから詳細を解読できます。" });
    }
  };

  // ▼ 新規：証拠獲得処理にポップアップ演出を追加
  const handleCollectEvidence = (word: string) => {
    if (!collectedEvidence.includes(word)) {
      collectEvidence(word);
      setAcquiredEvidencePopup(word);
      setTimeout(() => setAcquiredEvidencePopup(null), 2000); // 2秒で消える
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
          <span key={`ev-${i}`} onClick={(e) => { e.stopPropagation(); handleCollectEvidence(word); }} className={`font-bold cursor-pointer px-1.5 mx-0.5 rounded transition-all shadow-sm inline-flex items-center z-10 relative ${wigginsStyle} ${isCollected ? 'bg-[#d8c8b8] text-[#8c7a6b] cursor-default' : isSanityZero ? 'text-rose-900 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-600/50 active:scale-95 animate-pulse' : 'text-[#3a2f29] bg-amber-500/20 hover:bg-amber-500/40 border border-amber-600/30 active:scale-95'}`}>{word}</span>
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
            newElements.push(<span key={`g-${term.id}-${j}`} onClick={(e) => { e.stopPropagation(); handleGlossaryClick(term); }} className={`underline decoration-dotted cursor-help transition-colors font-bold z-10 relative ${isSanityZero ? 'text-rose-600 hover:text-rose-400' : 'text-amber-700 hover:text-amber-600'}`}>{term.trigger_word}</span>);
          }
        });
      });
      elements = newElements;
    });
    return elements;
  };

  return (
    <div className={`w-full max-w-2xl mx-auto relative flex flex-col h-[100dvh] touch-manipulation overscroll-none transition-transform duration-75 select-none ${screenEffect === 'shake' ? '-translate-x-2' : ''} ${isSanityZero ? 'bg-[#1a0f0f]' : 'bg-[#f4ebd8]'}`}>
      
      {/* 画面エフェクト */}
      {screenEffect === 'flash' && <div className="absolute inset-0 bg-white z-[60] animate-out fade-out duration-500 pointer-events-none mix-blend-overlay" />}
      {screenEffect === 'shake' && <div className="absolute inset-0 bg-rose-900/20 z-[60] animate-out fade-out duration-500 pointer-events-none" />}
      {screenEffect === 'glass-shatter' && (
        <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-white/80 animate-out fade-out duration-700 mix-blend-overlay" />
          <div className="text-4xl font-black text-rose-600 tracking-[0.5em] animate-out zoom-out-150 fade-out duration-700 rotate-12 drop-shadow-2xl">NOISE CLEARED</div>
        </div>
      )}

      {/* ▼ 新規：証拠獲得ポップアップ演出 */}
      {acquiredEvidencePopup && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[70] pointer-events-none flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-amber-500 text-black font-black px-6 py-2 rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.5)] border-2 border-amber-200 flex items-center gap-2 text-sm sm:text-base tracking-widest">
            <FileText size={18} /> EVIDENCE ACQUIRED
          </div>
          <div className="mt-2 bg-[#1a1512]/90 text-white px-4 py-1.5 rounded-lg border border-amber-500/50 shadow-lg text-sm sm:text-base font-bold font-serif max-w-[80vw] truncate">
            {acquiredEvidencePopup}
          </div>
        </div>
      )}

      {/* 判定結果カットイン */}
      {cutin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />
          <div className={`relative px-8 py-6 rounded-2xl border-4 transform -rotate-3 animate-in zoom-in-50 fade-in duration-300 shadow-2xl backdrop-blur-sm flex flex-col items-center text-center max-w-[90%]
            ${cutin.type === 'success' ? 'bg-[#1a2f23]/90 border-emerald-500 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]' : 'bg-[#2f1a1a]/90 border-rose-600 text-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)]'}`}
          >
            <div className={`absolute -top-5 w-10 h-10 rounded-full border-4 flex items-center justify-center bg-[#1a1512] ${cutin.type === 'success' ? 'border-emerald-500 text-emerald-500' : 'border-rose-600 text-rose-500'}`}>
              {cutin.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[0.1em] font-mono mt-2 mb-2 uppercase drop-shadow-md">{cutin.type === 'success' ? 'SUCCESS' : 'FAILED'}</h2>
            <div className={`w-full h-px mb-3 ${cutin.type === 'success' ? 'bg-emerald-500/30' : 'bg-rose-600/30'}`} />
            <p className="text-sm sm:text-base font-bold font-serif opacity-90 break-words whitespace-pre-wrap leading-relaxed">{cutin.msg.replace(/（.+?）/g, '')}</p>
            {cutin.isCritical && <div className="absolute -bottom-4 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border-2 border-amber-200 animate-pulse whitespace-nowrap shadow-lg">CRITICAL HIT</div>}
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${cutin.type === 'success' ? 'from-emerald-400/0 via-emerald-400/10 to-emerald-400/0' : 'from-rose-500/0 via-rose-500/10 to-rose-500/0'} transform -skew-x-12 animate-[pulse_1s_infinite] pointer-events-none rounded-xl`} />
          </div>
        </div>
      )}

      {isSanityZero && !isCompleted && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-multiply opacity-50 flex flex-col">
           <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.1)_2px,rgba(225,29,72,0.1)_4px)] animate-[pulse_0.1s_infinite]" />
           <div className="absolute top-[20%] w-full bg-rose-600/20 border-y-2 border-rose-600 text-rose-500 font-mono font-bold text-center py-2 tracking-[0.3em] animate-[pulse_1.5s_infinite] shadow-[0_0_20px_rgba(225,29,72,0.5)]">
             <AlertTriangle className="inline-block mr-2 w-5 h-5 mb-1" /> WARNING: SANITY COMPROMISED <AlertTriangle className="inline-block ml-2 w-5 h-5 mb-1" />
           </div>
        </div>
      )}

      <TetherBar tether={tether} onArchiveClick={onBack} protagonist={protagonist} gaugeName={uiLabels.gaugeName} />

      {/* ▼ 修正：連打ガード（0.5秒クールタイム）の強化 */}
      <div 
        className={`flex-1 flex flex-col relative overflow-hidden cursor-pointer transition-colors duration-1000 ${isSanityZero ? 'bg-[#1a0f0f]' : 'bg-[#f4ebd8]'}`} 
        onClick={() => { 
          if (!isScrollingRef.current && (Date.now() - lastActionTimeRef.current > 500)) { // ★クールタイムを500ms(0.5秒)に延長
            lastActionTimeRef.current = Date.now(); 
            isStreaming ? skipStream() : nextBeat(); 
          } 
        }} 
        onTouchStart={(e) => { isScrollingRef.current = false; touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} 
        onTouchMove={(e) => { if (touchStartRef.current && (Math.abs(e.touches[0].clientX - touchStartRef.current.x) > 10 || Math.abs(e.touches[0].clientY - touchStartRef.current.y) > 10)) isScrollingRef.current = true; }}
      >
        <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${isSanityZero ? 'from-rose-900/20 opacity-30' : 'from-[#3a2f29] opacity-[0.03]'} to-transparent`} />
        
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar relative z-20">
          {chatHistory.map((beat: any, idx: number) => {
            const isCurrent = idx === chatHistory.length - 1;
            const textToShow = isCurrent ? displayedText : beat.text;
            const cleanText = (textToShow || "").replace(/\[<NOISE>\]/g, '');
            const isMetaNotice = beat.speaker === 'System' && cleanText.startsWith('【');

            return (
              <div key={idx} className={isSanityZero && isCurrent ? 'animate-[shake_0.5s_infinite]' : ''}>
                <ChatLog speaker={beat.speaker} text={renderText(cleanText)} feedback={isCurrent ? feedback : null} isMetaNotice={isMetaNotice} />
              </div>
            );
          })}
          {isStreaming && currentBeat.speaker !== 'System' && <div className={`inline-block w-2.5 h-5 ml-1 animate-pulse align-middle ${isSanityZero ? 'bg-rose-500' : 'bg-[#3a2f29]'}`} />}
          <div ref={bottomRef} className="h-20" />
        </div>

        {!isStreaming && currentBeat?.text.match(/\{.*?\}/g)?.some(match => !collectedEvidence.includes(match.slice(1, -1))) && !isInterruptMode && !isWigginsActive && ctx.unlockedTerms.includes('W040') && (
          <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-20 animate-in fade-in zoom-in duration-300">
             <button onClick={(e) => { e.stopPropagation(); if (ctx.insightPoints >= 1 && !isWigginsActive && ctx.handleSpendPoint(1)) setIsWigginsActive(true); }} disabled={ctx.insightPoints < 1} className="bg-amber-700 hover:bg-amber-600 disabled:bg-[#d8c8b8] disabled:text-[#8c7a6b] disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"><Eye size={16} /> WIGGINS EYE (1pt)</button>
          </div>
        )}
      </div>

      {/* ▼ 修正：獲得した証拠が光るエフェクト */}
      {!isInterruptMode && collectedEvidence.length > 0 && (
        <div className={`p-3 flex flex-wrap gap-2 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] overflow-x-auto custom-scrollbar border-t z-20 relative ${isSanityZero ? 'bg-[#2a0f15] border-rose-900/50' : 'bg-[#2a2420] border-[#3a2f29]'}`}>
          <span className={`text-[10px] font-mono flex items-center mr-1 tracking-widest uppercase ${isSanityZero ? 'text-rose-500' : 'text-[#8c7a6b]'}`}>EVIDENCE:</span>
          {collectedEvidence.map((ev) => (
            <button key={ev} onClick={(e) => { e.stopPropagation(); handleSelectEvidence(ev); }} disabled={isStreaming} 
              className={`whitespace-nowrap text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full font-bold transition-all active:scale-95 z-20 relative 
              ${acquiredEvidencePopup === ev ? 'ring-4 ring-amber-500 ring-offset-2 ring-offset-[#2a2420] bg-amber-400 text-black scale-110 shadow-[0_0_20px_rgba(245,158,11,0.8)] z-30 duration-300' : ''} 
              ${selectedEvidence === ev ? isSanityZero ? 'bg-rose-600 text-[#1a0f0f] shadow-[0_0_10px_rgba(225,29,72,0.4)]' : 'bg-amber-500 text-[#3a2f29] shadow-[0_0_10px_rgba(245,158,11,0.4)]' : isSanityZero ? 'bg-rose-950 text-rose-200 hover:bg-rose-900' : 'bg-[#5c4d43] text-[#f4ebd8] hover:bg-[#8c7a6b]'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {ev}
            </button>
          ))}
        </div>
      )}

      {/* ▼ 修正：選択肢出現時の暗転カットイン演出 */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0 relative z-30 pb-[env(safe-area-inset-bottom)] bg-[#f4ebd8]">
        {currentBeat?.choices && !isStreaming && (
          <div className="absolute bottom-full left-0 w-full h-[100dvh] bg-black/60 pointer-events-none animate-in fade-in duration-700 z-0" />
        )}
        
        {currentBeat?.choices && !isStreaming ? (
          <div className="p-4 flex flex-col gap-3 border-t-2 border-[#8c7a6b]/30 bg-[#1a1512] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500 relative z-10">
            <p className="text-[10px] font-mono text-amber-500 mb-1 text-center tracking-[0.3em] uppercase animate-pulse flex items-center justify-center gap-2">
              <span className="w-10 h-px bg-amber-500/50" /> LOGIC BRANCH <span className="w-10 h-px bg-amber-500/50" />
            </p>
            {currentBeat.choices.map((choice: any, idx: number) => (
              <button key={idx} onClick={() => handleChoice(choice.next_beat_id)} className="w-full py-3.5 sm:py-4 bg-[#2a2420] hover:bg-[#3a2f29] border border-[#8c7a6b]/50 hover:border-amber-500/50 text-[#d8c8b8] hover:text-amber-400 font-bold font-serif tracking-widest rounded-lg shadow-md transition-all active:scale-95 text-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]">{choice.label}</button>
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
        <div className="absolute inset-0 z-50 bg-[#1a1512]/90 flex items-center justify-center p-4 animate-in fade-in duration-500 backdrop-blur-sm">
          <div className="bg-[#f4ebd8] max-w-md w-full rounded-xl shadow-2xl border-2 border-[#8c7a6b] relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-[#3a2f29]" />
            <div className="p-6 sm:p-8 relative z-10 font-serif text-[#3a2f29]">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest border-b border-[#8c7a6b]/30 pb-3 mb-5 flex items-center gap-2"><FileText className="text-[#8c7a6b]" /> Investigation Report</h2>
              <div className="flex justify-between items-end border-b border-[#8c7a6b]/30 border-dotted pb-3 mb-5 font-mono text-sm">
                <div><span className="text-[#8c7a6b]">CASE ID:</span> <span className="font-bold">{episodeId}</span><br /><span className="text-[#8c7a6b]">FINAL {uiLabels.gaugeName}:</span> <span className={`text-lg font-bold ${isMoriarty ? 'text-fuchsia-600' : isIrene ? 'text-rose-600' : 'text-amber-700'}`}>{tether}%</span></div>
                <div className={`border-2 px-3 py-1 font-bold text-lg uppercase tracking-widest rotate-6 opacity-90 rounded-sm bg-[#f4ebd8] shadow-sm ${endResult.rank === 'LUCID' || endResult.rank === 'CLEARED' ? 'border-emerald-700 text-emerald-800' : endResult.rank === 'SYMPATHETIC' ? 'border-blue-700 text-blue-800' : 'border-rose-800 text-rose-800'}`}>{endResult.rank}</div>
              </div>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {endResult.consequenceData?.official_record && <div className="bg-[#e6d5c3]/50 p-3 sm:p-4 rounded-lg border border-[#8c7a6b]/20 font-mono text-xs shadow-inner"><p className="text-[#5c4d43] leading-relaxed">{endResult.consequenceData.official_record}</p></div>}
                {endResult.consequenceData?.watson_journal && <div className="p-4 rounded-lg border border-[#8c7a6b]/30 bg-[#fffcf7] shadow-sm"><h3 className="font-bold text-[#3a2f29] mb-2 border-b border-[#8c7a6b]/20 pb-1 text-xs uppercase tracking-widest">{isIrene ? "Irene's Journal" : "Watson's Journal"}</h3><p className="text-sm leading-relaxed text-[#5c4d43]">{endResult.consequenceData.watson_journal}</p></div>}
                {endResult.consequenceData?.holmes_note && <div className="p-4 rounded-lg bg-amber-600/5 border border-amber-700/20 shadow-sm"><h3 className="font-bold text-amber-900 mb-1.5 italic text-xs uppercase tracking-widest">{isMoriarty ? "M.C. Report :" : "Holmes's Note :"}</h3><p className="text-sm leading-relaxed italic text-amber-800/90">{endResult.consequenceData.holmes_note}</p></div>}
              </div>
              <div className="mt-6 text-center pt-4"><p className="text-[10px] text-[#8c7a6b] tracking-widest uppercase mb-1 font-mono">Insight Points Acquired</p><p className="text-4xl font-bold text-amber-600 font-mono drop-shadow-sm">+{endResult.points} pt</p>{isReplay && <p className="text-[9px] text-amber-800/70 mt-1 font-mono tracking-tighter">*再プレイ報酬適用</p>}</div>
              <button onClick={() => ctx.handleEpisodeComplete(episodeId, endResult.rank, tether, endResult.points)} className="w-full mt-6 bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8] font-bold py-3.5 rounded-full tracking-widest transition-transform active:scale-95 shadow-md text-sm">FILE ARCHIVE (記録完了)</button>
            </div>
          </div>
        </div>
      )}

      {isCompleted && !endResult && (
        <div className="absolute inset-0 z-50 bg-[#1a1512]/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-1000 backdrop-blur-md">
          <p className="text-[#f4ebd8] text-lg font-serif tracking-widest mb-10 animate-pulse text-center">―― そして、記録は次へ繋がる。</p>
          <button onClick={() => ctx.handleEpisodeComplete(episodeId, "INTERLUDE", tether, 0)} className="bg-transparent border border-[#8c7a6b] text-[#f4ebd8] hover:bg-[#f4ebd8] hover:text-[#1a1512] font-bold py-3 px-8 rounded-full tracking-widest transition-all duration-300 flex items-center gap-2 active:scale-95">次へ進む <ArrowRight size={20} /></button>
        </div>
      )}
    </div>
  );
}