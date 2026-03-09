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
  onPlayEpisode: (epId: string) => void;
  onResearch: () => void;
  onReadTerm: (termId: string) => void;
  onUnlockTruth: (pinId: string, truthData: any, linkCost: number) => void;
  onLinkFail: (linkCost: number) => void;
  onLoadData: (dataStr: string) => boolean;
  onResetData: () => void;
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
  onReturnGame,
  onPlayEpisode,
  onResearch,
  onReadTerm,
  onUnlockTruth,
  onLinkFail,
  onLoadData,
  onResetData,
}: ArchiveViewProps) {
  const [activeTab, setActiveTab] = useState<'case' | 'index' | 'spider' | 'settings'>('case');

  const [importStr, setImportStr] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const isPostReichenbach = currentSeason >= 4 || clearedEpisodes.includes('#40');
  const isSeason3 = currentSeason === 3 && !isPostReichenbach;

  const getExportData = () => {
    const data = { unlockedTerms, readTerms, insightPoints, clearedData, unlockedTruths, currentSeason };
    return btoa(JSON.stringify(data));
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(getExportData());
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  const handleImportSubmit = () => {
    if (!importStr) return;
    const success = onLoadData(importStr);
    setImportStatus(success ? 'success' : 'error');
    if (success) {
      setTimeout(() => setImportStatus('idle'), 2000);
      setImportStr('');
    }
  };

  const renderSettings = () => (
    <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-[#fffcf7] p-5 rounded-xl border border-[#8c7a6b]/30 shadow-sm">
          <h3 className="text-[#3a2f29] font-bold font-serif border-b border-[#8c7a6b]/20 pb-2 mb-4 flex items-center gap-2">
            <Save size={18} className="text-[#8c7a6b]" /> DATA EXPORT
          </h3>
          <p className="text-xs text-[#5c4d43] mb-3 leading-relaxed">
            現在の進行状況（記録）をバックアップ用の文字列として出力します。機種変更時や、ブラウザからホーム画面（アプリ）へ移行する際にご利用ください。
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={getExportData()} 
              className="flex-1 bg-[#e6d5c3]/30 border border-[#8c7a6b]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#5c4d43] focus:outline-none"
            />
            <button 
              onClick={handleCopyExport}
              className="bg-[#5c4d43] hover:bg-[#3a2f29] text-[#f4ebd8] px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1"
            >
              {showCopySuccess ? <CheckCircle2 size={14} className="text-emerald-400" /> : 'COPY'}
            </button>
          </div>
        </div>

        <div className="bg-[#fffcf7] p-5 rounded-xl border border-[#8c7a6b]/30 shadow-sm">
          <h3 className="text-[#3a2f29] font-bold font-serif border-b border-[#8c7a6b]/20 pb-2 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-[#8c7a6b]" /> DATA IMPORT
          </h3>
          <p className="text-xs text-[#5c4d43] mb-3 leading-relaxed">
            エクスポートした文字列を入力して、記録を復元します。<br/>
            <span className="text-rose-600 font-bold">※現在のデータは上書きされます。</span>
          </p>
          <div className="flex flex-col gap-2">
            <textarea 
              value={importStr}
              onChange={(e) => setImportStr(e.target.value)}
              placeholder="Paste backup data here..."
              className="w-full h-20 bg-[#e6d5c3]/30 border border-[#8c7a6b]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#5c4d43] focus:outline-none focus:border-[#5c4d43] resize-none"
            />
            <button 
              onClick={handleImportSubmit}
              disabled={!importStr}
              className="w-full bg-[#5c4d43] hover:bg-[#3a2f29] disabled:bg-[#d8c8b8] disabled:cursor-not-allowed text-[#f4ebd8] py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-1"
            >
              IMPORT RUN
            </button>
            {importStatus === 'success' && <p className="text-emerald-600 text-xs font-bold mt-1 text-center">Data restored successfully.</p>}
            {importStatus === 'error' && <p className="text-rose-600 text-xs font-bold mt-1 text-center">Invalid data format.</p>}
          </div>
        </div>

        <div className="bg-rose-950/5 p-5 rounded-xl border border-rose-900/20 shadow-sm">
          <h3 className="text-rose-900 font-bold font-serif border-b border-rose-900/20 pb-2 mb-4 flex items-center gap-2">
            <Trash2 size={18} /> FORMAT SYSTEM
          </h3>
          {showConfirmReset ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <p className="text-rose-700 text-xs font-bold mb-3 text-center tracking-widest">
                本当にすべての記録を消去しますか？<br/>この操作は取り消せません。
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmReset(false)} className="flex-1 bg-[#e6d5c3] text-[#5c4d43] hover:bg-[#d8c8b8] py-2.5 rounded-lg text-xs font-bold transition-colors">
                  CANCEL
                </button>
                <button onClick={onResetData} className="flex-1 bg-rose-700 text-white hover:bg-rose-800 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors shadow-inner">
                  EXECUTE
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowConfirmReset(true)} className="w-full bg-rose-900/10 text-rose-800 hover:bg-rose-900 hover:text-white border border-rose-800/30 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors">
              DELETE ALL RECORDS
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-[100dvh] flex flex-col transition-colors duration-1000 select-none ${isSeason3 ? 'bg-[#1a0f0f]' : 'bg-[#f4ebd8]'}`}>
      <header className={`shrink-0 border-b flex justify-between items-center p-3 sm:p-4 shadow-sm z-10 relative ${isSeason3 ? 'bg-rose-950/20 border-rose-900/50' : 'bg-[#fffcf7] border-[#8c7a6b]/20'}`}>
        <button onClick={onReturnTitle} className={`transition-colors flex items-center gap-2 active:scale-95 ${isSeason3 ? 'text-rose-600 hover:text-rose-400' : 'text-[#8c7a6b] hover:text-[#5c4d43]'}`}>
          <Home size={20} />
          <span className="hidden sm:inline text-xs font-bold tracking-widest">TITLE</span>
        </button>
        
        <h1 className={`text-lg sm:text-xl font-serif font-bold tracking-widest text-center absolute left-1/2 -translate-x-1/2 ${isSeason3 ? 'text-rose-700 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]' : 'text-[#3a2f29]'}`}>
          {activeTab === 'case' ? 'CHRONOLOGY' : activeTab === 'index' ? 'GREAT INDEX' : activeTab === 'settings' ? 'SYSTEM SETTING' : 'SPIDER WEB'}
        </h1>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className={`text-[9px] font-mono tracking-widest uppercase ${isSeason3 ? 'text-rose-800' : 'text-[#8c7a6b]'}`}>Insight Pts</p>
            <p className={`text-base sm:text-lg font-bold font-mono leading-none ${isSeason3 ? 'text-rose-500' : 'text-amber-600'}`}>{insightPoints}</p>
          </div>
          {onReturnGame && (
             <button onClick={onReturnGame} className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold tracking-widest rounded-full transition-transform active:scale-95 shadow-md ${isSeason3 ? 'bg-rose-800 hover:bg-rose-700 text-rose-100' : 'bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8]'}`}>
               RETURN
             </button>
          )}
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto custom-scrollbar relative ${isSeason3 ? 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")] opacity-90' : ''}`}>
        {isSeason3 && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#1a0f0f_100%)] z-0" />}
        <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto pb-24 sm:pb-32">
          {activeTab === 'case' && (
            <ChronologyTab currentSeason={currentSeason} clearedData={clearedData} clearedEpisodes={clearedEpisodes} onPlayEpisode={onPlayEpisode} />
          )}
          {activeTab === 'index' && (
            <GreatIndexTab unlockedTerms={unlockedTerms} readTerms={readTerms} insightPoints={insightPoints} clearedData={clearedData} onResearch={onResearch} onReadTerm={onReadTerm} />
          )}
          
          {/* ▼ 修正点：SpiderWebTab の不要なプロパティを削除し、必要なプロパティだけを渡す */}
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

          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      <nav className={`shrink-0 h-16 sm:h-20 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] z-20 relative ${isSeason3 ? 'bg-[#1a0f0f] border-rose-900/50 shadow-[0_-10px_30px_rgba(225,29,72,0.1)]' : 'bg-[#fffcf7] border-[#8c7a6b]/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
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