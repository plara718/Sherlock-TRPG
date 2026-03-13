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
  // === メタ情報の初期化 ===
  const protagonist = scenarioData.meta.protagonist || 'watson';
  const isIrene = protagonist === 'irene';
  const isMoriarty = scenarioData.meta.play_mode === 'moriarty';
  const isInterlude = scenarioData.meta.type === 'interlude';
  const beats = scenarioData.beats;

  const uiLabels = {
    gaugeName: isMoriarty ? 'DOMINATION' : (isIrene ? 'CONTROL' : 'TETHER'),
    actionButton: isMoriarty ? 'REWRITE EQUATION' : (isIrene ? 'COUNTER' : 'TETHER THE GENIUS'),
  };

  // === 状態管理 (State) ===
  const [currentBeatId, setCurrentBeatId] = useState<string>(initialSaveData?.currentBeatId || beats[0]?.id || '');
  const [chatHistory, setChatHistory] = useState<ScenarioBeat[]>(initialSaveData?.chatHistory || (beats[0] ? [beats[0]] : []));
  const [tether, setTether] = useState<number>(initialSaveData?.tether ?? (scenarioData.meta.tether_start || (isMoriarty ? 100 : 50)));
  
  // テキストストリーミング関連の状態
  const [displayedText, setDisplayedText] = useState<string>(initialSaveData?.displayedText || '');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // プレイヤーのアクション関連の状態
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [collectedEvidence, setCollectedEvidence] = useState<string[]>(initialSaveData?.collectedEvidence || []);
  const [isResolved, setIsResolved] = useState(false);
  
  // 演出・結果関連の状態
  const [feedback, setFeedback] = useState<{ type: 'success' | 'fail' | 'penalty'; msg: string; isCriticalSuccess?: boolean; } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [endResult, setEndResult] = useState<{ rank: string; points: number; consequenceData: any; } | null>(null);

  // === 参照管理 (Refs) - タイマーや即時参照が必要な値 ===
  const textStreamRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextIndex = useRef(0);
  const targetTextRef = useRef<string>('');
  const tetherRef = useRef(tether);
  const isProcessingChoiceRef = useRef(false);
  const hasLoadedRef = useRef(false); 
  
  // ▼ 修正：親からの無限再描画ループを防ぐため、初期データをRefに隔離
  const initialSaveDataRef = useRef(initialSaveData);

  const currentBeatIndex = beats.findIndex(b => b.id === currentBeatId);
  const currentBeat = beats[currentBeatIndex];

  // === ヘルパー関数 ===
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

  const updateLatestHistory = useCallback((fullText: string) => {
    setChatHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length > 0) {
        newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], text: fullText };
      }
      return newHistory;
    });
  }, []);

  // === コア・ストリーミング処理 ===
  const streamNextChar = useCallback(() => {
    if (textStreamRef.current) clearTimeout(textStreamRef.current);

    if (currentTextIndex.current >= targetTextRef.current.length) {
      setIsStreaming(false);
      return;
    }

    setDisplayedText(targetTextRef.current.substring(0, currentTextIndex.current + 1));
    currentTextIndex.current++;
    textStreamRef.current = setTimeout(streamNextChar, getTextSpeed());
  }, [getTextSpeed]);

  const appendTextAndStream = useCallback((additionalText: string) => {
    targetTextRef.current += additionalText;
    updateLatestHistory(targetTextRef.current);
    setIsStreaming(true);
    streamNextChar();
  }, [updateLatestHistory, streamNextChar]);

  const skipStream = useCallback(() => {
    if (!isStreaming) return;
    if (textStreamRef.current) clearTimeout(textStreamRef.current);
    
    setDisplayedText(targetTextRef.current);
    currentTextIndex.current = targetTextRef.current.length;
    setIsStreaming(false);
  }, [isStreaming]);

  // === ビート初期化処理 ===
  const startBeat = useCallback(() => {
    if (!currentBeat) return;
    if (textStreamRef.current) clearTimeout(textStreamRef.current);

    // セーブデータからの復帰時処理（初回のみ）
    if (initialSaveDataRef.current && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (initialSaveDataRef.current.displayedText) {
        targetTextRef.current = initialSaveDataRef.current.displayedText;
        currentTextIndex.current = initialSaveDataRef.current.displayedText.length;
        setDisplayedText(initialSaveDataRef.current.displayedText);
        setIsStreaming(false);
        return;
      }
    }
    hasLoadedRef.current = true;

    // ステートの初期化
    setDisplayedText('');
    setFeedback(null);
    setSelectedSkill(null);
    setSelectedEvidence(null);
    setIsResolved(false);
    
    currentTextIndex.current = 0;
    targetTextRef.current = currentBeat.text;

    // ナレーションや指示文は即時全表示
    if (currentBeat.speaker === 'System' || currentBeat.type === 'instruction') {
      setDisplayedText(currentBeat.text);
      currentTextIndex.current = currentBeat.text.length;
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      streamNextChar();
    }
  }, [currentBeat, streamNextChar]); // ▼ 修正：initialSaveDataを依存配列から除外しループを防止

  // ビートが変わった時に初期化処理を走らせる
  useEffect(() => {
    startBeat();
    return () => { if (textStreamRef.current) clearTimeout(textStreamRef.current); };
  }, [currentBeatId, startBeat]);

  // === プレイヤーアクション処理 ===
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

  // === 割り込み・スキル判定処理 ===
  const evaluatePanelInterrupt = useCallback((skill: string, evidence: string | null) => {
    if (isResolved || !currentBeat?.interrupt) return;
    setIsResolved(true);
    setSelectedSkill(skill);
    setSelectedEvidence(evidence);

    if (skill === 'TIMEOUT') {
      const failMsg = currentBeat.interrupt.fail_msg || "時間切れ";
      setFeedback({ type: 'fail', msg: `${failMsg}（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_MISS);
      appendTextAndStream(`\n\n【System: 介入失敗 - ${failMsg}】`);
      return;
    }

    const isSkillMatch = skill === currentBeat.interrupt.required_skill;
    const isEvidenceMatch = currentBeat.interrupt.required_evidence ? evidence === currentBeat.interrupt.required_evidence : true;

    if (isSkillMatch && isEvidenceMatch) {
      setFeedback({ type: 'success', msg: `[${skill}] ${currentBeat.interrupt.success_msg}（${uiLabels.gaugeName} +15）`, isCriticalSuccess: true });
      updateTether(TETHER_REWARD_SUCCESS);
      
      if (currentBeat.interrupt.correction_text) {
        appendTextAndStream(`\n\n${currentBeat.interrupt.correction_text}`);
      }
    } else {
      setFeedback({ type: 'penalty', msg: `[${skill}] そのアプローチでは状況を打開できない。（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_FAIL);
      appendTextAndStream(`\n\n【System: 介入失敗 - 選択したアプローチ[${skill}]は棄却されました】`);
    }
  }, [currentBeat, isResolved, updateTether, uiLabels.gaugeName, appendTextAndStream]);

  // === 進行処理 ===
  const handleChoice = (nextId: string) => {
    if (isStreaming || isProcessingChoiceRef.current) return;
    
    isProcessingChoiceRef.current = true;
    setCurrentBeatId(nextId);
    const nextB = beats.find(b => b.id === nextId);
    if (nextB) setChatHistory(prev => [...prev, nextB]);

    setTimeout(() => { isProcessingChoiceRef.current = false; }, 300);
  };

  const nextBeat = () => {
    if (isStreaming) { skipStream(); return; }
    if (currentBeat.choices) return;

    if (!isResolved && !isInterlude) {
      if (currentBeat.interrupt) {
        evaluatePanelInterrupt('TIMEOUT', null);
        return;
      } else if (selectedSkill) {
        setIsResolved(true);
        setFeedback({ type: 'penalty', msg: `不要な干渉だ。（${uiLabels.gaugeName} -5）` });
        updateTether(TETHER_PENALTY_WASTE);
        return;
      }
    }

    let nextId: string | null = currentBeat.next_beat_id || null;
    if (!nextId && currentBeatIndex < beats.length - 1) {
      nextId = beats[currentBeatIndex + 1].id;
    }

    if (nextId) {
      setCurrentBeatId(nextId);
      const nextB = beats.find(b => b.id === nextId);
      if (nextB) setChatHistory(prev => [...prev, nextB]);
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

  // === オートセーブ処理 ===
  useEffect(() => {
    if (!isCompleted && currentBeatId && chatHistory.length > 0 && !isStreaming) {
      onSaveGame({
        episodeId: scenarioData.meta.episode_id,
        currentBeatId,
        chatHistory,
        tether,
        displayedText,
        collectedEvidence
      });
    }
  }, [currentBeatId, chatHistory.length, tether, collectedEvidence.length, isCompleted, isStreaming, onSaveGame, scenarioData.meta.episode_id, displayedText]);

  return {
    currentBeat,
    displayedText,
    isStreaming,
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