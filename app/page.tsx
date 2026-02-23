'use client';

import React, { useEffect, useState } from 'react';
import TitleView from '@/components/TitleView';
import GameView from '@/components/GameView';
import ArchiveView from '@/components/ArchiveView';

import glossaryData from '@/data/glossary.json';

type ClearedData = {
  [epId: string]: { rank: string; tether: number };
};

export default function GamePage() {
  const [view, setView] = useState<'title' | 'game' | 'archive'>('title');
  const [hasSaveData, setHasSaveData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>('#01');

  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [readTerms, setReadTerms] = useState<string[]>([]);
  const [insightPoints, setInsightPoints] = useState<number>(0);
  const [clearedData, setClearedData] = useState<ClearedData>({});

  const [unlockedTruths, setUnlockedTruths] = useState<Record<string, any>>({});
  
  const [currentSeason, setCurrentSeason] = useState<number>(1);

  useEffect(() => {
    const save = localStorage.getItem('tether_save_data');
    if (save) setHasSaveData(true);

    const terms = localStorage.getItem('tether_unlocked_terms');
    if (terms) setUnlockedTerms(JSON.parse(terms));

    const read = localStorage.getItem('tether_read_terms');
    if (read) setReadTerms(JSON.parse(read));

    const points = localStorage.getItem('tether_insight_points');
    if (points) setInsightPoints(parseInt(points, 10));

    const cleared = localStorage.getItem('tether_cleared_data');
    if (cleared) setClearedData(JSON.parse(cleared));

    const truths = localStorage.getItem('tether_unlocked_truths');
    if (truths) setUnlockedTruths(JSON.parse(truths));

    const season = localStorage.getItem('tether_current_season');
    if (season) setCurrentSeason(parseInt(season, 10));

    setIsInitialized(true);
  }, []);

  const handleStartConnection = () => {
    if (hasSaveData) {
      setView('archive');
    } else {
      localStorage.setItem('tether_save_data', 'true');
      localStorage.setItem('tether_insight_points', '5');
      localStorage.setItem('tether_current_season', '1');
      setHasSaveData(true);
      setInsightPoints(5);
      setCurrentSeason(1);
      setCurrentEpisodeId('#01');
      setView('game');
    }
  };

  const handleResetData = () => {
    if (
      window.confirm('すべての進捗データと大索引の記録をリセットしますか？')
    ) {
      localStorage.removeItem('tether_save_data');
      localStorage.removeItem('tether_unlocked_terms');
      localStorage.removeItem('tether_read_terms');
      localStorage.removeItem('tether_insight_points');
      localStorage.removeItem('tether_cleared_data');
      localStorage.removeItem('tether_unlocked_truths');
      localStorage.removeItem('tether_current_season');
      
      setHasSaveData(false);
      setUnlockedTerms([]);
      setReadTerms([]);
      setInsightPoints(0);
      setClearedData({});
      setUnlockedTruths({});
      setCurrentSeason(1);
      setCurrentEpisodeId('#01');
    }
  };

  const handleEpisodeComplete = (
    epId: string,
    rank: string,
    tether: number,
    points: number
  ) => {
    const isAlreadyCleared = !!clearedData[epId];
    const newData = { ...clearedData, [epId]: { rank, tether } };

    setClearedData(newData);
    localStorage.setItem('tether_cleared_data', JSON.stringify(newData));

    if (!isAlreadyCleared) {
      const newPoints = insightPoints + points;
      setInsightPoints(newPoints);
      localStorage.setItem('tether_insight_points', newPoints.toString());
    }

    if (epId === '#13' && !isAlreadyCleared) {
      setCurrentEpisodeId('interlude_s1');
      setView('game');
      return; 
    }

    if (epId === 'interlude_s1' && !isAlreadyCleared) {
      const masterTruth = {
        node_title: "ジェームズ・モリアーティ教授",
        hidden_note: "【犯罪界のナポレオン】ロンドンの地下を支配する巨大な蜘蛛の巣の中心。彼は自らの手を汚さず、冷徹な計算によって完全な犯罪システムを構築している。Season 2へ続く――。",
        reward_points: 0
      };
      const newTruths = { ...unlockedTruths, "pin_s1_master": masterTruth };
      setUnlockedTruths(newTruths);
      localStorage.setItem('tether_unlocked_truths', JSON.stringify(newTruths));

      setCurrentSeason(2);
      localStorage.setItem('tether_current_season', '2');
    }

    setView('archive');
  };

  const handleResearch = () => {
    // ▼ 修正: S1- という強制プレフィックスを廃止し、そのままのIDで判定
    const clearedEpIds = Object.keys(clearedData); 
    const availableTerms = glossaryData.terms.filter(
      (t) =>
        !unlockedTerms.includes(t.id) &&
        (t.appearance === 'general' || clearedEpIds.includes(t.appearance))
    );

    if (insightPoints > 0 && availableTerms.length > 0) {
      const randomTerm =
        availableTerms[Math.floor(Math.random() * availableTerms.length)];
      const newUnlocked = [...unlockedTerms, randomTerm.id];
      setUnlockedTerms(newUnlocked);
      localStorage.setItem(
        'tether_unlocked_terms',
        JSON.stringify(newUnlocked)
      );

      const newPoints = insightPoints - 1;
      setInsightPoints(newPoints);
      localStorage.setItem('tether_insight_points', newPoints.toString());
    } else if (availableTerms.length === 0) {
      alert(
        '現時点で解読可能なデータはすべて復元済みです。新たな事件を解決してください。'
      );
    }
  };

  const handleReadTerm = (termId: string) => {
    if (!readTerms.includes(termId)) {
      const newRead = [...readTerms, termId];
      setReadTerms(newRead);
      localStorage.setItem('tether_read_terms', JSON.stringify(newRead));
    }
  };

  const handleUnlockTruth = (
    pinId: string,
    truthData: any,
    linkCost: number
  ) => {
    const newTruths = { ...unlockedTruths, [pinId]: truthData };
    setUnlockedTruths(newTruths);
    localStorage.setItem('tether_unlocked_truths', JSON.stringify(newTruths));

    const newPoints = insightPoints - linkCost + (truthData.reward_points || 0);
    setInsightPoints(newPoints);
    localStorage.setItem('tether_insight_points', newPoints.toString());
  };

  const handleLinkFail = (linkCost: number) => {
    const newPoints = Math.max(0, insightPoints - linkCost);
    setInsightPoints(newPoints);
    localStorage.setItem('tether_insight_points', newPoints.toString());
  };

  if (!isInitialized) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 font-sans flex flex-col items-center justify-center sm:p-4 overflow-hidden">
      {view === 'title' && (
        <TitleView
          hasSaveData={hasSaveData}
          onStart={handleStartConnection}
          onReset={handleResetData}
        />
      )}

      {view === 'game' && (
        <GameView
          key={currentEpisodeId}
          episodeId={currentEpisodeId}
          onBack={() => setView('archive')}
          unlockedTerms={unlockedTerms}
          setUnlockedTerms={(terms) => {
            setUnlockedTerms(terms);
            localStorage.setItem(
              'tether_unlocked_terms',
              JSON.stringify(terms)
            );
          }}
          onEpisodeComplete={handleEpisodeComplete}
        />
      )}

      {view === 'archive' && (
        <ArchiveView
          currentSeason={currentSeason}
          unlockedTerms={unlockedTerms}
          readTerms={readTerms}
          insightPoints={insightPoints}
          clearedData={clearedData}
          unlockedTruths={unlockedTruths}
          onReturnTitle={() => setView('title')}
          onReturnGame={() => setView('game')}
          onPlayEpisode={(epId) => {
            setCurrentEpisodeId(epId);
            setView('game');
          }}
          onResearch={handleResearch}
          onReadTerm={handleReadTerm}
          onUnlockTruth={handleUnlockTruth}
          onLinkFail={handleLinkFail}
        />
      )}
    </div>
  );
}