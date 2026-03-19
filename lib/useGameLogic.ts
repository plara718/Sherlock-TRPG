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
    trigger_keyword: string;
    success_msg: string;
    fail_msg: string;
    correction_text?: string;
    hint?: string;
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
    watson_journal?: { sympathetic?: string; lucid?: string; abyss?: string; };
    holmes_note?: string;
    [key: string]: any; 
  };
  beats: ScenarioBeat[];
};

const TETHER_REWARD_SUCCESS = 15;
const TETHER_PENALTY_FAIL = -15;
const TETHER_PENALTY_MISS = -15;
const TETHER_PENALTY_WASTE = -5;

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
  const isProcessingChoiceRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const currentBeat = beats.find(b => b.id === currentBeatId) || beats[0];

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

  useEffect(() => {
    if (!isStreaming || chatHistory.length === 0) return;
    
    const lastBeat = chatHistory[chatHistory.length - 1];
    if (streamedLength >= lastBeat.text.length) {
      setIsStreaming(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setStreamedLength(prev => prev + 1);
    }, getTextSpeed());
    
    return () => clearTimeout(timer);
  }, [isStreaming, streamedLength, chatHistory, getTextSpeed]);

  const skipStream = useCallback(() => {
    if (!isStreaming || chatHistory.length === 0) return;
    const lastBeat = chatHistory[chatHistory.length - 1];
    setStreamedLength(lastBeat.text.length);
    setIsStreaming(false);
  }, [isStreaming, chatHistory]);

  const collectEvidence = (evidence: string) => {
    setCollectedEvidence(prev => {
      if (prev.includes(evidence)) return prev;
      return [...prev, evidence];
    });
  };

  const handleSelectEvidence = (evidence: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    setSelectedEvidence(prev => prev === evidence ? null : evidence);
  };

  // ▼ 大改修：割り込み結果を chatHistory に統合する
  const evaluatePanelInterrupt = useCallback((skill: string, evidence: string | null) => {
    if (isResolved || !currentBeat?.interrupt) return;
    setIsResolved(true);
    setSelectedSkill(skill);
    setSelectedEvidence(evidence);

    const speakerName = protagonist === 'watson' ? 'Watson' : protagonist === 'irene' ? 'Irene' : 'Holmes';

    if (skill === 'TIMEOUT') {
      const failMsg = currentBeat.interrupt.fail_msg || "（時間切れだ。動くことができなかった……）";
      setFeedback({ type: 'fail', msg: `TIME OUT\n（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_MISS);
      
      const newBeats: ScenarioBeat[] = [
        { id: `fail-${Date.now()}`, speaker: speakerName, text: failMsg, type: 'normal' }
      ];
      setChatHistory(prev => [...prev, ...newBeats]);
      setStreamedLength(failMsg.length);
      setIsStreaming(false);
      return;
    }

    const isSkillMatch = skill === currentBeat.interrupt.required_skill;
    const isEvidenceMatch = currentBeat.interrupt.required_evidence ? evidence === currentBeat.interrupt.required_evidence : true;

    if (isSkillMatch && isEvidenceMatch) {
      setFeedback({ type: 'success', msg: `INTERRUPT SUCCESS\n（${uiLabels.gaugeName} +15）`, isCriticalSuccess: true });
      updateTether(TETHER_REWARD_SUCCESS);
      
      const newBeats: ScenarioBeat[] = [];
      if (currentBeat.interrupt.success_msg) {
        newBeats.push({ id: `succ-${Date.now()}`, speaker: speakerName, text: currentBeat.interrupt.success_msg, type: 'normal' });
      }
      if (currentBeat.interrupt.correction_text) {
        newBeats.push({ id: `corr-${Date.now()}`, speaker: currentBeat.speaker, text: currentBeat.interrupt.correction_text, type: 'normal' });
      }

      if (newBeats.length > 0) {
        setChatHistory(prev => [...prev, ...newBeats]);
        // correction_text がある場合はそこからストリーミングを開始する
        setStreamedLength(0);
        setIsStreaming(true);
      }
    } else {
      setFeedback({ type: 'penalty', msg: `INTERRUPT FAILED\n（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_FAIL);
      
      const failMsg = currentBeat.interrupt.fail_msg || `（選択したアプローチ [${skill}] は間違っていたようだ……）`;
      const newBeats: ScenarioBeat[] = [
        { id: `fail-${Date.now()}`, speaker: speakerName, text: failMsg, type: 'normal' }
      ];
      setChatHistory(prev => [...prev, ...newBeats]);
      setStreamedLength(failMsg.length);
      setIsStreaming(false);
    }
  }, [currentBeat, isResolved, updateTether, uiLabels.gaugeName, protagonist]);

  const handleChoice = (nextId: string) => {
    if (isStreaming || isProcessingChoiceRef.current) return;
    isProcessingChoiceRef.current = true;
    
    setCurrentBeatId(nextId);
    const nextB = beats.find(b => b.id === nextId);
    if (nextB) {
      setIsResolved(false);
      setSelectedSkill(null);
      setSelectedEvidence(null);
      pushBeatToHistory(nextB);
    }
    setTimeout(() => { isProcessingChoiceRef.current = false; }, 300);
  };

  const nextBeat = () => {
    if (isStreaming) { skipStream(); return; }
    if (currentBeat?.choices) return;

    if (!isResolved && !isInterlude && currentBeat?.interrupt) {
      evaluatePanelInterrupt('TIMEOUT', null);
      return;
    }

    let nextId: string | null = currentBeat?.next_beat_id || null;
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
        return;
      }
      if (isInterlude) {
        setEndResult({ rank: 'CLEARED', points: isReplay ? 0 : 1, consequenceData: scenarioData.consequence || {} });
        setIsCompleted(true);
        return;
      }

      let rank = 'ABYSS';
      let journalText = '';
      let basePoints = 1;

      if (isMoriarty) {
        if (tether >= 80) { rank = 'MASTERPIECE'; basePoints = 5; } 
        else if (tether >= 40) { rank = 'COMPROMISED'; basePoints = 3; } 
        else { rank = 'FAILED'; }
      } else {
        if (tether >= 80) { rank = 'SYMPATHETIC'; journalText = scenarioData.consequence?.watson_journal?.sympathetic || ''; basePoints = 5; } 
        else if (tether >= 40) { rank = 'LUCID'; journalText = scenarioData.consequence?.watson_journal?.lucid || ''; basePoints = 3; } 
        else { journalText = scenarioData.consequence?.watson_journal?.abyss || ''; }
      }

      setEndResult({ rank, points: isReplay ? 1 : basePoints, consequenceData: { ...scenarioData.consequence, watson_journal: journalText } });
      setIsCompleted(true);
    }
  };

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
  }, [currentBeatId, chatHistory.length, tether, collectedEvidence.length, isCompleted, isStreaming, streamedLength, onSaveGame, scenarioData.meta.episode_id]);

  const displayedText = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].text.substring(0, streamedLength) : '';

  return {
    currentBeat,
    displayedText,
    isStreaming,
    streamedLength,
    tether,
    feedback,
    evaluatePanelInterrupt,
    nextBeat,
    handleChoice,
    skipStream,
    chatHistory,
    collectedEvidence,
    selectedEvidence,
    collectEvidence,
    handleSelectEvidence,
    isCompleted,
    endResult,
    isMoriarty,
    isIrene,
    uiLabels, 
  };
}