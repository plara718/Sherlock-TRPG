'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type ScenarioBeat = {
  id: string;
  speaker: string;
  text: string;
  type: string;
  next_beat_id?: string;
  choices?: { label: string; next_beat_id: string }[];
  interrupt?: {
    required_skill?: string;
    required_evidence?: string;
    trigger_keyword?: string; // 新形式
    success_msg?: string;     // 新形式
    fail_msg?: string;        // 新形式
    correction_text?: string; // 新形式
    hint?: string;
    success?: { msg: string; next_beat_id?: string; isCriticalSuccess?: boolean; }; // 旧形式
    fail?: { msg: string; next_beat_id?: string; }; // 旧形式
    penalty?: { msg: string; next_beat_id?: string; }; // 旧形式
  };
};

export type ScenarioData = {
  meta: {
    episode_id: string;
    title: string;
    tether_start: number;
    world_state: any;
    type?: 'normal' | 'cutscene' | 'interlude';
    protagonist?: string; 
    intervention?: string;
    play_mode?: 'holmes' | 'moriarty'; 
  };
  consequence?: { 
    official_record?: string;
    watson_journal?: { sympathetic?: string; lucid?: string; abyss?: string; } | string;
    holmes_note?: string;
    [key: string]: any; 
  };
  beats: ScenarioBeat[];
};

const TETHER_REWARD_SUCCESS = 15;
const TETHER_PENALTY_FAIL = -15;
const TETHER_PENALTY_MISS = -15;

export function useGameLogic(
  scenarioData: ScenarioData, 
  isReplay: boolean = false,
  userTextSpeed: number = 30,
  initialSaveData: any = null,
  onSaveGame: (data: any) => void = () => {}
) {
  const protagonist = scenarioData.meta.protagonist || 'watson';
  const isIrene = protagonist === 'irene';
  const isMoriarty = scenarioData.meta.play_mode === 'moriarty';
  const isInterlude = scenarioData.meta.type === 'interlude';
  const beats = scenarioData.beats;

  const uiLabels = {
    gaugeName: isMoriarty ? 'DOMINATION' : (isIrene ? 'CONTROL' : 'TETHER'),
    actionButton: isMoriarty ? 'REWRITE EQUATION' : (isIrene ? 'COUNTER' : 'TETHER THE GENIUS'),
  };

  const [currentBeatId, setCurrentBeatId] = useState<string>(initialSaveData?.currentBeatId || beats[0]?.id || '');
  const [chatHistory, setChatHistory] = useState<ScenarioBeat[]>(initialSaveData?.chatHistory || []);
  const [tether, setTether] = useState<number>(initialSaveData?.tether ?? (scenarioData.meta.tether_start || (isMoriarty ? 100 : 50)));
  
  const [streamedLength, setStreamedLength] = useState<number>(initialSaveData?.streamedLength ?? 0);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [collectedEvidence, setCollectedEvidence] = useState<string[]>(initialSaveData?.collectedEvidence || []);
  const [isResolved, setIsResolved] = useState(false);
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'fail' | 'penalty'; msg: string; isCriticalSuccess?: boolean; } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [endResult, setEndResult] = useState<{ rank: string; points: number; consequenceData: any; } | null>(null);

  const tetherRef = useRef(tether);
  const hasLoadedRef = useRef(false);
  const isProcessingActionRef = useRef(false);
  const requestRef = useRef<number>();
  const lastCharTimeRef = useRef<number>(0);
  const waitTimeRef = useRef<number>(0);

  const currentBeatRaw = beats.find(b => b.id === currentBeatId) || beats[0];
  const currentBeat = isResolved && currentBeatRaw 
    ? { ...currentBeatRaw, text: currentBeatRaw.text.replace(/\[<NOISE>\]/g, '').replace(/\[<FLAW>\]/g, '') } 
    : currentBeatRaw;

  const updateTether = useCallback((amount: number) => {
    setTether(prev => {
      const newValue = Math.max(0, Math.min(100, prev + amount));
      tetherRef.current = newValue;
      return newValue;
    });
  }, []);

  const getTextSpeed = useCallback(() => {
    const current = tetherRef.current;
    if (current >= 80) return userTextSpeed;
    if (current >= 40) return userTextSpeed * 1.5;
    return userTextSpeed * 0.5;
  }, [userTextSpeed]);

  const pushBeatToHistory = useCallback((beat: ScenarioBeat, isInstant: boolean = false) => {
    setChatHistory(prev => [...prev, beat]);
    if (isInstant || beat.speaker === 'System' || beat.type === 'instruction') {
      setStreamedLength(beat.text.length);
      setIsStreaming(false);
    } else {
      setStreamedLength(0);
      setIsStreaming(true);
      lastCharTimeRef.current = performance.now();
      waitTimeRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (initialSaveData && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (initialSaveData.chatHistory && initialSaveData.chatHistory.length > 0) {
        setChatHistory(initialSaveData.chatHistory);
        setStreamedLength(initialSaveData.streamedLength ?? initialSaveData.chatHistory[initialSaveData.chatHistory.length - 1].text.length);
        setIsStreaming(false);
        return;
      }
    }
    hasLoadedRef.current = true;
    if (chatHistory.length === 0 && beats.length > 0) {
      pushBeatToHistory(beats[0]);
    }
  }, []);

  const streamText = useCallback((time: number) => {
    if (!isStreaming || chatHistory.length === 0) return;
    
    const lastBeat = chatHistory[chatHistory.length - 1];
    const fullText = lastBeat.text;

    setStreamedLength((prev) => {
      if (prev >= fullText.length) {
        setIsStreaming(false);
        return fullText.length;
      }

      const timePassed = time - lastCharTimeRef.current;
      
      if (waitTimeRef.current > 0) {
        if (timePassed < waitTimeRef.current) return prev;
        waitTimeRef.current = 0;
        lastCharTimeRef.current = time;
      } else if (timePassed > getTextSpeed()) {
        const nextLength = prev + 1;
        const charAdded = fullText.substring(prev, nextLength);
        
        if (['、', '。', '…', '！', '？'].includes(charAdded)) {
          waitTimeRef.current = 150;
        }
        
        lastCharTimeRef.current = time;
        return nextLength;
      }
      return prev;
    });

    requestRef.current = requestAnimationFrame(streamText);
  }, [isStreaming, chatHistory, getTextSpeed]);

  useEffect(() => {
    if (isStreaming) {
      requestRef.current = requestAnimationFrame(streamText);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isStreaming, streamText]);

  const skipStream = useCallback(() => {
    if (!isStreaming || chatHistory.length === 0) return;
    const lastBeat = chatHistory[chatHistory.length - 1];
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setStreamedLength(lastBeat.text.length);
    setIsStreaming(false);
    isProcessingActionRef.current = false;
  }, [isStreaming, chatHistory]);

  const collectEvidence = (evidence: string) => {
    setCollectedEvidence(prev => prev.includes(evidence) ? prev : [...prev, evidence]);
  };

  const handleSelectEvidence = (evidence: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    setSelectedEvidence(prev => prev === evidence ? null : evidence);
  };

  const evaluatePanelInterrupt = useCallback((skill: string, evidence: string | null) => {
    if (tether <= 0 || isResolved || !currentBeat?.interrupt) return;

    // ▼ 修正箇所：旧JSON（ホームズ編）と新JSON（モリアーティ編）の自動判別
    const intr = currentBeat.interrupt as any;
    const isOldFormat = 'success' in intr;

    const speakerName = protagonist === 'watson' ? 'Watson' : protagonist === 'irene' ? 'Irene' : 'Holmes';

    // タイムアウト時の処理
    if (skill === 'TIMEOUT') {
      const failMsg = intr.fail_msg || (isOldFormat ? intr.penalty?.msg : null) || "（時間切れだ。動くことができなかった……）";
      setFeedback({ type: 'fail', msg: `TIME OUT\n（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_MISS);
      pushBeatToHistory({ id: `fail-${Date.now()}`, speaker: speakerName, text: failMsg, type: 'normal' });
      
      // 旧仕様（ホームズ編）の場合は、失敗したまま強制的にルートを進行させる
      if (isOldFormat) setIsResolved(true);
      return;
    }

    const isSkillMatch = skill === intr.required_skill;
    const isEvidenceMatch = intr.required_evidence ? evidence === intr.required_evidence : true;

    if (isSkillMatch && isEvidenceMatch) {
      setIsResolved(true);
      setFeedback({ type: 'success', msg: `INTERRUPT SUCCESS\n（${uiLabels.gaugeName} +15）`, isCriticalSuccess: isOldFormat ? intr.success?.isCriticalSuccess : true });
      updateTether(TETHER_REWARD_SUCCESS);
      
      const newBeats: ScenarioBeat[] = [];
      const successMsg = intr.success_msg || (isOldFormat ? intr.success?.msg : null);
      if (successMsg) {
        newBeats.push({ id: `succ-${Date.now()}`, speaker: speakerName, text: successMsg, type: 'normal' });
      }
      if (intr.correction_text) {
        newBeats.push({ id: `corr-${Date.now()}`, speaker: currentBeat.speaker, text: intr.correction_text, type: 'normal' });
      }
      if (newBeats.length > 0) {
        setChatHistory(prev => [...prev, ...newBeats]);
        setStreamedLength(0);
        setIsStreaming(true);
      }
    } else {
      setFeedback({ type: 'penalty', msg: `INTERRUPT FAILED\n（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_FAIL);
      const failMsg = intr.fail_msg || (isOldFormat ? intr.fail?.msg : null) || `（選択したアプローチ [${skill}] は間違っていたようだ……）`;
      pushBeatToHistory({ id: `fail-${Date.now()}`, speaker: speakerName, text: failMsg, type: 'normal' });
      
      // 旧仕様（ホームズ編）の場合は、失敗したまま強制的に失敗ルートへ進行させる
      if (isOldFormat) setIsResolved(true);
    }
  }, [currentBeat, isResolved, tether, updateTether, uiLabels.gaugeName, protagonist, pushBeatToHistory]);

  const handleChoice = (nextId: string) => {
    if (tether <= 0 || isStreaming || isProcessingActionRef.current) return;
    isProcessingActionRef.current = true;
    
    setCurrentBeatId(nextId);
    const nextB = beats.find(b => b.id === nextId);
    if (nextB) {
      setIsResolved(false);
      setSelectedSkill(null);
      setSelectedEvidence(null);
      pushBeatToHistory(nextB);
    }
    setTimeout(() => { isProcessingActionRef.current = false; }, 200);
  };

  const nextBeat = () => {
    if (tether <= 0 || isProcessingActionRef.current) return;

    if (isStreaming) {
      isProcessingActionRef.current = true;
      skipStream(); 
      setTimeout(() => { isProcessingActionRef.current = false; }, 100);
      return; 
    }
    
    if (currentBeat?.choices) return;

    isProcessingActionRef.current = true;

    // ▼ 修正箇所：ルート分岐のアダプター（旧JSONの success.next_beat_id 等を解釈する）
    let nextId: string | null = currentBeat?.next_beat_id || null;
    
    if (currentBeat?.interrupt && 'success' in currentBeat.interrupt) {
      const intr = currentBeat.interrupt as any;
      if (feedback?.type === 'success') {
        nextId = intr.success?.next_beat_id || nextId;
      } else if (feedback?.type === 'penalty' || feedback?.type === 'fail') {
        nextId = (feedback.type === 'fail' ? intr.penalty?.next_beat_id : intr.fail?.next_beat_id) || nextId;
      }
    }

    // 指定先がない場合は配列の次の要素へ
    if (!nextId) {
      const idx = beats.findIndex(b => b.id === currentBeatId);
      if (idx !== -1 && idx < beats.length - 1) {
        nextId = beats[idx + 1].id;
      }
    }

    if (nextId) {
      setCurrentBeatId(nextId);
      const nextB = beats.find(b => b.id === nextId);
      if (nextB) {
        setIsResolved(false);
        setSelectedSkill(null);
        setSelectedEvidence(null);
        pushBeatToHistory(nextB);
      }
    } else {
      if (scenarioData.meta.type === 'cutscene') {
        setEndResult(null); 
        setIsCompleted(true);
      } else if (isInterlude) {
        setEndResult({ rank: 'CLEARED', points: isReplay ? 0 : 1, consequenceData: scenarioData.consequence || {} });
        setIsCompleted(true);
      } else {
        let rank = 'ABYSS';
        let journalText = '';
        let basePoints = 1;

        if (isMoriarty) {
          if (tether >= 80) { rank = 'MASTERPIECE'; basePoints = 5; journalText = typeof scenarioData.consequence?.watson_journal === 'string' ? scenarioData.consequence.watson_journal : ''; } 
          else if (tether >= 40) { rank = 'COMPROMISED'; basePoints = 3; journalText = typeof scenarioData.consequence?.watson_journal === 'string' ? scenarioData.consequence.watson_journal : ''; } 
          else { rank = 'FAILED'; basePoints = 0; journalText = "【SYSTEM ERROR】\n数式の構築に失敗しました。不確定要素（ノイズ）によって因果律が崩壊したため、このシミュレーション記録は破棄されます。"; }
        } else {
          if (tether >= 80) { rank = 'SYMPATHETIC'; journalText = (scenarioData.consequence?.watson_journal as any)?.sympathetic || ''; basePoints = 5; } 
          else if (tether >= 40) { rank = 'LUCID'; journalText = (scenarioData.consequence?.watson_journal as any)?.lucid || ''; basePoints = 3; } 
          else { rank = 'ABYSS'; basePoints = 0; journalText = (scenarioData.consequence?.watson_journal as any)?.abyss || "真相は闇の中へ消えた。我々は決定的な過ちを犯してしまったようだ……。"; }
        }
        
        const finalPoints = (rank === 'FAILED' || rank === 'ABYSS') ? 0 : (isReplay ? 1 : basePoints);
        setEndResult({ rank, points: finalPoints, consequenceData: { ...scenarioData.consequence, watson_journal: journalText } });
        setIsCompleted(true);
      }
    }
    
    setTimeout(() => { isProcessingActionRef.current = false; }, 150);
  };

  useEffect(() => {
    if (tether <= 0 && !isCompleted && !isInterlude && scenarioData.meta.type !== 'cutscene') {
      const timer = setTimeout(() => {
        let rank = isMoriarty ? 'FAILED' : 'ABYSS';
        let journalText = isMoriarty
          ? "【SYSTEM ERROR】\n数式の構築に致命的な矛盾が生じました。不確定要素（ノイズ）により盤面が崩壊したため、シミュレーションを強制終了します。"
          : ((scenarioData.consequence?.watson_journal as any)?.abyss || "調査は行き詰まった。致命的なミスにより、これ以上真相に近づくことはできない……。");
        setEndResult({ rank, points: 0, consequenceData: { ...scenarioData.consequence, watson_journal: journalText } });
        setIsCompleted(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [tether, isCompleted, isInterlude, isMoriarty, scenarioData]);

  useEffect(() => {
    if (!isCompleted && currentBeatId && chatHistory.length > 0 && !isStreaming) {
      onSaveGame({
        episodeId: scenarioData.meta.episode_id,
        currentBeatId,
        chatHistory,
        streamedLength,
        tether,
        collectedEvidence
      });
    }
  }, [currentBeatId, chatHistory.length, tether, collectedEvidence.length, isCompleted, isStreaming, onSaveGame, scenarioData.meta.episode_id]);

  const displayedText = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].text.substring(0, streamedLength) : '';

  return {
    currentBeat, displayedText, isStreaming, streamedLength, tether, feedback,
    evaluatePanelInterrupt, nextBeat, handleChoice, skipStream, chatHistory,
    collectedEvidence, selectedEvidence, collectEvidence, handleSelectEvidence,
    isCompleted, endResult, isMoriarty, isIrene, uiLabels, 
  };
}