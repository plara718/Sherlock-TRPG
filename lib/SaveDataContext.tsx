'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import glossaryData from '@/data/glossary.json';

type ClearedData = { [epId: string]: { rank: string; tether: number } };

type SaveDataContextType = {
  view: 'title' | 'game' | 'archive' | 'endroll';
  setView: React.Dispatch<React.SetStateAction<'title' | 'game' | 'archive' | 'endroll'>>;
  hasSaveData: boolean;
  isInitialized: boolean;
  currentEpisodeId: string;
  setCurrentEpisodeId: React.Dispatch<React.SetStateAction<string>>;
  unlockedTerms: string[];
  setUnlockedTerms: (terms: string[]) => void;
  readTerms: string[];
  insightPoints: number;
  clearedData: ClearedData;
  unlockedTruths: Record<string, any>;
  currentSeason: number;
  mycroftIntel: string[];
  handleStartConnection: () => void;
  handleResetData: () => void;
  handleLoadData: (dataStr: string) => boolean;
  handlePlayEpisode: (epId: string) => void;
  handleSpendPoint: (amount: number) => boolean;
  handleEpisodeComplete: (epId: string, rank: string, tether: number, points: number) => void;
  handleResearch: () => void;
  handleReadTerm: (termId: string) => void;
  handleUnlockTruth: (pinId: string, truthData: any, linkCost: number) => void;
  handleLinkFail: (linkCost: number) => void;
};

const SaveDataContext = createContext<SaveDataContextType | null>(null);

export const useSaveData = () => {
  const ctx = useContext(SaveDataContext);
  if (!ctx) throw new Error('useSaveData must be used within SaveDataProvider');
  return ctx;
};

export const SaveDataProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<'title' | 'game' | 'archive' | 'endroll'>('title');
  const [hasSaveData, setHasSaveData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>('#00');

  const [unlockedTerms, setUnlockedTermsState] = useState<string[]>([]);
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
    if (terms) setUnlockedTermsState(JSON.parse(terms));
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

  const setUnlockedTerms = (terms: string[]) => {
    setUnlockedTermsState(terms);
    localStorage.setItem('tether_unlocked_terms', JSON.stringify(terms));
  };

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
    setUnlockedTermsState([]);
    setReadTerms([]);
    setInsightPoints(0);
    setClearedData({});
    setUnlockedTruths({});
    setCurrentSeason(1);
    setMycroftIntel([]);
    setCurrentEpisodeId('#00');
    setView('title');
  };

  const handleLoadData = (dataStr: string) => {
    try {
      const decoded = atob(dataStr);
      const saveData = JSON.parse(decoded);
      
      if (typeof saveData !== 'object' || !saveData.unlockedTerms || !saveData.clearedData) return false;

      setUnlockedTermsState(saveData.unlockedTerms || []);
      setReadTerms(saveData.readTerms || []);
      setInsightPoints(saveData.insightPoints || 0);
      setClearedData(saveData.clearedData || {});
      setUnlockedTruths(saveData.unlockedTruths || {});
      setCurrentSeason(saveData.currentSeason || 1);
      setHasSaveData(true);

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
      return false;
    }
  };

  const triggerMycroftIntel = (epId: string) => {
    const mycroftEps = ['#04', '#16', '#24', '#39', '#44', '#50'];
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
        setUnlockedTermsState(newTerms);
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

    if (epId === '#50' && !isAlreadyCleared) {
      setView('endroll');
      return; 
    }

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
      alert("【Season 3: 決戦 - CLEAR】\nライヘンバッハの滝での死闘を越え、伝説が帰還します。\n（Season 4: エピローグ）のロックが解除されました。");
    }
    
    setView('archive');
  };

  const handleResearch = () => {
    const clearedEpIds = Object.keys(clearedData); 
    const availableTerms = glossaryData.terms.filter(t => !unlockedTerms.includes(t.id) && (t.appearance === 'general' || clearedEpIds.includes(t.appearance) || t.appearance.startsWith('SP-')));
    if (insightPoints > 0 && availableTerms.length > 0) {
      const randomTerm = availableTerms[Math.floor(Math.random() * availableTerms.length)];
      const newUnlocked = [...unlockedTerms, randomTerm.id];
      setUnlockedTermsState(newUnlocked);
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

  return (
    <SaveDataContext.Provider value={{
      view, setView, hasSaveData, isInitialized, currentEpisodeId, setCurrentEpisodeId,
      unlockedTerms, setUnlockedTerms, readTerms, insightPoints, clearedData,
      unlockedTruths, currentSeason, mycroftIntel,
      handleStartConnection, handleResetData, handleLoadData, handlePlayEpisode,
      handleSpendPoint, handleEpisodeComplete, handleResearch, handleReadTerm,
      handleUnlockTruth, handleLinkFail
    }}>
      {children}
    </SaveDataContext.Provider>
  );
};