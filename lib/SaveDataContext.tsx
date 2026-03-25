'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ClearedData = {
  rank: string;
  score: number;
  date: string;
};

type SaveDataContextType = {
  isInitialized: boolean;
  currentSeason: number;
  unlockedTerms: string[];
  readTerms: string[];
  insightPoints: number;
  clearedData: Record<string, ClearedData>;
  unlockedTruths: string[];
  currentEpisodeId: string;
  activeGameData: any;
  view: 'title' | 'game' | 'archive' | 'endroll';
  textSpeed: number;
  reduceEffects: boolean;
  playMode: 'holmes' | 'moriarty';
  setUnlockedTerms: (terms: string[]) => void;
  setReadTerms: (terms: string[]) => void;
  setInsightPoints: (pts: number | ((prev: number) => number)) => void;
  setCurrentEpisodeId: (id: string) => void;
  setActiveGameData: (data: any) => void;
  setView: (view: 'title' | 'game' | 'archive' | 'endroll') => void;
  setTextSpeed: (speed: number) => void;
  setReduceEffects: (reduce: boolean) => void;
  setPlayMode: (mode: 'holmes' | 'moriarty') => void;
  handleStartConnection: () => void; // ▼追加：タイトルから開始する処理
  handlePlayEpisode: (epId: string) => void;
  handleEpisodeComplete: (epId: string, rank: string, tether: number, points: number) => void;
  handleResearch: (termId: string, cost: number) => boolean;
  handleReadTerm: (termId: string) => void;
  handleUnlockTruth: (truthId: string) => void;
  handleLinkFail: () => void;
  handleLoadData: (base64Str: string) => boolean;
  handleResetData: () => void;
  handleSpendPoint: (cost: number) => boolean;
};

const SaveDataContext = createContext<SaveDataContextType | undefined>(undefined);

const RANK_WEIGHT: Record<string, number> = {
  'MASTERPIECE': 3, 'SYMPATHETIC': 3, 'CLEARED': 3,
  'COMPROMISED': 2, 'LUCID': 2,
  'FAILED': 1, 'ABYSS': 1
};

export function SaveDataProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [readTerms, setReadTerms] = useState<string[]>([]);
  const [insightPoints, setInsightPoints] = useState(0);
  const [clearedData, setClearedData] = useState<Record<string, ClearedData>>({});
  const [unlockedTruths, setUnlockedTruths] = useState<string[]>([]);
  const [currentEpisodeId, setCurrentEpisodeId] = useState('');
  const [activeGameData, setActiveGameData] = useState<any>(null);
  const [view, setView] = useState<'title' | 'game' | 'archive' | 'endroll'>('title');
  const [textSpeed, setTextSpeed] = useState(30);
  const [reduceEffects, setReduceEffects] = useState(false);
  const [playMode, setPlayMode] = useState<'holmes' | 'moriarty'>('holmes');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sherlock_save_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentSeason(parsed.currentSeason || 1);
        setUnlockedTerms(parsed.unlockedTerms || []);
        setReadTerms(parsed.readTerms || []);
        setInsightPoints(parsed.insightPoints || 0);
        setClearedData(parsed.clearedData || {});
        setUnlockedTruths(parsed.unlockedTruths || []);
        if (parsed.activeGameData) {
          setActiveGameData(parsed.activeGameData);
          setCurrentEpisodeId(parsed.activeGameData.episodeId);
        }
        setTextSpeed(parsed.textSpeed || 30);
        setReduceEffects(parsed.reduceEffects || false);
        setPlayMode(parsed.playMode || 'holmes');
      }
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const dataToSave = { currentSeason, unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, activeGameData, textSpeed, reduceEffects, playMode };
    localStorage.setItem('sherlock_save_v1', JSON.stringify(dataToSave));
  }, [currentSeason, unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, activeGameData, textSpeed, reduceEffects, playMode, isLoaded]);

  // ▼追加：タイトル画面からアーカイブ画面へ移行する処理
  const handleStartConnection = () => {
    setView('archive');
  };

  const handlePlayEpisode = (epId: string) => {
    setCurrentEpisodeId(epId);
    setActiveGameData(null);
    setView('game');
  };

  const handleEpisodeComplete = (epId: string, rank: string, tether: number, points: number) => {
    if (epId === "INTERLUDE") {
      setActiveGameData(null);
      setView('archive');
      return;
    }

    setClearedData(prev => {
      const prevData = prev[epId];
      const prevWeight = prevData ? (RANK_WEIGHT[prevData.rank] || 0) : 0;
      const newWeight = RANK_WEIGHT[rank] || 0;

      const bestRank = newWeight >= prevWeight ? rank : prevData.rank;
      const bestScore = Math.max(tether, prevData?.score || 0);

      return {
        ...prev,
        [epId]: {
          rank: bestRank,
          score: bestScore,
          date: new Date().toISOString()
        }
      };
    });

    if (points > 0) {
      setInsightPoints(prev => prev + points);
    }
    
    setActiveGameData(null);
    setView('archive');
  };

  const handleResearch = (termId: string, cost: number) => {
    if (insightPoints >= cost && !unlockedTerms.includes(termId)) {
      setInsightPoints(prev => prev - cost);
      setUnlockedTerms(prev => [...prev, termId]);
      return true;
    }
    return false;
  };

  const handleReadTerm = (termId: string) => {
    if (!readTerms.includes(termId)) {
      setReadTerms(prev => [...prev, termId]);
    }
  };

  const handleUnlockTruth = (truthId: string) => {
    if (!unlockedTruths.includes(truthId)) {
      setUnlockedTruths(prev => [...prev, truthId]);
    }
  };

  const handleLinkFail = () => {
    setInsightPoints(prev => Math.max(0, prev - 1));
  };

  const handleLoadData = (base64Str: string) => {
    try {
      const decoded = atob(base64Str);
      const parsed = JSON.parse(decoded);
      if (parsed.clearedData && typeof parsed.insightPoints === 'number') {
        setCurrentSeason(parsed.currentSeason || 1);
        setUnlockedTerms(parsed.unlockedTerms || []);
        setReadTerms(parsed.readTerms || []);
        setInsightPoints(parsed.insightPoints || 0);
        setClearedData(parsed.clearedData || {});
        setUnlockedTruths(parsed.unlockedTruths || []);
        setPlayMode(parsed.playMode || 'holmes');
        return true;
      }
    } catch(e) {}
    return false;
  };

  const handleResetData = () => {
    setCurrentSeason(1);
    setUnlockedTerms([]);
    setReadTerms([]);
    setInsightPoints(0);
    setClearedData({});
    setUnlockedTruths([]);
    setActiveGameData(null);
    setPlayMode('holmes');
  };

  const handleSpendPoint = (cost: number) => {
    if (insightPoints >= cost) {
      setInsightPoints(prev => prev - cost);
      return true;
    }
    return false;
  };

  return (
    <SaveDataContext.Provider value={{
      isInitialized: isLoaded,
      currentSeason, unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths,
      currentEpisodeId, activeGameData, view, textSpeed, reduceEffects, playMode,
      setUnlockedTerms, setReadTerms, setInsightPoints, setCurrentEpisodeId, setActiveGameData,
      setView, setTextSpeed, setReduceEffects, setPlayMode,
      handleStartConnection, // ▼追加：Providerへの登録
      handlePlayEpisode, handleEpisodeComplete, handleResearch, handleReadTerm,
      handleUnlockTruth, handleLinkFail, handleLoadData, handleResetData, handleSpendPoint
    }}>
      {children}
    </SaveDataContext.Provider>
  );
}

export function useSaveData() {
  const context = useContext(SaveDataContext);
  if (!context) throw new Error('useSaveData must be used within SaveDataProvider');
  return context;
}