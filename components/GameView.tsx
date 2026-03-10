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
  const lastActionTimeRef = useRef<number>(0);

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
          <span key={i} className={`font-bold px-1 rounded transition-colors duration-500 ${isCollected ? 'text-amber-600 bg-amber-100' : isMoriarty ? 'text-fuchsia-200 bg-fuchsia-900/50' : 'text-[#8c7a6b] bg-[#e6d5c3]'} ${wigginsStyle}`}>
            {word}
          </span>
        );
      } else {
        let subParts = part.split(/(\[\[.*?\]\])/g);
        subParts.forEach((subPart, j) => {
          if (subPart.startsWith('[[') && subPart.endsWith(']]')) {
            const word = subPart.slice(2, -2);
            const term = glossaryData.terms.find(t => t.ja === word || (t.trigger_word && word.includes(t.trigger_word)));
            if (term && (term.appearance === 'general' || ctx.clearedData[term.appearance] || term.appearance.startsWith('SP-') || term.appearance === episodeId)) {
              const isUnlocked = ctx.unlockedTerms.includes(term.id);
              elements.push(
                <span key={`${i}-${j}`} onClick={() => handleGlossaryClick(term)} className={`cursor-pointer underline decoration-dotted underline-offset-4 transition-colors ${isUnlocked ? 'text-[#3a2f29] decoration-[#3a2f29] hover:bg-[#e6d5c3]' : 'text-blue-600 decoration-blue-400 hover:bg-blue-50'} rounded px-0.5`}>
                  {word}
                </span>
              );
            } else {
              elements.push(<span key={`${i}-${j}`}>{word}</span>);
            }
          } else {
            elements.push(<span key={`${i}-${j}`}>{subPart}</span>);
          }
        });
      }
    });
    return <>{elements}</>;
  };

  if (isCompleted && endResult) {
    if (endResult.rank === 'CLEARED' || endResult.rank === 'ABYSS') {
      const isS3 = scenarioData.meta.tether_start === 10;
      return <GameEndRoll onComplete={() => ctx.handleEpisodeComplete(episodeId, endResult.rank, tether, endResult.points)} rank={endResult.rank} consequenceData={endResult.consequenceData} isSeason3={isS3} />;
    }
    return (
      <div className={`h-[100dvh] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500 ${isMoriarty ? 'bg-[#1a0f15]' : 'bg-[#fffcf7]'}`}>
        <h2 className={`text-4xl font-black font-serif mb-2 tracking-[0.2em] ${isMoriarty ? 'text-fuchsia-600' : 'text-[#3a2f29]'}`}>
          {endResult.rank}
        </h2>
        <p className={`text-sm font-mono tracking-widest uppercase mb-8 ${isMoriarty ? 'text-fuchsia-800' : 'text-[#8c7a6b]'}`}>Case Closed</p>
        <div className={`p-6 rounded-2xl max-w-sm w-full text-center shadow-inner ${isMoriarty ? 'bg-fuchsia-950/20 border border-fuchsia-900/30' : 'bg-[#f4ebd8] border border-[#8c7a6b]/20'}`}>
          <p className={`text-xs font-bold mb-2 tracking-widest ${isMoriarty ? 'text-fuchsia-500' : 'text-[#8c7a6b]'}`}>Reward</p>
          <p className={`text-2xl font-black font-mono ${isMoriarty ? 'text-white' : 'text-amber-600'}`}>+ {endResult.points} INSIGHT PTS</p>
        </div>
        <button onClick={() => ctx.handleEpisodeComplete(episodeId, endResult.rank, tether, endResult.points)} className={`mt-10 py-3.5 px-12 rounded-full font-bold tracking-widest text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${isMoriarty ? 'bg-fuchsia-800 hover:bg-fuchsia-700 text-white' : 'bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8]'}`}>
          BACK TO ARCHIVE <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] flex flex-col relative transition-colors duration-1000 ${isSanityZero ? 'bg-[#1a0f0f]' : isMoriarty ? 'bg-[#120a10]' : isIrene ? 'bg-[#1a1215]' : 'bg-[#fffcf7]'}`}>
      
      {/* ▼ 画面エフェクト */}
      <div className={`pointer-events-none absolute inset-0 z-40 transition-colors duration-300 ${
        screenEffect === 'glass-shatter' ? 'bg-amber-500/20 mix-blend-overlay' :
        screenEffect === 'flash' ? 'bg-white/30 mix-blend-overlay' :
        screenEffect === 'shake' ? 'bg-rose-500/20 mix-blend-overlay' : 'bg-transparent'
      }`} />
      
      {/* ▼ 新規追加：大迫力のカットイン演出 */}
      {cutin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />
          <div className={`relative px-8 py-6 rounded-2xl border-4 transform -rotate-3 animate-in zoom-in-50 fade-in duration-300 shadow-2xl backdrop-blur-sm flex flex-col items-center text-center max-w-[90%]
            ${cutin.type === 'success' 
              ? 'bg-[#1a2f23]/90 border-emerald-500 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]' 
              : 'bg-[#2f1a1a]/90 border-rose-600 text-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)]'}`}
          >
            <div className={`absolute -top-5 w-10 h-10 rounded-full border-4 flex items-center justify-center bg-[#1a1512]
              ${cutin.type === 'success' ? 'border-emerald-500 text-emerald-500' : 'border-rose-600 text-rose-500'}`}
            >
              {cutin.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-[0.1em] font-mono mt-2 mb-2 uppercase drop-shadow-md">
              {cutin.type === 'success' ? 'SUCCESS' : 'FAILED'}
            </h2>
            
            <div className={`w-full h-px mb-3 ${cutin.type === 'success' ? 'bg-emerald-500/30' : 'bg-rose-600/30'}`} />
            
            <p className="text-sm sm:text-base font-bold font-serif opacity-90 break-words whitespace-pre-wrap leading-relaxed">
              {cutin.msg.replace(/（.+?）/g, '')}
            </p>

            {cutin.isCritical && (
              <div className="absolute -bottom-4 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border-2 border-amber-200 animate-pulse whitespace-nowrap shadow-lg">
                CRITICAL HIT
              </div>
            )}
            
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${cutin.type === 'success' ? 'from-emerald-400/0 via-emerald-400/10 to-emerald-400/0' : 'from-rose-500/0 via-rose-500/10 to-rose-500/0'} transform -skew-x-12 animate-[pulse_1s_infinite] pointer-events-none rounded-xl`} />
          </div>
        </div>
      )}

      {isSanityZero && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#1a0f0f_100%)] z-0" />}

      <header className={`shrink-0 border-b flex items-center justify-between p-3 sm:p-4 z-10 shadow-sm relative ${isSanityZero ? 'bg-rose-950/20 border-rose-900/50' : isMoriarty ? 'bg-[#1a0f15]/80 border-fuchsia-900/30' : isIrene ? 'bg-[#1a0f12]/80 border-rose-900/30' : 'bg-[#f4ebd8]/80 border-[#8c7a6b]/20 backdrop-blur-md'}`}>
        <div className="flex flex-col">
          <span className={`text-[9px] font-mono tracking-widest uppercase ${isSanityZero ? 'text-rose-800' : isMoriarty ? 'text-fuchsia-800' : isIrene ? 'text-rose-800' : 'text-[#8c7a6b]'}`}>Active File</span>
          <h1 className={`text-xs sm:text-sm font-bold font-serif tracking-widest ${isSanityZero ? 'text-rose-700' : isMoriarty ? 'text-fuchsia-600' : isIrene ? 'text-rose-600' : 'text-[#3a2f29]'}`}>
            {scenarioData.meta?.title || 'UNKNOWN RECORD'}
          </h1>
        </div>
        <div className="flex gap-2">
          {isReplay && <span className={`text-[9px] font-bold px-2 py-1 rounded border ${isSanityZero ? 'bg-rose-950 text-rose-700 border-rose-900/50' : isMoriarty ? 'bg-fuchsia-950 text-fuchsia-600 border-fuchsia-900/50' : 'bg-[#e6d5c3] text-[#8c7a6b] border-[#8c7a6b]/30'}`}>REPLAY</span>}
          <button onClick={onBack} className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-widest rounded-full transition-transform active:scale-95 shadow-sm ${isSanityZero ? 'bg-rose-900 hover:bg-rose-800 text-rose-100' : isMoriarty ? 'bg-fuchsia-900 hover:bg-fuchsia-800 text-fuchsia-100' : 'bg-[#e6d5c3] hover:bg-[#d8c8b8] text-[#5c4d43]'}`}>
            ABORT
          </button>
        </div>
      </header>

      <TetherBar tether={tether} onArchiveClick={onBack} protagonist={protagonist} gaugeName={uiLabels.gaugeName} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10" onClick={(e) => {
        if (!isScrollingRef.current && isStreaming && currentBeat?.speaker !== 'System') skipStream();
      }} onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; isScrollingRef.current = false; }} onTouchMove={(e) => { if (!touchStartRef.current) return; const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x); const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y); if (dx > 10 || dy > 10) isScrollingRef.current = true; }}>
        
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 pb-32">
          {chatHistory.map((beat, idx) => {
            const isCurrent = beat.id === currentBeat?.id;
            let cleanText = isCurrent ? displayedText : beat.text;
            
            const evidenceMatch = cleanText.match(/\[EVIDENCE: (.+?)\]/);
            const isMetaNotice = beat.speaker === 'System' || beat.type === 'instruction';

            if (evidenceMatch) {
              const ev = evidenceMatch[1];
              cleanText = cleanText.replace(/\[EVIDENCE: .+?\]/, '');
              
              if (isCurrent && displayedText.includes(`[EVIDENCE: ${ev}]`) && !collectedEvidence.includes(ev)) {
                setTimeout(() => collectEvidence(ev), 10);
              }

              return (
                <div key={idx} className={`space-y-3 ${isSanityZero && isCurrent ? 'animate-[shake_0.5s_infinite]' : ''}`}>
                  <ChatLog speaker={beat.speaker} text={renderText(cleanText)} feedback={isCurrent ? feedback : null} isMetaNotice={isMetaNotice} />
                  <div className={`p-3 rounded-lg border shadow-sm animate-in zoom-in-95 flex items-center gap-3 ${isMoriarty ? 'bg-fuchsia-950/20 border-fuchsia-900/30' : 'bg-[#fffcf7] border-[#8c7a6b]/20'}`}>
                    <FileText className={isMoriarty ? 'text-fuchsia-500' : 'text-amber-600'} size={20} />
                    <div>
                      <p className={`text-[9px] font-mono tracking-widest uppercase ${isMoriarty ? 'text-fuchsia-800' : 'text-[#8c7a6b]'}`}>Evidence Acquired</p>
                      <p className={`font-bold text-sm ${isMoriarty ? 'text-fuchsia-100' : 'text-[#3a2f29]'}`}>{ev}</p>
                    </div>
                  </div>
                </div>
              );
            }

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
            <button onClick={() => setIsWigginsActive(true)} className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg border-2 border-amber-300 rounded-full w-12 h-12 flex items-center justify-center animate-bounce active:scale-95">
              <Eye size={20} />
            </button>
            <div className="absolute -top-6 -right-2 bg-amber-900 text-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500 whitespace-nowrap shadow-md">Wiggins</div>
          </div>
        )}
      </div>

      <div className="shrink-0 z-20 relative">
        {isStreaming ? (
          <div className={`p-3 sm:p-4 text-center cursor-pointer flex justify-center items-center h-[72px] sm:h-[88px] border-t ${isSanityZero ? 'bg-[#1a0f0f]/90 border-rose-900/50' : isMoriarty ? 'bg-[#1a0f15]/90 border-fuchsia-900/30' : 'bg-[#fffcf7]/90 border-[#8c7a6b]/20 backdrop-blur-sm'}`} onClick={skipStream}>
            <div className={`animate-pulse flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase ${isSanityZero ? 'text-rose-600' : isMoriarty ? 'text-fuchsia-600' : 'text-[#8c7a6b]'}`}>
              <Eye size={14} /> Tap to Skip
            </div>
          </div>
        ) : isInterruptMode ? (
          <InterruptPanel collectedEvidences={collectedEvidence} hintText={currentBeat?.interrupt?.hint} interventionType={interventionType} isInterventionAvailable={isInterventionAvailable} interventionUsed={interventionUsed} onUseIntervention={() => setInterventionUsed(true)} onSubmit={(skill, evidence) => { evaluatePanelInterrupt(skill, evidence); setIsInterruptMode(false); }} onTimeUp={() => { handleInterrupt('TIMEOUT'); setIsInterruptMode(false); }} protagonist={protagonist} isMoriarty={isMoriarty} uiLabels={uiLabels} isEvidenceRequired={!!currentBeat?.interrupt?.required_evidence} />
        ) : (
          <Controls isStreaming={isStreaming && currentBeat.speaker !== 'System'} selectedSkill={selectedSkill} onNext={() => { const now = Date.now(); if (now - lastActionTimeRef.current > 300) { nextBeat(); lastActionTimeRef.current = now; } }} onInterrupt={handleInterrupt} />
        )}
      </div>

      {activeGlossary && <GlossaryToast term={activeGlossary.word} desc={activeGlossary.desc} onClose={() => setActiveGlossary(null)} />}
    </div>
  );
}

// （EndRollView の簡易版。もし別途コンポーネントがある場合はそちらを使用）
function GameEndRoll({ onComplete, rank, consequenceData, isSeason3 }: any) {
  return (
    <div className={`h-[100dvh] flex flex-col items-center justify-center p-6 ${isSeason3 ? 'bg-black text-white' : 'bg-[#fffcf7] text-[#3a2f29]'}`}>
      <h2 className="text-3xl font-serif font-bold mb-8">CASE CLOSED: {rank}</h2>
      <button onClick={onComplete} className="px-6 py-3 border rounded-full font-bold tracking-widest">CONTINUE</button>
    </div>
  );
}