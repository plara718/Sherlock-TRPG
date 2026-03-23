'use client';

import React, { useState, useEffect } from 'react';
import { Play, Settings, BookOpen, AlertTriangle } from 'lucide-react';
import { useSaveData } from '@/lib/SaveDataContext';

export default function TitleView() {
  const ctx = useSaveData();
  const [showSettings, setShowSettings] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  
  // ▼ 隠しコマンド（ロゴ連打）用のステート
  const [tapCount, setTapCount] = useState(0);
  const isMoriartyMode = ctx.playMode === 'moriarty';

  const handleStart = () => {
    ctx.handleStartConnection();
  };

  // ▼ 新規追加：ロゴ連打でモードを反転させるギミック
  const handleLogoTap = () => {
    // ※本来の仕様書の条件（Season 4 / #58クリア）に達していない場合でもテストできるよう、
    // 開発中・または #40(ライヘンバッハ) クリアなどを条件にできます。ここでは無条件で5回連打で解放可能にしています。
    setTapCount(prev => prev + 1);
    
    if (tapCount + 1 >= 5) {
      setGlitchTrigger(true);
      setTapCount(0);
      
      // グリッチ演出を見せた直後にステートを反転
      setTimeout(() => {
        ctx.setPlayMode(prev => prev === 'holmes' ? 'moriarty' : 'holmes');
        setGlitchTrigger(false);
      }, 800);
    }
  };

  // 連打判定を時間経過でリセットする
  useEffect(() => {
    if (tapCount > 0) {
      const timer = setTimeout(() => setTapCount(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  return (
    <div data-theme={ctx.playMode} className="h-[100dvh] supports-[height:100svh]:h-[100svh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-theme-bg-base text-theme-text-base transition-colors duration-1000">
      
      {/* 隠しモード突入時のグリッチエフェクト */}
      {glitchTrigger && (
        <div className="absolute inset-0 z-50 pointer-events-none mix-blend-difference flex flex-col">
          <div className="h-1/3 w-full bg-white animate-[pulse_0.1s_infinite] opacity-50 translate-x-4" />
          <div className="h-1/3 w-full bg-black animate-[pulse_0.15s_infinite] opacity-50 -translate-x-4" />
          <div className="h-1/3 w-full bg-theme-accent-main animate-[pulse_0.05s_infinite] opacity-30 scale-110" />
        </div>
      )}

      {/* 背景エフェクト */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${isMoriartyMode ? 'from-rose-900/10 via-black to-black' : 'from-amber-900/10 via-[#1a1412] to-[#0a0807]'} opacity-50`} />
      
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-md">
        
        {/* ▼ モードによってシステムメッセージが変化 */}
        <div className={`mb-6 text-[10px] tracking-[0.4em] uppercase font-mono font-bold animate-pulse flex items-center gap-2 ${isMoriartyMode ? 'text-rose-600' : 'text-theme-accent-muted'}`}>
          <AlertTriangle size={14} /> 
          {isMoriartyMode ? 'WARNING: THE EQUATION IS ACTIVE' : 'SECURE CONNECTION ESTABLISHED'}
          <AlertTriangle size={14} />
        </div>

        {/* ▼ タイトルロゴ（ここを5回タップで反転） */}
        <h1 
          onClick={handleLogoTap}
          className={`text-5xl sm:text-6xl font-black font-serif tracking-widest mb-2 drop-shadow-2xl cursor-pointer select-none transition-all ${isMoriartyMode ? 'text-rose-600 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]' : 'text-theme-text-light'}`}
        >
          {isMoriartyMode ? 'M.C. MODE' : 'TETHER'}
        </h1>
        
        <p className={`text-xs sm:text-sm font-serif tracking-[0.3em] mb-12 opacity-80 ${isMoriartyMode ? 'text-rose-400' : 'text-theme-text-muted'}`}>
          {isMoriartyMode ? '- The Professor\'s Equation -' : '- シャーロック・ホームズの追憶 -'}
        </p>

        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handleStart}
            className={`w-full py-4 px-6 rounded-xl font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg border ${
              isMoriartyMode 
                ? 'bg-rose-950/50 hover:bg-rose-900 text-rose-100 border-rose-800' 
                : 'bg-theme-accent-main hover:bg-theme-accent-main-hover text-white border-theme-accent-main/50'
            }`}
          >
            {ctx.hasSaveData ? (isMoriartyMode ? 'RESUME EQUATION (記録を再開)' : 'RESUME ARCHIVE (記録を再開)') : 'START CONNECTION (新規接続)'}
            <Play size={16} className={isMoriartyMode ? 'text-rose-400' : ''} />
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="w-full py-3 px-6 rounded-xl font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-3 transition-colors bg-theme-bg-panel hover:bg-theme-bg-dark-panel text-theme-text-muted border border-theme-border-base/50"
          >
            SETTINGS (システム設定)
            <Settings size={14} />
          </button>

          {ctx.hasSaveData && (
            <button 
              onClick={() => {
                if(confirm(isMoriartyMode ? "すべての数式（記録）を消去します。よろしいですか？" : "すべての記録を消去し、初期化します。本当によろしいですか？")) {
                  ctx.handleResetData();
                }
              }}
              className="text-[10px] text-theme-text-muted opacity-50 hover:opacity-100 underline decoration-dotted mt-4"
            >
              INITIALIZE DATA (記録の初期化)
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 text-[9px] font-mono tracking-widest text-theme-text-muted opacity-40">
        VERSION 1.0.0
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-theme-bg-base border-2 border-theme-border-base rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
             <div className="flex items-center justify-between mb-6 border-b border-theme-border-base/30 pb-3">
               <h2 className="font-serif font-bold tracking-widest text-theme-text-light flex items-center gap-2">
                 <Settings size={18}/> SYSTEM SETTINGS
               </h2>
               <button onClick={() => setShowSettings(false)} className="text-theme-text-muted hover:text-theme-text-light">
                 ✕
               </button>
             </div>
             
             <div className="space-y-6">
               <div>
                 <label className="block text-xs font-bold tracking-widest mb-3 text-theme-text-muted font-mono">
                   TEXT SPEED (文字表示速度)
                 </label>
                 <div className="flex gap-2">
                   {[
                     { label: 'FAST', val: 10 },
                     { label: 'NORMAL', val: 30 },
                     { label: 'SLOW', val: 60 }
                   ].map(spd => (
                     <button
                       key={spd.label}
                       onClick={() => ctx.setTextSpeed(spd.val)}
                       className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                         ctx.textSpeed === spd.val 
                           ? 'bg-theme-accent-main text-white border-theme-accent-main' 
                           : 'bg-theme-bg-panel text-theme-text-muted border-theme-border-dark hover:bg-theme-bg-dark'
                       }`}
                     >
                       {spd.label}
                     </button>
                   ))}
                 </div>
               </div>

               <div>
                 <div className="flex items-center justify-between mb-2">
                   <label className="text-xs font-bold tracking-widest text-theme-text-muted font-mono">
                     REDUCE EFFECTS (画面揺れ・点滅の軽減)
                   </label>
                   <input 
                     type="checkbox" 
                     checked={ctx.reduceEffects}
                     onChange={(e) => ctx.setReduceEffects(e.target.checked)}
                     className="w-4 h-4 accent-theme-accent-main"
                   />
                 </div>
                 <p className="text-[9px] text-theme-text-muted">
                   チェックを入れると、Tether減少時の画面の揺れや点滅エフェクトを無効化します。画面酔いしやすい方はオンにしてください。
                 </p>
               </div>
             </div>

             <div className="mt-8 pt-4 border-t border-theme-border-base/30">
               <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-theme-bg-panel hover:bg-theme-bg-dark text-theme-text-light rounded-xl font-bold tracking-widest text-xs border border-theme-border-base/50 transition-colors">
                 CLOSE (閉じる)
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}