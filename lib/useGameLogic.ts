import { useState, useRef, useCallback, useEffect } from 'react';

export type ScenarioBeat = {
  id: string;
  speaker: string;
  text: string;
  type: string;
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
    type?: string; 
    protagonist?: string; 
  };
  consequence?: { 
    official_record: string;
    watson_journal: {
      sympathetic?: string;
      lucid?: string;
      abyss?: string;
    };
    holmes_note: string;
  };
  beats: ScenarioBeat[];
};

const TETHER_REWARD_SUCCESS = 15;
const TETHER_PENALTY_FAIL = -15;
const TETHER_PENALTY_MISS = -15;
const TETHER_PENALTY_WASTE = -5;

// ▼ 引数に playMode を追加
export function useGameLogic(
  scenarioData: ScenarioData, 
  isReplay: boolean = false,
  playMode: 'holmes' | 'moriarty' = 'holmes'
) {
  const protagonist = scenarioData.meta.protagonist || 'watson';
  const isIrene = protagonist === 'irene';
  const isMoriarty = playMode === 'moriarty'; // ← モリアーティモード判定

  const initialTether = scenarioData.meta.tether_start || (isMoriarty ? 100 : 50); // M.C.は初期100%
  const beats = scenarioData.beats;

  const [beatIndex, setBeatIndex] = useState(0);
  const [tether, setTether] = useState(initialTether);
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'fail' | 'penalty';
    msg: string;
  } | null>(null);

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [collectedEvidence, setCollectedEvidence] = useState<string[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  const [isCompleted, setIsCompleted] = useState(false);
  const [endResult, setEndResult] = useState<{
    rank: string;
    official_record: string;
    watson_journal: string;
    holmes_note: string;
    points: number;
  } | null>(null);

  const textStreamRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextIndex = useRef(0);
  const tetherRef = useRef(initialTether);

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

  const currentBeat = beats[beatIndex];

  const startBeat = useCallback(() => {
    if (!currentBeat) return;
    setDisplayedText('');
    setFeedback(null);
    setSelectedSkill(null);
    setSelectedEvidence(null);
    setIsResolved(false);
    currentTextIndex.current = 0;

    if (textStreamRef.current) clearTimeout(textStreamRef.current);

    if (
      currentBeat.speaker === 'System' ||
      currentBeat.type === 'instruction'
    ) {
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
      setFeedback({
        type: 'success',
        msg: `手帳に記録: [${evidence}]`,
      });
      return [...prev, evidence];
    });
  };

  const handleSelectEvidence = (evidence: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;
    setSelectedEvidence((prev) => {
      const newEv = prev === evidence ? null : evidence;
      if (selectedSkill) {
        if (!newEv) {
          setFeedback({
            type: 'penalty',
            msg: isMoriarty
              ? `[${selectedSkill}] 視点を選択中。計画の欠陥を突くには【証拠】もセットしろ。`
              : isIrene
              ? `[${selectedSkill}] 視点を選択中。相手の慢心を突く（COUNTER）には、それを証明する【証拠】もセットしなさい。`
              : `[${selectedSkill}] 視点を選択中。天才の暴走を繋ぎ止める（TETHER）には、主張を裏付ける【証拠】もセットしろ。`,
          });
        } else {
          setFeedback({
            type: 'success',
            msg: isMoriarty
              ? `[${selectedSkill}] 視点と証拠 [${newEv}] を提示する準備完了。右下の「REWRITE EQUATION」を押せ。`
              : isIrene
              ? `[${selectedSkill}] 視点と証拠 [${newEv}] を提示する準備完了。右下の「COUNTER」を押してちょうだい。`
              : `[${selectedSkill}] 視点と証拠 [${newEv}] を提示する準備完了。右下の「TETHER THE GENIUS」を押せ。`,
          });
        }
      } else {
        if (newEv) {
          setFeedback({
            type: 'success',
            msg: `証拠 [${newEv}] をセットした。`,
          });
        } else {
          setFeedback(null);
        }
      }
      return newEv;
    });
  };

  const handleInterrupt = (skillName: string) => {
    if (isResolved || currentBeat?.speaker === 'System' || isStreaming) return;

    if (selectedSkill === skillName) {
      setSelectedSkill(null);
      if (selectedEvidence) {
        setFeedback({
          type: 'success',
          msg: `証拠 [${selectedEvidence}] をセットした。`,
        });
      } else {
        setFeedback(null);
      }
      return;
    }

    setSelectedSkill(skillName);

    if (!selectedEvidence) {
      setFeedback({
        type: 'penalty',
        msg: isMoriarty
          ? `[${skillName}] 視点を選択中。計画の欠陥を突くには確たる【証拠】が必要だ。`
          : isIrene
          ? `[${skillName}] 視点を選択中。しかし、反撃（COUNTER）には、確たる【証拠】のセットが必要よ。`
          : `[${skillName}] 視点を選択中。しかし、天才の暴走を繋ぎ止める（TETHER）には、確たる【証拠】のセットが必要だ。`,
      });
    } else {
      setFeedback({
        type: 'success',
        msg: isMoriarty
          ? `[${skillName}] 視点と証拠 [${selectedEvidence}] を提示する準備完了。右下の「REWRITE EQUATION」を押せ。`
          : isIrene
          ? `[${skillName}] 視点と証拠 [${selectedEvidence}] を提示する準備完了。右下の「COUNTER」を押してちょうだい。`
          : `[${skillName}] 視点と証拠 [${selectedEvidence}] を提示する準備完了。右下の「TETHER THE GENIUS」を押せ。`,
      });
    }
  };

  const evaluatePanelInterrupt = useCallback(
    (skill: string, evidence: string | null) => {
      if (isResolved || !currentBeat?.interrupt) return;

      setIsResolved(true);
      setSelectedSkill(skill);
      setSelectedEvidence(evidence);

      if (skill === 'TIMEOUT') {
        setFeedback({
          type: 'fail',
          msg: `${currentBeat.interrupt.fail_msg}（${isMoriarty ? 'DOMINATION' : 'TETHER'} -15）`,
        });
        updateTether(TETHER_PENALTY_MISS);
        return;
      }

      const isSkillMatch = skill === currentBeat.interrupt.required_skill;
      const isEvidenceMatch = currentBeat.interrupt.required_evidence
        ? evidence === currentBeat.interrupt.required_evidence
        : true;

      if (isSkillMatch && isEvidenceMatch) {
        setFeedback({
          type: 'success',
          msg: `[${skill}] ${currentBeat.interrupt.success_msg}（${isMoriarty ? 'DOMINATION' : 'TETHER'} +15）`,
        });
        updateTether(TETHER_REWARD_SUCCESS);

        if (currentBeat.interrupt.correction_text) {
          setIsStreaming(true);
          const correctionText = '\n\n' + currentBeat.interrupt.correction_text;
          let correctionIndex = 0;
          const streamCorrection = () => {
            if (correctionIndex >= correctionText.length) {
              setIsStreaming(false);
              return;
            }
            setDisplayedText((prev) => prev + correctionText[correctionIndex]);
            correctionIndex++;
            textStreamRef.current = setTimeout(
              streamCorrection,
              getTextSpeed()
            );
          };
          textStreamRef.current = setTimeout(streamCorrection, getTextSpeed());
        }
      } else {
        setFeedback({
          type: 'penalty',
          msg: isMoriarty
            ? `[${skill}] 考え直せ。お前の計画には隙がある。（DOMINATION -15）`
            : isIrene
            ? `[${skill}] その程度の機転じゃ、この窮地は抜け出せないわ。（TETHER -15）`
            : `[${skill}] その証拠では天才の暴走を繋ぎ止められないぞ、ワトスン。（TETHER -15）`,
        });
        updateTether(TETHER_PENALTY_FAIL);
      }
    },
    [currentBeat, isResolved, getTextSpeed, updateTether, isIrene, isMoriarty]
  );

  const nextBeat = () => {
    if (isStreaming) {
      skipStream();
      return;
    }

    if (!isResolved) {
      if (currentBeat.interrupt) {
        setIsResolved(true);
        const isSkillMatch =
          selectedSkill === currentBeat.interrupt.required_skill;
        const isEvidenceMatch = currentBeat.interrupt.required_evidence
          ? selectedEvidence === currentBeat.interrupt.required_evidence
          : true;

        if (isSkillMatch && isEvidenceMatch) {
          setFeedback({
            type: 'success',
            msg: `[${selectedSkill}] ${currentBeat.interrupt.success_msg}（${isMoriarty ? 'DOMINATION' : 'TETHER'} +15）`,
          });
          updateTether(TETHER_REWARD_SUCCESS);
          if (currentBeat.interrupt.correction_text) {
            setIsStreaming(true);
            const correctionText =
              '\n\n' + currentBeat.interrupt.correction_text;
            let correctionIndex = 0;
            const streamCorrection = () => {
              if (correctionIndex >= correctionText.length) {
                setIsStreaming(false);
                return;
              }
              setDisplayedText(
                (prev) => prev + correctionText[correctionIndex]
              );
              correctionIndex++;
              textStreamRef.current = setTimeout(
                streamCorrection,
                getTextSpeed()
              );
            };
            textStreamRef.current = setTimeout(
              streamCorrection,
              getTextSpeed()
            );
          }
        } else if (selectedSkill) {
          setFeedback({
            type: 'penalty',
            msg: isMoriarty
              ? `考え直せ。お前の計画には隙がある。（DOMINATION -15）`
              : isIrene
              ? `その程度の機転じゃ、この窮地は抜け出せないわ。（TETHER -15）`
              : `その証拠では天才の暴走を繋ぎ止められないぞ、ワトスン。（TETHER -15）`,
          });
          updateTether(TETHER_PENALTY_FAIL);
        } else {
          setFeedback({
            type: 'fail',
            msg: `${currentBeat.interrupt.fail_msg}（${isMoriarty ? 'DOMINATION' : 'TETHER'} -15）`,
          });
          updateTether(TETHER_PENALTY_MISS);
        }
        return;
      } else if (selectedSkill) {
        setIsResolved(true);
        setFeedback({
          type: 'penalty',
          msg: isMoriarty
            ? `無駄な思考だ。黙っていろ。（DOMINATION -5）`
            : isIrene
            ? `つまらない手出しは無用よ。（TETHER -5）`
            : `邪魔をするな、ワトスン。思考の途中だ。（TETHER -5）`,
        });
        updateTether(TETHER_PENALTY_WASTE);
        return;
      }
    }

    if (beatIndex < beats.length - 1) {
      setBeatIndex((prev) => prev + 1);
    } else {
      if (scenarioData.meta.type === 'cutscene') {
        setEndResult(null); 
        setIsCompleted(true);
        return;
      }

      let rank = 'ABYSS';
      let watson_journal = '';
      let basePoints = 1;

      // ▼ M.C.モード用のランク判定
      if (isMoriarty) {
        if (tether >= 80) {
          rank = 'MASTERPIECE';
          basePoints = 5;
        } else if (tether >= 40) {
          rank = 'COMPROMISED';
          basePoints = 3;
        } else {
          rank = 'FAILED';
        }
      } else {
        if (tether >= 80) {
          rank = 'SYMPATHETIC';
          watson_journal = scenarioData.consequence?.watson_journal?.sympathetic || '';
          basePoints = 5; 
        } else if (tether >= 40) {
          rank = 'LUCID';
          watson_journal = scenarioData.consequence?.watson_journal?.lucid || '';
          basePoints = 3;
        } else {
          watson_journal = scenarioData.consequence?.watson_journal?.abyss || '';
        }
      }

      const finalPoints = isReplay ? 1 : basePoints;

      setEndResult({
        rank,
        official_record: scenarioData.consequence?.official_record || '',
        watson_journal,
        holmes_note: scenarioData.consequence?.holmes_note || '',
        points: finalPoints,
      });
      setIsCompleted(true);
    }
  };

  useEffect(() => {
    startBeat();
    return () => {
      if (textStreamRef.current) clearTimeout(textStreamRef.current);
    };
  }, [beatIndex, startBeat]);

  return {
    currentBeat,
    displayedText,
    isStreaming,
    tether,
    feedback,
    handleInterrupt,
    evaluatePanelInterrupt,
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
    isMoriarty, // 状態をUI側へ渡す
  };
}