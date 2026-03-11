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
  activeGameData: any;
  setActiveGameData: React.Dispatch<React.SetStateAction<any>>;
  clearActiveGameData: () => void;
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
  textSpeed: number;
  setTextSpeed: (speed: number) => void;
  reduceEffects: boolean;
  setReduceEffects: (reduce: boolean) => void;
};

const SaveDataContext = createContext<SaveDataContextType | undefined>(undefined);

export function SaveDataProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [view, setView] = useState<'title' | 'game' | 'archive' | 'endroll'>('title');
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>('#00');

  const [unlockedTerms, setUnlockedTerms] = useState<string[]>([]);
  const [readTerms, setReadTerms] = useState<string[]>([]);
  const [insightPoints, setInsightPoints] = useState(0);
  const [clearedData, setClearedData] = useState<ClearedData>({});
  const [unlockedTruths, setUnlockedTruths] = useState<Record<string, any>>({});
  const [textSpeed, setTextSpeed] = useState<number>(30);
  const [reduceEffects, setReduceEffects] = useState<boolean>(false);
  const [activeGameData, setActiveGameData] = useState<any>(null);

  const currentSeason = 
    clearedData['#39'] ? 4 : 
    clearedData['#29'] ? 3 : 
    clearedData['#13'] ? 2 : 1;

  const [mycroftIntel, setMycroftIntel] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem('sherlock_save_v1');
      if (savedStr) {
        const data = JSON.parse(savedStr);
        if (data && typeof data === 'object') {
            if (data.unlockedTerms) setUnlockedTerms(data.unlockedTerms);
            if (data.readTerms) setReadTerms(data.readTerms);
            if (data.insightPoints !== undefined) setInsightPoints(data.insightPoints);
            if (data.clearedData) setClearedData(data.clearedData);
            if (data.unlockedTruths) setUnlockedTruths(data.unlockedTruths);
            if (data.mycroftIntel) setMycroftIntel(data.mycroftIntel);
            if (data.textSpeed !== undefined) setTextSpeed(data.textSpeed);
            if (data.reduceEffects !== undefined) setReduceEffects(data.reduceEffects);
            if (data.activeGameData !== undefined) setActiveGameData(data.activeGameData);
        }
      }
    } catch (e) {
      console.error("Save data load failed", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('sherlock_save_v1', JSON.stringify({ unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, mycroftIntel, textSpeed, reduceEffects, activeGameData }));
    }
  }, [unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, mycroftIntel, isInitialized, textSpeed, reduceEffects, activeGameData]);

  const hasSaveData = unlockedTerms.length > 0 || Object.keys(clearedData).length > 0;

  const handleStartConnection = () => {
    if (!hasSaveData) {
      const initialTerm = glossaryData.terms.find(t => t.id === 'H001');
      if (initialTerm) setUnlockedTerms([initialTerm.id]);
      setInsightPoints(0);
      setClearedData({});
      setCurrentEpisodeId('#00');
    }
    setView('archive');
  };

  const handleResetData = () => {
    setUnlockedTerms([]);
    setReadTerms([]);
    setInsightPoints(0);
    setClearedData({});
    setUnlockedTruths({});
    setMycroftIntel([]);
    setCurrentEpisodeId('#00');
    setActiveGameData(null);
    setView('title');
  };

  const handleLoadData = (dataStr: string) => {
    try {
      const data = JSON.parse(atob(dataStr));
      if (data && typeof data === 'object') {
        if (data.unlockedTerms) setUnlockedTerms(data.unlockedTerms);
        if (data.readTerms) setReadTerms(data.readTerms);
        if (data.insightPoints !== undefined) setInsightPoints(data.insightPoints);
        if (data.clearedData) setClearedData(data.clearedData);
        if (data.unlockedTruths) setUnlockedTruths(data.unlockedTruths);
        if (data.mycroftIntel) setMycroftIntel(data.mycroftIntel);
        return true;
      }
    } catch (e) {
      console.error("Data import failed", e);
    }
    return false;
  };

  const handlePlayEpisode = (epId: string) => {
    setCurrentEpisodeId(epId);
    setView('game');
  };

  const handleSpendPoint = (amount: number) => {
    if (insightPoints >= amount) {
      setInsightPoints(prev => prev - amount);
      return true;
    }
    return false;
  };

  const clearActiveGameData = () => { setActiveGameData(null); };

  const handleEpisodeComplete = (epId: string, rank: string, tether: number, points: number) => {
    setActiveGameData(null);
    if (epId !== 'INTERLUDE' && !epId.includes('Interlude')) {
      setClearedData(prev => ({ ...prev, [epId]: { rank, tether } }));
      setInsightPoints(prev => prev + points);
    }
    setView('archive');
  };

  const handleResearch = () => {
    if (insightPoints <= 0) return;
    setInsightPoints(prev => prev - 1);
  };

  const handleReadTerm = (termId: string) => {
    if (!readTerms.includes(termId)) setReadTerms(prev => [...prev, termId]);
  };

  const handleUnlockTruth = (pinId: string, truthData: any, linkCost: number) => {
    if (handleSpendPoint(linkCost)) {
      setUnlockedTruths(prev => ({ ...prev, [pinId]: truthData }));
    }
  };

  const handleLinkFail = (linkCost: number) => {
    handleSpendPoint(linkCost);
  };

  return (
    <SaveDataContext.Provider value={{
      view, setView, hasSaveData, isInitialized, currentEpisodeId, setCurrentEpisodeId,
      unlockedTerms, setUnlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths,
      currentSeason, mycroftIntel,
      handleStartConnection, handleResetData, handleLoadData, handlePlayEpisode,
      handleSpendPoint, handleEpisodeComplete, handleResearch, handleReadTerm,
      handleUnlockTruth, handleLinkFail,
      textSpeed, setTextSpeed, reduceEffects, setReduceEffects,
      activeGameData, setActiveGameData, clearActiveGameData
    }}>
      {children}
    </SaveDataContext.Provider>
  );
}

export function useSaveData() {
  const context = useContext(SaveDataContext);
  if (context === undefined) throw new Error('useSaveData must be used within a SaveDataProvider');
  return context;
}