'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Network, Database, Home, Settings, Save, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import ChronologyTab from './ChronologyTab';
import OriginGreatIndexTab from './GreatIndexTab';
import OriginSpiderWebTab from './SpiderWebTab';
import { useSaveData } from '@/lib/SaveDataContext';

const GreatIndexTab = OriginGreatIndexTab as any;
const SpiderWebTab = OriginSpiderWebTab as any;

export default function ArchiveView() {
  const {
    currentSeason,
    unlockedTerms,
    readTerms,
    insightPoints,
    clearedData,
    unlockedTruths,
    setView,
    handlePlayEpisode,
    handleResearch,
    handleReadTerm,
    handleUnlockTruth,
    handleLinkFail,
    handleLoadData,
    handleResetData,
    textSpeed, setTextSpeed,
    reduceEffects, setReduceEffects,
    playMode // ▼ 追加
  } = useSaveData();

  const clearedEpisodes = Object.keys(clearedData);
  const [activeTab, setActiveTab] = useState<'case' | 'index' | 'spider' | 'settings'>('case');
  const [importStr, setImportStr] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const isMoriarty = playMode === 'moriarty'; // ▼ モード判定

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('SWITCH_TAB', handleSwitchTab);
    return () => window.removeEventListener('SWITCH_TAB', handleSwitchTab);
  }, []);

  const getExportData = () => {
    const data = { unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, currentSeason, playMode };
    return btoa(JSON.stringify(data));
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(getExportData());
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  const handleImportSubmit = () => {
    if (!importStr) return;
    const success = handleLoadData(importStr);
    setImportStatus(success ? 'success' : 'error');
    if (success) {
      setTimeout(() => setImportStatus('idle'), 2000);
      setImportStr('');
    }
  };

  const renderSettings = () => (
    <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-md mx-auto space-y-6">
        {/* Settings Panel 1 */}
        <div className="bg-theme-bg-panel p-5 rounded-xl border border-theme-border-base/50 shadow-sm">
          <h3 className="text-theme-text-light font-bold font-serif border-b border-theme-border-base/30 pb-2 mb-4 flex items-center gap-2">
            <Settings size={18} className="text-theme-text-muted" /> SYSTEM SETTINGS
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-theme-text-muted mb-2 tracking-widest">TEXT SPEED (文字速度)</p>
              <div className="flex gap-2">
                {[
                  { label: 'FAST', value: 15 },
                  { label: 'NORMAL', value: 30 },
                  { label: 'SLOW', value: 60 }
                ].map(speed => (
                  <button
                    key={speed.label}
                    onClick={() => setTextSpeed(speed.value)}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg border transition-all ${textSpeed === speed.value ? 'bg-theme-accent-main text-white border-theme-accent-main shadow-md' : 'bg-theme-bg-dark/30 text-theme-text-muted border-theme-border-base/30 hover:bg-theme-bg-dark'}`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-theme-text-muted mb-2 tracking-widest mt-4 border-t border-theme-border-base/20 pt-4">REDUCE SCREEN EFFECTS (演出軽減)</p>
              <button
                onClick={() => setReduceEffects(!reduceEffects)}
                className={`w-full py-2.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${reduceEffects ? 'bg-emerald-700/10 text-emerald-500 border-emerald-700/30' : 'bg-theme-bg-dark/30 text-theme-text-muted border-theme-border-base/30 hover:bg-theme-bg-dark'}`}
              >
                {reduceEffects ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 border-2 border-theme-text-muted/50 rounded-full" />}
                {reduceEffects ? 'REDUCED (軽減ON)' : 'NORMAL (標準)'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Export / Import */}
        <div className="bg-theme-bg-panel p-5 rounded-xl border border-theme-border-base/50 shadow-sm">
          <h3 className="text-theme-text-light font-bold font-serif border-b border-theme-border-base/30 pb-2 mb-4 flex items-center gap-2">
            <Save size={18} className="text-theme-text-muted" /> DATA EXPORT
          </h3>
          <div className="flex gap-2">
            <input 
              type="text" readOnly value={getExportData()} 
              className="flex-1 bg-theme-bg-dark/30 border border-theme-border-base/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text-base focus:outline-none"
            />
            <button onClick={handleCopyExport} className="bg-theme-accent-main hover:opacity-80 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
              {showCopySuccess ? <CheckCircle2 size={14} className="text-emerald-300" /> : 'COPY'}
            </button>
          </div>
        </div>

        <div className="bg-theme-bg-panel p-5 rounded-xl border border-theme-border-base/50 shadow-sm">
          <h3 className="text-theme-text-light font-bold font-serif border-b border-theme-border-base/30 pb-2 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-theme-text-muted" /> DATA IMPORT
          </h3>
          <div className="flex flex-col gap-2">
            <textarea value={importStr} onChange={(e) => setImportStr(e.target.value)} placeholder="Paste backup data here..." className="w-full h-20 bg-theme-bg-dark/30 border border-theme-border-base/30 rounded-lg px-3 py-2 text-xs font-mono text-theme-text-base focus:outline-none resize-none" />
            <button onClick={handleImportSubmit} disabled={!importStr} className="w-full bg-theme-accent-main hover:opacity-80 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors">
              IMPORT RUN
            </button>
            {importStatus === 'success' && <p className="text-emerald-500 text-xs font-bold mt-1 text-center">Data restored successfully.</p>}
            {importStatus === 'error' && <p className="text-rose-500 text-xs font-bold mt-1 text-center">Invalid data format.</p>}
          </div>
        </div>

        {/* Format System */}
        <div className="bg-rose-950/10 p-5 rounded-xl border border-rose-900/30 shadow-sm">
          <h3 className="text-rose-700 font-bold font-serif border-b border-rose-900/20 pb-2 mb-4 flex items-center gap-2">
            <Trash2 size={18} /> FORMAT SYSTEM
          </h3>
          {showConfirmReset ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <p className="text-rose-600 text-xs font-bold mb-3 text-center tracking-widest">
                本当にすべての記録を消去しますか？
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmReset(false)} className="flex-1 bg-theme-bg-dark text-theme-text-base hover:bg-theme-border-base py-2.5 rounded-lg text-xs font-bold transition-colors">
                  CANCEL
                </button>
                <button onClick={handleResetData} className="flex-1 bg-rose-700 text-white hover:bg-rose-800 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors">
                  EXECUTE
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowConfirmReset(true)} className="w-full bg-rose-900/10 text-rose-700 hover:bg-rose-900 hover:text-white border border-rose-800/30 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors">
              DELETE ALL RECORDS
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div data-theme={playMode} className="h-[100dvh] flex flex-col transition-colors duration-1000 select-none bg-theme-bg-base">
      <header className="shrink-0 border-b flex justify-between items-center p-3 sm:p-4 shadow-sm z-10 relative bg-theme-bg-panel border-theme-border-base/30">
        <button onClick={() => setView('title')} className="transition-colors flex items-center gap-2 active:scale-95 text-theme-text-muted hover:text-theme-text-light">
          <Home size={20} />
          <span className="hidden sm:inline text-xs font-bold tracking-widest">TITLE</span>
        </button>
        
        <h1 className="hidden sm:block text-lg sm:text-xl font-serif font-bold tracking-widest text-center absolute left-1/2 -translate-x-1/2 text-theme-text-light">
          {activeTab === 'case' ? (isMoriarty ? 'THE EQUATION' : 'CHRONOLOGY') : activeTab === 'index' ? (isMoriarty ? 'DATABASE' : 'GREAT INDEX') : activeTab === 'settings' ? 'SYSTEM SETTING' : (isMoriarty ? 'INFRASTRUCTURE' : 'SPIDER WEB')}
        </h1>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className="text-[9px] font-mono tracking-widest uppercase text-theme-text-muted">Insight Pts</p>
            <p className="text-base sm:text-lg font-bold font-mono leading-none text-theme-accent-main">{insightPoints}</p>
          </div>
          <button onClick={() => setView('game')} className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest rounded-full transition-transform active:scale-95 shadow-md bg-theme-text-light hover:opacity-80 text-theme-bg-base">
            RETURN
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* モリアーティモード時の背景ノイズエフェクト */}
        {isMoriarty && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80 z-0" />}
        
        <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto pb-24 sm:pb-32">
          {activeTab === 'case' && (
             <ChronologyTab currentSeason={currentSeason} clearedData={clearedData} clearedEpisodes={clearedEpisodes} onPlayEpisode={handlePlayEpisode} playMode={playMode} />
          )}
          {activeTab === 'index' && (
            <GreatIndexTab unlockedTerms={unlockedTerms} readTerms={readTerms} insightPoints={insightPoints} clearedData={clearedData} onResearch={handleResearch} onReadTerm={handleReadTerm} />
          )}
          {activeTab === 'spider' && (
            <SpiderWebTab clearedData={clearedData} unlockedTerms={unlockedTerms} unlockedTruths={unlockedTruths} insightPoints={insightPoints} onUnlockTruth={handleUnlockTruth} onLinkFail={handleLinkFail} />
          )}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      <nav className="shrink-0 h-16 sm:h-20 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] z-20 relative bg-theme-bg-panel border-theme-border-base/30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('case')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'case' ? 'text-theme-accent-main' : 'text-theme-text-muted hover:text-theme-text-light'}`}>
          <BookOpen size={20} />
          <span className="text-[10px] font-bold tracking-wider">{isMoriarty ? 'EQUATION' : 'CASE'}</span>
        </button>
        <button onClick={() => setActiveTab('index')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'index' ? 'text-theme-accent-main' : 'text-theme-text-muted hover:text-theme-text-light'}`}>
          <Database size={20} />
          <span className="text-[10px] font-bold tracking-wider">{isMoriarty ? 'DATA' : 'INDEX'}</span>
        </button>
        <button onClick={() => setActiveTab('spider')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'spider' ? 'text-theme-accent-main' : 'text-theme-text-muted hover:text-theme-text-light'}`}>
          <Network size={20} />
          <span className="text-[10px] font-bold tracking-wider">{isMoriarty ? 'INFRA' : 'SPIDER'}</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'settings' ? 'text-theme-accent-main' : 'text-theme-text-muted hover:text-theme-text-light'}`}>
          <Settings size={20} />
          <span className="text-[10px] font-bold tracking-wider">SETTING</span>
        </button>
      </nav>
    </div>
  );
}