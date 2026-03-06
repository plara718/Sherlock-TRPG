'use client';

import React, { useState } from 'react';
import { BookOpen, Network, Database, Home, Settings, Save, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import ChronologyTab from './ChronologyTab';

import OriginGreatIndexTab from './GreatIndexTab';
import OriginSpiderWebTab from './SpiderWebTab';

const GreatIndexTab = OriginGreatIndexTab as any;
const SpiderWebTab = OriginSpiderWebTab as any;

interface ArchiveViewProps {
  currentSeason?: number;
  unlockedTerms?: string[];
  readTerms?: string[];
  insightPoints?: number;
  clearedData?: Record<string, any>;
  unlockedTruths?: Record<string, any>;
  clearedEpisodes?: string[]; 
  onReturnTitle?: () => void;
  onReturnGame?: () => void;
  onPlayEpisode?: (epId: string) => void;
  onResearch?: () => void;
  onReadTerm?: (termId: string) => void;
  onUnlockTruth?: (pinId: string, truthData: any, cost: number) => void;
  onLinkFail?: (cost: number) => void;
  onLoadData?: (dataStr: string) => boolean;
  onResetData?: () => void;
}

export default function ArchiveView({
  currentSeason = 1,
  unlockedTerms = [],
  readTerms = [],
  insightPoints = 0,
  clearedData = {},
  unlockedTruths = {},
  clearedEpisodes = [],
  onReturnTitle,
  onPlayEpisode,
  onResearch,
  onReadTerm,
  onUnlockTruth,
  onLinkFail,
  onLoadData,
  onResetData,
}: ArchiveViewProps) {
  const [activeTab, setActiveTab] = useState<'case' | 'index' | 'spider' | 'settings'>('case');

  const [importString, setImportString] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const generateExportString = () => {
    const saveData = { unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, currentSeason };
    return btoa(JSON.stringify(saveData));
  };

  const handleCopyExport = () => {
    const str = generateExportString();
    navigator.clipboard.writeText(str).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleImport = () => {
    if (!importString) return;
    if (onLoadData && onLoadData(importString)) {
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 2000);
      setImportString('');
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f4ebd8] text-[#3a2f29] font-serif overflow-hidden">
      
      {/* スマホ用トップヘッダー */}
      <header className="flex-none h-14 bg-[#2a2420] text-[#f4ebd8] flex items-center justify-between px-4 shadow-md z-10 relative">
        {/* ▼ BACKボタンを削除し、システムオンラインのランプに変更 */}
        <div className="flex items-center gap-2 text-[#8c7a6b]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-[10px] font-mono tracking-widest hidden sm:inline">SYSTEM ONLINE</span>
        </div>
        
        <h1 className="text-sm font-bold tracking-widest uppercase absolute left-1/2 transform -translate-x-1/2 w-max">
          {activeTab === 'case' && 'Case Archives'}
          {activeTab === 'index' && 'Great Index'}
          {activeTab === 'spider' && 'Spider Web'}
          {activeTab === 'settings' && 'System Settings'}
        </h1>
        
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold px-2 py-1 bg-amber-600/20 text-amber-500 rounded border border-amber-600/30">
            Pt: {insightPoints}
          </div>
          <button onClick={onReturnTitle} className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors" title="タイトルへ戻る">
            <Home size={18} />
          </button>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar relative">
        <div className="p-4 sm:p-6 max-w-2xl mx-auto h-full">
          {activeTab === 'case' && (
            <ChronologyTab 
              currentSeason={currentSeason} 
              clearedData={clearedData} 
              onPlayEpisode={onPlayEpisode!} 
              clearedEpisodes={clearedEpisodes} 
            />
          )}
          {activeTab === 'index' && (
            <GreatIndexTab
              unlockedTerms={unlockedTerms}
              readTerms={readTerms}
              insightPoints={insightPoints}
              clearedData={clearedData}
              onResearch={onResearch}
              onReadTerm={onReadTerm}
            />
          )}
          {activeTab === 'spider' && (
            <SpiderWebTab
              clearedData={clearedData}
              unlockedTerms={unlockedTerms}
              unlockedTruths={unlockedTruths}
              insightPoints={insightPoints}
              onUnlockTruth={onUnlockTruth}
              onLinkFail={onLinkFail}
            />
          )}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-300 max-w-md mx-auto mt-4">
              <h2 className="text-2xl font-bold text-[#3a2f29] mb-6 flex items-center gap-2 border-b border-[#8c7a6b]/30 pb-2">
                <Settings size={24} className="text-[#8c7a6b]" /> System Settings
              </h2>
              {/* エクスポートセクション */}
              <div className="bg-[#fffcf7] p-5 rounded-xl border border-[#8c7a6b]/40 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-3 text-[#5c4d43]">
                  <Save size={18} />
                  <h3 className="font-bold tracking-widest text-sm">SAVE DATA EXPORT</h3>
                </div>
                <p className="text-xs text-[#8c7a6b] font-sans mb-4">現在の進行状況を文字列としてコピーします。</p>
                <button onClick={handleCopyExport} className={`w-full py-3 rounded-lg font-bold tracking-widest text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-[#e6d5c3] text-[#3a2f29] hover:bg-[#d8c8b8]'}`}>
                  {copySuccess ? <><CheckCircle2 size={16} /> COPIED TO CLIPBOARD</> : 'COPY BACKUP CODE'}
                </button>
              </div>
              {/* インポートセクション */}
              <div className="bg-[#fffcf7] p-5 rounded-xl border border-[#8c7a6b]/40 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-3 text-[#5c4d43]">
                  <Upload size={18} />
                  <h3 className="font-bold tracking-widest text-sm">SAVE DATA IMPORT</h3>
                </div>
                <p className="text-xs text-[#8c7a6b] font-sans mb-4">バックアップした文字列を貼り付けて復元します。</p>
                <textarea value={importString} onChange={(e) => setImportString(e.target.value)} placeholder="Paste backup code here..." className="w-full h-24 p-3 bg-[#f4ebd8] border border-[#8c7a6b]/30 rounded-lg text-xs font-mono text-[#5c4d43] mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none custom-scrollbar" />
                <button onClick={handleImport} disabled={!importString} className={`w-full py-3 rounded-lg font-bold tracking-widest text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${!importString ? 'bg-[#d8c8b8] text-[#8c7a6b] cursor-not-allowed' : importStatus === 'success' ? 'bg-emerald-600 text-white' : importStatus === 'error' ? 'bg-rose-600 text-white' : 'bg-[#5c4d43] text-white hover:bg-[#3a2f29]'}`}>
                  {importStatus === 'success' ? 'RESTORE SUCCESSFUL' : importStatus === 'error' ? 'INVALID DATA CODE' : 'RESTORE FROM CODE'}
                </button>
              </div>
              {/* リセットセクション */}
              <div className="p-5 rounded-xl border border-rose-900/30 bg-rose-50/50 mb-6">
                <div className="flex items-center gap-2 mb-3 text-rose-700">
                  <Trash2 size={18} />
                  <h3 className="font-bold tracking-widest text-sm">FORMAT SYSTEM</h3>
                </div>
                <p className="text-xs text-rose-800/70 font-sans mb-4">すべての進行状況を削除し、初期状態に戻します。</p>
                <button onClick={() => { if (window.confirm("本当にすべてのデータを削除して初期化しますか？")) { if (onResetData) onResetData(); } }} className="w-full py-3 bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-lg font-bold tracking-widest text-xs transition-colors">
                  INITIALIZE TETHER (DELETE DATA)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* スマホ用 Bottom Navigation */}
      <nav className="flex-none h-16 sm:h-20 bg-[#2a2420] border-t border-[#3a2f29] flex justify-around items-center pb-safe px-2 shadow-[0_-4px_15px_rgba(0,0,0,0.3)] z-20">
        <button onClick={() => setActiveTab('case')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'case' ? 'text-amber-500' : 'text-[#8c7a6b] hover:text-[#d8c8b8]'}`}>
          <BookOpen size={20} className={activeTab === 'case' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">CASE</span>
        </button>
        <button onClick={() => setActiveTab('index')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'index' ? 'text-amber-500' : 'text-[#8c7a6b] hover:text-[#d8c8b8]'}`}>
          <Database size={20} className={activeTab === 'index' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">INDEX</span>
        </button>
        <button onClick={() => setActiveTab('spider')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'spider' ? 'text-amber-500' : 'text-[#8c7a6b] hover:text-[#d8c8b8]'}`}>
          <Network size={20} className={activeTab === 'spider' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">SPIDER</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === 'settings' ? 'text-amber-500' : 'text-[#8c7a6b] hover:text-[#d8c8b8]'}`}>
          <Settings size={20} className={activeTab === 'settings' ? 'fill-amber-500/20' : ''} />
          <span className="text-[10px] font-bold tracking-wider">SETTING</span>
        </button>
      </nav>
    </div>
  );
}