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

  // ▼ 新規追加: 蜘蛛の巣ボードの解放済み「真実ノード」の保存
  const [unlockedTruths, setUnlockedTruths] = useState<Record<string, any>>({});

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

    // ▼ 新規追加: 真実ノードの読み込み
    const truths = localStorage.getItem('tether_unlocked_truths');
    if (truths) setUnlockedTruths(JSON.parse(truths));

    setIsInitialized(true);
  }, []);

  const handleStartConnection = () => {
    if (hasSaveData) {
      setView('archive');
    } else {
      localStorage.setItem('tether_save_data', 'true');
      localStorage.setItem('tether_insight_points', '5');
      setHasSaveData(true);
      setInsightPoints(5);
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
      localStorage.removeItem('tether_unlocked_truths'); // 追加
      setHasSaveData(false);
      setUnlockedTerms([]);
      setReadTerms([]);
      setInsightPoints(0);
      setClearedData({});
      setUnlockedTruths({}); // 追加
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

    setView('archive');
  };

  const handleResearch = () => {
    const clearedEpIds = Object.keys(clearedData).map((id) => `S1-${id}`);
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

  // ▼ 新規追加: 蜘蛛の巣ボードでLINKに成功した時の処理
  const handleUnlockTruth = (
    pinId: string,
    truthData: any,
    linkCost: number
  ) => {
    const newTruths = { ...unlockedTruths, [pinId]: truthData };
    setUnlockedTruths(newTruths);
    localStorage.setItem('tether_unlocked_truths', JSON.stringify(newTruths));

    // コスト消費と報酬の加算
    const newPoints = insightPoints - linkCost + (truthData.reward_points || 0);
    setInsightPoints(newPoints);
    localStorage.setItem('tether_insight_points', newPoints.toString());
  };

  // ▼ 新規追加: LINKに失敗した時（コストのみ消費）
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
          unlockedTerms={unlockedTerms}
          readTerms={readTerms}
          insightPoints={insightPoints}
          clearedData={clearedData}
          unlockedTruths={unlockedTruths} // 追加
          onReturnTitle={() => setView('title')}
          onReturnGame={() => setView('game')}
          onPlayEpisode={(epId) => {
            setCurrentEpisodeId(epId);
            setView('game');
          }}
          onResearch={handleResearch}
          onReadTerm={handleReadTerm}
          onUnlockTruth={handleUnlockTruth} // 追加
          onLinkFail={handleLinkFail} // 追加
        />
      )}
    </div>
  );
}
