import { useState, useRef, useCallback, useEffect } from 'react';

// ▼ 新規：choices（選択肢）と next_beat_id（ジャンプ先）を追加
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
  playMode: 'holmes' | 'moriarty' = 'holmes'
) {
  const protagonist = scenarioData.meta.protagonist || 'watson';
  const isIrene = protagonist === 'irene';
  const isMoriarty = playMode === 'moriarty';
  const isInterlude = scenarioData.meta.type === 'interlude';

  const initialTether = scenarioData.meta.tether_start || (isMoriarty ? 100 : 50);
  const beats = scenarioData.beats;

  // ▼ 新規：IDベースの進行管理と、表示済みのチャット履歴を独立して保持
  const [currentBeatId, setCurrentBeatId] = useState<string>(beats[0]?.id || '');
  const [chatHistory, setChatHistory] = useState<ScenarioBeat[]>(beats[0] ? [beats[0]] : []);

  const [tether, setTether] = useState(initialTether);
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'fail' | 'penalty';
    msg: string;
    isCriticalSuccess?: boolean;
  } | null>(null);

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [collectedEvidence, setCollectedEvidence] = useState<string[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  const [isCompleted, setIsCompleted] = useState(false);
  const [endResult, setEndResult] = useState<{ rank: string; points: number; consequenceData: any; } | null>(null);

  const textStreamRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextIndex = useRef(0);
  const tetherRef = useRef(initialTether);

  const uiLabels = {
    gaugeName: isMoriarty ? 'DOMINATION' : (isIrene ? 'CONTROL' : 'TETHER'),
    actionButton: isMoriarty ? 'REWRITE EQUATION' : (isIrene ? 'COUNTER' : 'TETHER THE GENIUS'),
  };

  const updateTether = useCallback((amount: number) => {
    setTether((prev) => {
      const newValue = Math.max(0, Math.min(100, prev + amount));
      tetherRef.current = newValue;
      return newValue;
    });
  }, []);

  const getTextSpeed = useCallback(() => {
    const current = tetherRef.current;
    if (current >= 80) return 30;
    if (current >= 40) return 50;
    return 15;
  }, []);

  const currentBeatIndex = beats.findIndex(b => b.id === currentBeatId);
  const currentBeat = beats[currentBeatIndex];

  const startBeat = useCallback(() => {
    if (!currentBeat) return;
    setDisplayedText('');
    setFeedback(null);
    setSelectedSkill(null);
    setSelectedEvidence(null);
    setIsResolved(false);
    currentTextIndex.current = 0;

    if (textStreamRef.current) clearTimeout(textStreamRef.current);

    if (currentBeat.speaker === 'System' || currentBeat.type === 'instruction') {
      setDisplayedText(currentBeat.text);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);

    const streamNextChar = () => {
      if (currentTextIndex.current >= currentBeat.text.length) {
        setIsStreaming(false);
        return;
      }
      const nextChar = currentBeat.text[currentTextIndex.current];
      setDisplayedText((prev) => prev + nextChar);
      currentTextIndex.current++;
      textStreamRef.current = setTimeout(streamNextChar, getTextSpeed());
    };

    textStreamRef.current = setTimeout(streamNextChar, getTextSpeed());
  }, [currentBeat, getTextSpeed]);

  const skipStream = useCallback(() => {
    if (isStreaming && currentBeat) {
      if (textStreamRef.current) clearTimeout(textStreamRef.current);
      setDisplayedText(currentBeat.text);
      setIsStreaming(false);
    }
  }, [isStreaming, currentBeat]);

  const collectEvidence = (evidence: string) => {
    setCollectedEvidence((prev) => {
      if (prev.includes(evidence)) return prev;
      setFeedback({ type: 'success', msg: `記録: [${evidence}]` });
      return [...prev, evidence];
    });
  };

  const handleSelectEvidence = (evidence: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    setSelectedEvidence((prev) => {
      const newEv = prev === evidence ? null : evidence;
      if (selectedSkill) {
        if (!newEv) setFeedback({ type: 'penalty', msg: `[${selectedSkill}] 視点を選択中。実行には【証拠】もセットしてくれ。` });
        else setFeedback({ type: 'success', msg: `準備完了。右下の「${uiLabels.actionButton}」を押せ。` });
      } else {
        if (newEv) setFeedback({ type: 'success', msg: `証拠 [${newEv}] をセットした。` });
        else setFeedback(null);
      }
      return newEv;
    });
  };

  const handleInterrupt = (skillName: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    if (selectedSkill === skillName) {
      setSelectedSkill(null);
      if (selectedEvidence) setFeedback({ type: 'success', msg: `証拠 [${selectedEvidence}] をセットした。` });
      else setFeedback(null);
      return;
    }
    setSelectedSkill(skillName);
    if (!selectedEvidence) setFeedback({ type: 'penalty', msg: `[${skillName}] 視点を選択中。実行には確たる【証拠】のセットが必要だ。` });
    else setFeedback({ type: 'success', msg: `準備完了。右下の「${uiLabels.actionButton}」を押せ。` });
  };

  const evaluatePanelInterrupt = useCallback((skill: string, evidence: string | null) => {
    if (isResolved || !currentBeat?.interrupt) return;
    setIsResolved(true);
    setSelectedSkill(skill);
    setSelectedEvidence(evidence);

    if (skill === 'TIMEOUT') {
      setFeedback({ type: 'fail', msg: `${currentBeat.interrupt.fail_msg}（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_MISS);
      return;
    }

    const isSkillMatch = skill === currentBeat.interrupt.required_skill;
    const isEvidenceMatch = currentBeat.interrupt.required_evidence ? evidence === currentBeat.interrupt.required_evidence : true;

    if (isSkillMatch && isEvidenceMatch) {
      setFeedback({ type: 'success', msg: `[${skill}] ${currentBeat.interrupt.success_msg}（${uiLabels.gaugeName} +15）`, isCriticalSuccess: true });
      updateTether(TETHER_REWARD_SUCCESS);
      if (currentBeat.interrupt.correction_text) {
        setIsStreaming(true);
        const correctionText = '\n\n' + currentBeat.interrupt.correction_text;
        let correctionIndex = 0;
        const streamCorrection = () => {
          if (correctionIndex >= correctionText.length) { setIsStreaming(false); return; }
          setDisplayedText((prev) => prev + correctionText[correctionIndex]);
          correctionIndex++;
          textStreamRef.current = setTimeout(streamCorrection, getTextSpeed());
        };
        textStreamRef.current = setTimeout(streamCorrection, getTextSpeed());
      }
    } else {
      setFeedback({ type: 'penalty', msg: `[${skill}] そのアプローチでは状況を打開できない。（${uiLabels.gaugeName} -15）` });
      updateTether(TETHER_PENALTY_FAIL);
    }
  }, [currentBeat, isResolved, getTextSpeed, updateTether, uiLabels.gaugeName]);

  // ▼ 新規：選択肢が選ばれたときのジャンプ処理
  const handleChoice = (nextId: string) => {
    if (isStreaming) return;
    setCurrentBeatId(nextId);
    const nextB = beats.find(b => b.id === nextId);
    if (nextB) setChatHistory(prev => [...prev, nextB]);
  };

  const nextBeat = () => {
    if (isStreaming) { skipStream(); return; }
    
    // 選択肢がある場合は画面タップでの進行をブロック
    if (currentBeat.choices) return;

    if (!isResolved && !isInterlude) {
      if (currentBeat.interrupt) {
        setIsResolved(true);
        evaluatePanelInterrupt('TIMEOUT', null);
        return;
      } else if (selectedSkill) {
        setIsResolved(true);
        setFeedback({ type: 'penalty', msg: `不要な干渉だ。（${uiLabels.gaugeName} -5）` });
        updateTether(TETHER_PENALTY_WASTE);
        return;
      }
    }

    // 次に進むべきBeatのIDを決定（next_beat_idがあれば優先）
    let nextId = null;
    if (currentBeat.next_beat_id) {
      nextId = currentBeat.next_beat_id;
    } else if (currentBeatIndex < beats.length - 1) {
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

  useEffect(() => { startBeat(); return () => { if (textStreamRef.current) clearTimeout(textStreamRef.current); }; }, [currentBeatId, startBeat]);

  return {
    currentBeat,
    displayedText,
    isStreaming,
    tether,
    feedback,
    handleInterrupt,
    evaluatePanelInterrupt,
    nextBeat,
    handleChoice,  // ← これがGameViewに渡されます
    skipStream,
    chatHistory,   // ← これがGameViewに渡されます
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