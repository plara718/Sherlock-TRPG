'use client';

import React, { useEffect, useState } from 'react';
import TitleView from '@/components/TitleView';
import GameView from '@/components/GameView';
import ArchiveView from '@/components/ArchiveView';
import glossaryData from '@/data/glossary.json';

type ClearedData = { [epId: string]: { rank: string; tether: number } };

export default function GamePage() {
  const [view, setView] = useState<'title' | 'game' | 'archive'>('title');
  const [hasSaveData, setHasSaveData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>('#00');

  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [readTerms, setReadTerms] = useState<string[]>([]);
  const [insightPoints, setInsightPoints] = useState<number>(0);
  const [clearedData, setClearedData] = useState<ClearedData>({});
  const [unlockedTruths, setUnlockedTruths] = useState<Record<string, any>>({});
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [mycroftIntel, setMycroftIntel] = useState<string[]>([]);

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
    const intel = localStorage.getItem('tether_mycroft_intel');
    if (intel) setMycroftIntel(JSON.parse(intel));

    setIsInitialized(true);
  }, []);

  const handleStartConnection = () => {
    if (hasSaveData) {
      setView('archive');
    } else {
      localStorage.setItem('tether_save_data', 'true');
      localStorage.setItem('tether_insight_points', '0');
      localStorage.setItem('tether_current_season', '1');
      setHasSaveData(true);
      setInsightPoints(0);
      setCurrentSeason(1);
      setCurrentEpisodeId('#00');
      setView('game');
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    setHasSaveData(false);
    setUnlockedTerms([]);
    setReadTerms([]);
    setInsightPoints(0);
    setClearedData({});
    setUnlockedTruths({});
    setCurrentSeason(1);
    setMycroftIntel([]);
    setCurrentEpisodeId('#00');
    setView('title'); // リセット時はタイトル画面に戻す
  };

  // ▼ 新規：セーブデータのインポート（復元）処理
  const handleLoadData = (dataStr: string) => {
    try {
      // Base64文字列をデコードしてJSONパース
      const decoded = atob(dataStr);
      const saveData = JSON.parse(decoded);
      
      // 簡易的なデータ検証
      if (typeof saveData !== 'object' || !saveData.unlockedTerms || !saveData.clearedData) {
        return false;
      }

      // Stateの更新
      setUnlockedTerms(saveData.unlockedTerms || []);
      setReadTerms(saveData.readTerms || []);
      setInsightPoints(saveData.insightPoints || 0);
      setClearedData(saveData.clearedData || {});
      setUnlockedTruths(saveData.unlockedTruths || {});
      setCurrentSeason(saveData.currentSeason || 1);
      setHasSaveData(true);

      // LocalStorageの更新
      localStorage.setItem('tether_save_data', 'true');
      localStorage.setItem('tether_unlocked_terms', JSON.stringify(saveData.unlockedTerms || []));
      localStorage.setItem('tether_read_terms', JSON.stringify(saveData.readTerms || []));
      localStorage.setItem('tether_insight_points', (saveData.insightPoints || 0).toString());
      localStorage.setItem('tether_cleared_data', JSON.stringify(saveData.clearedData || {}));
      localStorage.setItem('tether_unlocked_truths', JSON.stringify(saveData.unlockedTruths || {}));
      localStorage.setItem('tether_current_season', (saveData.currentSeason || 1).toString());
      
      return true;
    } catch (e) {
      console.error("Data load failed", e);
      return false; // 不正な文字列の場合はfalseを返す
    }
  };

  const triggerMycroftIntel = (epId: string) => {
    const mycroftEps = ['#04', '#16', '#24', '#39', '#46', '#58'];
    if (mycroftEps.includes(epId) && !mycroftIntel.includes(epId)) {
      const availableTerms = glossaryData.terms.filter(t => !unlockedTerms.includes(t.id));
      const toUnlock: string[] = [];
      for(let i=0; i<3 && availableTerms.length > 0; i++) {
        const idx = Math.floor(Math.random() * availableTerms.length);
        toUnlock.push(availableTerms[idx].id);
        availableTerms.splice(idx, 1);
      }
      if (toUnlock.length > 0) {
        const newTerms = [...unlockedTerms, ...toUnlock];
        setUnlockedTerms(newTerms);
        localStorage.setItem('tether_unlocked_terms', JSON.stringify(newTerms));
        alert(`【Mycroft's Authority】\n兄マイクロフトの権限により、大索引に ${toUnlock.length} 件の極秘データが追加されました。`);
      }
      const newIntel = [...mycroftIntel, epId];
      setMycroftIntel(newIntel);
      localStorage.setItem('tether_mycroft_intel', JSON.stringify(newIntel));
    }
  };

  const handlePlayEpisode = (epId: string) => {
    triggerMycroftIntel(epId);
    setCurrentEpisodeId(epId);
    setView('game');
  };

  const handleSpendPoint = (amount: number) => {
    if (insightPoints >= amount) {
      const newPoints = insightPoints - amount;
      setInsightPoints(newPoints);
      localStorage.setItem('tether_insight_points', newPoints.toString());
      return true;
    }
    return false;
  };

  const handleEpisodeComplete = (epId: string, rank: string, tether: number, points: number) => {
    const isAlreadyCleared = !!clearedData[epId];
    const newData = { ...clearedData, [epId]: { rank, tether } };
    setClearedData(newData);
    localStorage.setItem('tether_cleared_data', JSON.stringify(newData));

    const newPoints = insightPoints + points;
    setInsightPoints(newPoints);
    localStorage.setItem('tether_insight_points', newPoints.toString());

    if (epId === '#13' && !isAlreadyCleared && currentSeason < 2) {
      setCurrentSeason(2);
      localStorage.setItem('tether_current_season', '2');
      alert("【Season 1: 黎明 - CLEAR】\n犯罪界のナポレオンの名前が浮上しました。\n次なる戦い（Season 2: 暗躍）のロックが解除されました。");
    } else if (epId === '#29' && !isAlreadyCleared && currentSeason < 3) {
      setCurrentSeason(3);
      localStorage.setItem('tether_current_season', '3');
      alert("【Season 2: 暗躍 - CLEAR】\nモリアーティとの全面対決が始まります。\n（Season 3: 決戦）のロックが解除されました。");
    } else if (epId === '#40' && !isAlreadyCleared && currentSeason < 4) {
      setCurrentSeason(4);
      localStorage.setItem('tether_current_season', '4');
      alert("【Season 3: 決戦 - CLEAR】\nライヘンバッハの滝での死闘を越え、伝説が帰還します。\n（Season 4: 帰還）のロックが解除されました。");
    }
    setView('archive');
  };

  const handleResearch = () => {
    const clearedEpIds = Object.keys(clearedData); 
    const availableTerms = glossaryData.terms.filter(t => !unlockedTerms.includes(t.id) && (t.appearance === 'general' || clearedEpIds.includes(t.appearance) || t.appearance.startsWith('SP-')));
    if (insightPoints > 0 && availableTerms.length > 0) {
      const randomTerm = availableTerms[Math.floor(Math.random() * availableTerms.length)];
      const newUnlocked = [...unlockedTerms, randomTerm.id];
      setUnlockedTerms(newUnlocked);
      localStorage.setItem('tether_unlocked_terms', JSON.stringify(newUnlocked));
      const newPoints = insightPoints - 1;
      setInsightPoints(newPoints);
      localStorage.setItem('tether_insight_points', newPoints.toString());
    } else if (availableTerms.length === 0) {
      alert('現時点で解読可能なデータはすべて復元済みです。新たな事件を解決してください。');
    }
  };

  const handleReadTerm = (termId: string) => {
    if (!readTerms.includes(termId)) {
      const newRead = [...readTerms, termId];
      setReadTerms(newRead);
      localStorage.setItem('tether_read_terms', JSON.stringify(newRead));
    }
  };

  const handleUnlockTruth = (pinId: string, truthData: any, linkCost: number) => {
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

  if (!isInitialized) return <div className="h-[100dvh] bg-slate-900" />;

  return (
    <div className="h-[100dvh] w-full bg-slate-900 text-slate-800 font-sans overflow-hidden overscroll-none relative">
      
      {/* タイトル画面 */}
      {view === 'title' && (
        <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
          <TitleView 
            hasSaveData={hasSaveData} 
            onStart={handleStartConnection} 
            onReset={handleResetData} 
            currentSeason={currentSeason}
            clearedData={clearedData}    
          />
        </div>
      )}

      {/* ゲーム画面 */}
      {view === 'game' && (
        <div className="absolute inset-0 z-20 bg-slate-900 animate-in slide-in-from-right-8 fade-in duration-300 shadow-2xl">
          <GameView
            key={currentEpisodeId}
            episodeId={currentEpisodeId}
            onBack={() => setView('archive')}
            unlockedTerms={unlockedTerms}
            setUnlockedTerms={(terms) => { setUnlockedTerms(terms); localStorage.setItem('tether_unlocked_terms', JSON.stringify(terms)); }}
            clearedData={clearedData}
            insightPoints={insightPoints}
            onSpendPoint={handleSpendPoint}
            onEpisodeComplete={handleEpisodeComplete}
          />
        </div>
      )}

      {/* アーカイブ画面 */}
      {view === 'archive' && (
        <div className="absolute inset-0 z-30 bg-[#f4ebd8] animate-in slide-in-from-bottom-8 fade-in duration-300">
          <ArchiveView
            currentSeason={currentSeason}
            unlockedTerms={unlockedTerms}
            readTerms={readTerms}
            insightPoints={insightPoints}
            clearedData={clearedData}
            unlockedTruths={unlockedTruths}
            clearedEpisodes={Object.keys(clearedData)}
            onReturnTitle={() => setView('title')}
            onReturnGame={() => setView('game')}
            onPlayEpisode={handlePlayEpisode}
            onResearch={handleResearch}
            onReadTerm={handleReadTerm}
            onUnlockTruth={handleUnlockTruth}
            onLinkFail={handleLinkFail}
            onLoadData={handleLoadData}   // ← 追加
            onResetData={handleResetData} // ← 追加
          />
        </div>
      )}
    </div>
  );
}