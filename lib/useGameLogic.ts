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

  // 1. 状態管理（シナリオの進行度とチャットログを完全に分離）
  const [currentBeatId, setCurrentBeatId] = useState<string>(initialSaveData?.currentBeatId || beats[0]?.id || '');
  const [chatHistory, setChatHistory] = useState<ScenarioBeat[]>(initialSaveData?.chatHistory || []);
  const [tether, setTether] = useState<number>(initialSaveData?.tether ?? (scenarioData.meta.tether_start || (isMoriarty ? 100 : 50)));
  
  // 2. ストリーミング専用ステート（「最後の吹き出し」の何文字目まで表示したかだけを管理）
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

  // 現在のシナリオビート（UI判定用）
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

  // ▼ コアロジック：新しい吹き出しを下に追加する関数
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

  // 初期ロード・および次ビートへの進行時の処理
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

    // まだ履歴が空なら最初のビートを追加
    if (chatHistory.length === 0 && beats.length > 0) {
      pushBeatToHistory(beats[0]);
    }
  }, []); // 初回のみ

  // ストリーミングのタイマー処理（現在表示中の最後の吹き出しの文字数を増やす）
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
      setFeedback({ type: 'success', msg: `記録: [${evidence}]` });
      return [...prev, evidence];
    });
  };

  const handleSelectEvidence = (evidence: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    setSelectedEvidence(prev => prev === evidence ? null : evidence);
  };

  const handleInterrupt = (skillName: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    setSelectedSkill(prev => prev === skillName ? null : skillName);
  };

  // ▼ スキル判定ロジック（結果は「新しい吹き出し」として追加）
  const evaluatePanelInterrupt = useCallback((skill: string, evidence: string | null) => {
    if (isResolved || !currentBeat?.interrupt) return;
    setIsResolved(true);
    setSelectedSkill(skill);
    setSelectedEvidence(evidence);

    if (skill === 'TIMEOUT') {
      const failMsg = currentBeat.interrupt.fail_msg || "時間切れ";
      setFeedback({ type: 'fail', msg: `${failMsg}（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_MISS);
      pushBeatToHistory({ id: `sys-timeout-${Date.now()}`, speaker: 'System', text: `【介入失敗 - ${failMsg}】`, type: 'system' }, true);
      return;
    }

    const isSkillMatch = skill === currentBeat.interrupt.required_skill;
    const isEvidenceMatch = currentBeat.interrupt.required_evidence ? evidence === currentBeat.interrupt.required_evidence : true;

    if (isSkillMatch && isEvidenceMatch) {
      setFeedback({ type: 'success', msg: `[${skill}] ${currentBeat.interrupt.success_msg}（${uiLabels.gaugeName} +15）`, isCriticalSuccess: true });
      updateTether(TETHER_REWARD_SUCCESS);
      
      if (currentBeat.interrupt.correction_text) {
        // ▼ 成功時：元のテキストは改竄せず、新しい吹き出しとして追加セリフを流す
        pushBeatToHistory({ id: `corr-${Date.now()}`, speaker: currentBeat.speaker, text: currentBeat.interrupt.correction_text, type: 'normal' });
      }
    } else {
      setFeedback({ type: 'penalty', msg: `[${skill}] そのアプローチでは状況を打開できない。（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_FAIL);
      pushBeatToHistory({ id: `sys-fail-${Date.now()}`, speaker: 'System', text: `【介入失敗 - 選択したアプローチ[${skill}]は棄却されました】`, type: 'system' }, true);
    }
  }, [currentBeat, isResolved, updateTether, uiLabels.gaugeName, pushBeatToHistory]);

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

    if (!isResolved && !isInterlude) {
      if (currentBeat?.interrupt) {
        evaluatePanelInterrupt('TIMEOUT', null);
        return;
      } else if (selectedSkill) {
        setIsResolved(true);
        setFeedback({ type: 'penalty', msg: `不要な干渉だ。（${uiLabels.gaugeName} -5）` });
        updateTether(TETHER_PENALTY_WASTE);
        return;
      }
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

  // ▼ GameView側でのエラー回避のため、ダミーとして displayedText を返す（UI側で履歴から算出するため実質不使用）
  const displayedText = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].text.substring(0, streamedLength) : '';

  return {
    currentBeat,
    displayedText,
    isStreaming,
    streamedLength, // UI表示用にエクスポート
    tether,
    feedback,
    handleInterrupt,
    evaluatePanelInterrupt,
    nextBeat,
    handleChoice,
    skipStream,
    chatHistory,
    collectedEvidence,
    selectedEvidence,
    collectEvidence,
    handleSelectEvidence,
    selectedSkill,
    isCompleted,
    endResult,
    isMoriarty,
    isIrene,
    uiLabels, 
  };
}