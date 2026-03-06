'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Network, Lock, HelpCircle, X, AlertCircle, ChevronLeft, ChevronRight, Flame, Clock } from 'lucide-react';
import spiderDataS1 from '@/data/spider_web_s1.json';
import spiderDataS2 from '@/data/spider_web_s2.json';
import spiderDataS3 from '@/data/spider_web_s3.json';

type SpiderWebTabProps = {
  clearedData?: Record<string, any>;
  unlockedTerms?: string[];
  unlockedTruths?: Record<string, any>;
  insightPoints?: number;
  onUnlockTruth?: (pinId: string, truthData: any, cost: number) => void;
  onLinkFail?: (cost: number) => void;
};

export default function SpiderWebTab({
  clearedData = {},
  unlockedTerms = [],
  unlockedTruths = {},
  insightPoints = 0,
  onUnlockTruth,
  onLinkFail,
}: SpiderWebTabProps) {
  
  const [currentSeason, setCurrentSeason] = useState<1 | 2 | 3 | 4>(() => {
    // #40（最後の事件：後編）をクリアしていればSeason 4が解放
    const hasSeason4 = Object.keys(clearedData).includes('#40');
    const hasSeason3 = Object.keys(clearedData).some(id => {
      const epNum = parseInt(id.replace('#', ''), 10);
      return !isNaN(epNum) && epNum >= 30;
    });
    const hasSeason2 = Object.keys(clearedData).some(id => {
      const epNum = parseInt(id.replace('#', ''), 10);
      return !isNaN(epNum) && epNum >= 14;
    });
    return hasSeason4 ? 4 : hasSeason3 ? 3 : hasSeason2 ? 2 : 1;
  });
  
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [errorNodeId, setErrorNodeId] = useState<string | null>(null);
  const [fakeLines, setFakeLines] = useState<{x1: string, y1: string, x2: string, y2: string, opacity: number}[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<any[]>([]);

  const currentSpiderData = currentSeason === 1 ? spiderDataS1 : currentSeason === 2 ? spiderDataS2 : spiderDataS3;

  // ▼ シーズン3のフェーズ3（最終決戦）への到達判定
  const isS3Phase3 = currentSeason === 3 && 
    clearedData['#38'] && 
    ['SP-01', 'SP-02', 'SP-03', 'SP-04', 'SP-05', 'SP-06'].every(sp => clearedData[sp]);

  // ▼ シーズン4（終末時計）の進行度計算
  const s4Episodes = ['#41', '#42', '#43', '#44', '#45', '#46', '#47', '#48', '#49', '#50'];
  const s4ClearedCount = s4Episodes.filter(ep => clearedData[ep]).length;
  // 1894年から始まり、1エピソードクリアごとに2年進み、最終的に1914年（第一次大戦）に到達する
  const currentYear = 1894 + (s4ClearedCount * 2);

  useEffect(() => {
    const hasClearedEp6 = Object.keys(clearedData).includes('#06');
    const hasSeenTutorial = localStorage.getItem('tether_spider_tutorial_done');
    if (hasClearedEp6 && !hasSeenTutorial) {
      setTutorialStep(1);
    }
  }, [clearedData]);

  // バグ（ノイズ）エフェクト生成
  useEffect(() => {
    if (currentSeason === 3 && !isS3Phase3) {
      const interval = setInterval(() => {
        const lines = Array.from({ length: 12 }).map(() => ({
          x1: `${Math.random() * 100}%`,
          y1: `${Math.random() * 100}%`,
          x2: `${Math.random() * 100}%`,
          y2: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.4 + 0.1
        }));
        setFakeLines(lines);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setFakeLines([]);
    }
  }, [currentSeason, isS3Phase3]);

  // ノードの配置計算
  useEffect(() => {
    if (!containerRef.current || isS3Phase3 || currentSeason === 4) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;

    const newNodes = currentSpiderData.pins.map((pin: any, index: number) => {
      let isCleared = false;
      let isTruthUnlocked = false;
      let isDestroyed = false;

      if (currentSeason === 3) {
        isCleared = true;
        isDestroyed = !!clearedData[pin.destroyed_by];
        isTruthUnlocked = isDestroyed;
      } else {
        isCleared = Object.keys(clearedData).includes(pin.source_episode);
        isTruthUnlocked = unlockedTerms.includes(pin.required_index_id);
      }

      const angle = (index / currentSpiderData.pins.length) * Math.PI * 2;
      const radius = isTruthUnlocked ? clientWidth * 0.15 : clientWidth * 0.35;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      return { ...pin, x, y, isCleared, isTruthUnlocked, isDestroyed };
    });

    setNodes(newNodes);
  }, [clearedData, unlockedTerms, currentSpiderData, currentSeason, isS3Phase3]);

  const handleTutorialNext = () => {
    if (tutorialStep === 1) {
      setTutorialStep(2);
    } else {
      setTutorialStep(0);
      localStorage.setItem('tether_spider_tutorial_done', 'true');
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedPinId);

  return (
    <div className="relative w-full h-full flex flex-col animate-in fade-in duration-300">
      
      {/* ヘッダー領域 */}
      <div className={`flex items-end justify-between mb-4 border-b pb-2 shrink-0 ${currentSeason === 4 ? 'border-zinc-700/50' : 'border-[#8c7a6b]/30'}`}>
        <div className="flex items-center gap-3">
          <div>
            <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-widest ${currentSeason === 4 ? 'text-zinc-500' : 'text-[#8c7a6b]'}`}>
              <button 
                onClick={() => { setCurrentSeason((prev) => Math.max(1, prev - 1) as 1|2|3|4); setSelectedPinId(null); }} 
                disabled={currentSeason === 1}
                className="hover:text-amber-600 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={currentSeason === 3 ? 'text-rose-600 font-bold animate-pulse' : currentSeason === 4 ? 'text-zinc-300' : ''}>
                SEASON {currentSeason}
              </span>
              <button 
                onClick={() => { setCurrentSeason((prev) => Math.min(4, prev + 1) as 1|2|3|4); setSelectedPinId(null); }} 
                disabled={currentSeason === 4 || (!Object.keys(clearedData).includes('#40') && currentSeason === 3)}
                className="hover:text-amber-600 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold font-serif mt-1 flex items-center gap-2 ${currentSeason === 4 ? 'text-zinc-300' : 'text-[#3a2f29]'}`}>
              {currentSeason === 4 ? <Clock size={24} className="text-zinc-500" /> : <Network size={24} className={currentSeason === 3 ? 'text-rose-700' : 'text-amber-700'} />}
              {currentSeason === 4 ? 'DOOMSDAY CLOCK' : 'THE SPIDER WEB'}
            </h2>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className={`mb-1 transition-colors ${currentSeason === 4 ? 'text-zinc-600 hover:text-zinc-300' : 'text-[#8c7a6b] hover:text-amber-600'}`}
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="text-right">
          <p className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${currentSeason === 4 ? 'text-zinc-500' : 'text-[#8c7a6b]'}`}>
            {currentSeason === 4 ? 'To World War' : currentSeason === 3 ? 'Destroyed' : 'Connections'}
          </p>
          <p className={`text-lg font-bold font-mono ${currentSeason === 4 ? 'text-zinc-300' : currentSeason === 3 ? 'text-rose-600' : 'text-amber-600'}`}>
            {currentSeason === 4 ? `${s4Episodes.length - s4ClearedCount} Steps` : (isS3Phase3 ? 'ALL' : nodes.filter((n) => n.isTruthUnlocked).length + ' / ' + currentSpiderData.pins.length)}
          </p>
        </div>
      </div>

      {/* ヘルプモーダル */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-[#2a2420]/80 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
          <div className={`border-2 p-6 rounded-xl shadow-2xl max-w-md w-full relative ${currentSeason === 4 ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-[#f4ebd8] border-[#8c7a6b] text-[#3a2f29]'}`}>
            <button onClick={() => setShowHelp(false)} className={`absolute top-4 right-4 ${currentSeason === 4 ? 'text-zinc-500 hover:text-zinc-200' : 'text-[#8c7a6b] hover:text-[#3a2f29]'}`}>
              <X size={20} />
            </button>
            <h3 className={`font-serif font-bold text-lg mb-3 border-b pb-2 ${currentSeason === 4 ? 'border-zinc-700' : 'border-[#8c7a6b]/30'}`}>
              {currentSeason === 4 ? <Clock size={18} className="inline mr-2 text-zinc-500 mb-1" /> : <Network size={18} className="inline mr-2 text-amber-700 mb-1" />}
              {currentSeason === 4 ? 'DOOMSDAY CLOCK とは？' : 'THE SPIDER WEB とは？'}
            </h3>
            <p className={`text-sm leading-relaxed font-serif mb-6 ${currentSeason === 4 ? 'text-zinc-400' : 'text-[#5c4d43]'}`}>
              {currentSeason === 4 ? (
                <>モリアーティという絶対的な「論理の王」が消えた後、世界はより巨大で不条理な暴力——「国家間の戦争」へと向かっていく。<br/><br/>もはや一個人の推理力で歴史のうねりを止めることはできない。事件を解決するごとに時は進み、針は確実に関戦の年である「1914年」へと近づいていく。<br/><br/>これは、伝説の探偵が静かに幕を下ろすための、最後のカウントダウンだ。</>
              ) : currentSeason === 3 ? (
                <>もはや事件の繋がりを推理する段階ではない。<br/><br/>ロンドンの地下に張り巡らされたモリアーティのインフラストラクチャー。アイリーンや遊撃隊を指揮し、各拠点を物理的に炎上・破壊せよ。<br/><br/>すべての手足を削ぎ落とした時、盤面を持たない一対一の死闘が始まる。</>
              ) : (
                <>個々の犯罪は独立して存在しているのではない。ロンドンの地下には、それらを繋ぐ巨大な蜘蛛の巣が張り巡らされている。<br/><br/>大索引（THE GREAT INDEX）での解析が進み、特定の用語を解読することで、この画面の事件（点）が中央の黒幕へと線で結ばれていく。</>
              )}
            </p>
            <button onClick={() => setShowHelp(false)} className={`w-full font-bold py-3 rounded-full text-sm tracking-widest active:scale-95 shadow-md ${currentSeason === 4 ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' : 'bg-[#5c4d43] text-[#f4ebd8] hover:bg-[#3a2f29]'}`}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* メイン描画エリア */}
      <div
        ref={containerRef}
        className={`flex-1 rounded-xl border relative overflow-hidden shadow-inner ${
          currentSeason === 4 ? 'bg-zinc-950 border-zinc-800' : currentSeason === 3 ? 'bg-[#2a2420] border-rose-900/50' : 'bg-[#2a2420] border-[#3a2f29]'
        }`}
        onClick={() => { if (tutorialStep === 0) setSelectedPinId(null); }}
      >
        {/* ▼ フェーズ4（終末時計）の描画 ▼ */}
        {currentSeason === 4 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-1000">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-700/20 via-zinc-950 to-black" />
            
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mt-4">
              {/* 文字盤の外枠 */}
              <div className="absolute inset-0 rounded-full border-4 border-zinc-800 shadow-[0_0_40px_rgba(39,39,42,0.8)]" />
              <div className="absolute inset-2 rounded-full border border-zinc-800/50" />
              
              {/* 時計の目盛り */}
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 6}deg)` }}>
                  <div className={`mx-auto ${i % 5 === 0 ? 'w-1 h-4 bg-zinc-600 mt-2' : 'w-0.5 h-2 bg-zinc-800 mt-2'}`} />
                </div>
              ))}

              {/* 時計の針（-120度から0度へ動く） */}
              <div className="absolute inset-0 flex justify-center drop-shadow-[0_0_10px_rgba(212,212,216,0.3)]">
                <div 
                  className="w-1.5 h-1/2 bg-zinc-400 origin-bottom rounded-t-full transition-transform duration-[2000ms] ease-out"
                  style={{ transform: `rotate(${(s4ClearedCount / 10) * 120 - 120}deg)` }}
                />
              </div>
              
              {/* 中心点 */}
              <div className="w-6 h-6 bg-zinc-900 border-2 border-zinc-500 rounded-full z-10 shadow-md" />

              {/* 年号表示 */}
              <div className="absolute bottom-10 flex flex-col items-center animate-in fade-in zoom-in duration-1000 delay-500">
                <span className="text-zinc-600 font-mono text-[10px] tracking-[0.3em] uppercase mb-1">Current Year</span>
                <span className={`text-4xl font-serif font-black tracking-widest transition-colors duration-1000 ${currentYear >= 1914 ? 'text-rose-900' : 'text-zinc-300'}`}>
                  {currentYear}
                </span>
                {currentYear >= 1914 && (
                  <span className="mt-2 text-xs font-mono text-rose-900/80 tracking-widest border border-rose-900/30 px-2 py-1 rounded bg-rose-950/20">
                    HIS LAST BOW
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : isS3Phase3 ? (
          /* ▼ フェーズ3（最終決戦）の描画 ▼ */
          <div className="absolute inset-0 bg-black z-10 flex flex-col items-center justify-center animate-in fade-in duration-1000">
            <svg className="absolute inset-0 w-full h-full">
              <line x1="25%" y1="45%" x2="75%" y2="45%" stroke="#e11d48" strokeWidth="4" className="animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(225,29,72,1)]" />
            </svg>
            <div className="absolute top-[45%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 bg-blue-950 border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                <span className="text-blue-100 font-serif font-bold text-xs tracking-widest">HOLMES</span>
              </div>
            </div>
            <div className="absolute top-[45%] left-[75%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 bg-rose-950 border-2 border-rose-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.8)]">
                <span className="text-rose-100 font-serif font-bold text-xs tracking-widest">M.C.</span>
              </div>
            </div>
            <div className="absolute bottom-12 text-rose-600 font-mono text-[10px] sm:text-xs tracking-[0.3em] animate-pulse text-center w-full px-4">
              ALL INFRASTRUCTURE DESTROYED.<br/>ONLY KILLING INTENT REMAINS.
            </div>
          </div>
        ) : (
          /* ▼ 通常＆フェーズ1/2の描画 ▼ */
          <>
            <div className={`absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${currentSeason === 3 ? 'from-rose-900/30' : 'from-amber-700/20'} via-[#2a2420] to-black`} />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className={`w-[80%] h-[80%] border rounded-full absolute ${currentSeason === 3 ? 'border-rose-900/40' : 'border-[#8c7a6b]/30'}`} />
              <div className={`w-[50%] h-[50%] border rounded-full absolute ${currentSeason === 3 ? 'border-rose-900/40' : 'border-[#8c7a6b]/30'}`} />
            </div>

            {currentSeason === 3 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {fakeLines.map((line, i) => (
                  <line key={`fake-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#e11d48" strokeWidth="1" opacity={line.opacity} />
                ))}
              </svg>
            )}

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {nodes.map((node) => {
                if (!node.isCleared || !containerRef.current) return null;
                const { clientWidth, clientHeight } = containerRef.current;
                const centerX = clientWidth / 2;
                const centerY = clientHeight / 2;
                return (
                  <line
                    key={`line-${node.id}`}
                    x1={node.x} y1={node.y} x2={centerX} y2={centerY}
                    stroke={currentSeason === 3 ? (node.isDestroyed ? '#3f1d1d' : '#e11d48') : (node.isTruthUnlocked ? '#d97706' : '#5c4d43')}
                    strokeWidth={currentSeason === 3 ? (node.isDestroyed ? 1 : 2) : (node.isTruthUnlocked ? 2 : 1)}
                    strokeDasharray={currentSeason === 3 ? (node.isDestroyed ? '4 4' : 'none') : (node.isTruthUnlocked ? 'none' : '4 4')}
                    className={currentSeason === 3 && !node.isDestroyed ? 'animate-[pulse_0.5s_infinite]' : 'transition-all duration-1000'}
                  />
                );
              })}
            </svg>

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
              <div className={`w-12 h-12 bg-[#1a1512] border-2 rounded-full flex items-center justify-center ${currentSeason === 3 ? 'border-rose-700 shadow-[0_0_30px_rgba(225,29,72,0.4)]' : 'border-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.3)]'}`}>
                <span className={`${currentSeason === 3 ? 'text-rose-500' : 'text-amber-500'} font-serif font-bold text-lg`}>M.C.</span>
              </div>
            </div>

            {nodes.map((node) => {
              if (!node.isCleared) return null;
              const isSelected = selectedPinId === node.id;
              const isErrorShake = errorNodeId === node.id;
              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 p-4 sm:p-6 ${isErrorShake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
                  style={{ left: node.x, top: node.y }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tutorialStep > 0) return;
                    setSelectedPinId(node.id);
                    if (!node.isTruthUnlocked) { setErrorNodeId(node.id); setTimeout(() => setErrorNodeId(null), 400); }
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 mx-auto flex items-center justify-center ${
                    isSelected
                      ? (currentSeason === 3 ? 'bg-rose-500 border-rose-200 scale-150 shadow-[0_0_20px_rgba(225,29,72,0.8)]' : 'bg-amber-400 border-[#f4ebd8] scale-150 shadow-[0_0_15px_rgba(251,191,36,0.5)]')
                      : currentSeason === 3
                        ? (node.isDestroyed ? 'bg-[#1a1512] border-[#3f1d1d]' : 'bg-rose-800 border-rose-400 animate-pulse hover:scale-125')
                        : (node.isTruthUnlocked ? 'bg-amber-700 border-amber-400 hover:scale-125' : 'bg-[#5c4d43] border-[#8c7a6b] hover:scale-125 hover:bg-[#8c7a6b]')
                  }`}>
                    {currentSeason === 3 && node.isDestroyed && <Flame size={10} className="text-rose-900" />}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-max text-center pointer-events-none">
                    <p className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${currentSeason === 3 && node.isDestroyed ? 'text-rose-900 bg-black/80 line-through' : 'text-[#d8c8b8] bg-[#1a1512]/80'}`}>
                      {node.source_episode}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ノード詳細パネル */}
        {selectedNode && !isS3Phase3 && currentSeason !== 4 && (
          <div className={`absolute bottom-4 left-4 right-4 bg-[#f4ebd8]/95 border-l-4 p-4 rounded-xl shadow-2xl z-30 backdrop-blur-md animate-in slide-in-from-bottom-4 ${
              currentSeason === 3 ? (selectedNode.isTruthUnlocked ? 'border-rose-900' : 'border-rose-500') : (selectedNode.isTruthUnlocked ? 'border-amber-600' : 'border-[#8c7a6b]')
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2 border-b border-[#8c7a6b]/30 pb-2">
              <div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full mr-2 ${
                  currentSeason === 3 
                    ? (selectedNode.isTruthUnlocked ? 'text-rose-200 bg-rose-950' : 'text-rose-900 bg-rose-200')
                    : (selectedNode.isTruthUnlocked ? 'text-amber-800 bg-amber-200/50' : 'text-[#5c4d43] bg-[#d8c8b8]/50')
                }`}>
                  {selectedNode.source_episode}
                </span>
                <span className="text-xs font-bold text-[#8c7a6b] font-mono">{selectedNode.id.toUpperCase()}</span>
              </div>
              <button onClick={() => setSelectedPinId(null)} className="text-[#8c7a6b] hover:text-[#3a2f29] p-1"><X size={16} /></button>
            </div>
            <h3 className={`font-serif font-bold text-lg mb-3 ${selectedNode.isTruthUnlocked && currentSeason === 3 ? 'text-rose-900 line-through decoration-rose-500/50' : 'text-[#3a2f29]'}`}>
              {selectedNode.title}
            </h3>
            {!selectedNode.isTruthUnlocked ? (
              <div className={`p-3 rounded-lg border relative overflow-hidden ${currentSeason === 3 ? 'bg-rose-900/10 border-rose-500/30' : 'bg-[#e6d5c3]/50 border-[#8c7a6b]/20'}`}>
                <div className={`flex items-center gap-2 mb-2 ${currentSeason === 3 ? 'text-rose-600' : 'text-[#8c7a6b]'}`}>
                  <Lock size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">{currentSeason === 3 ? 'Active Infrastructure' : 'Encrypted Query'}</span>
                </div>
                <p className="text-sm text-[#5c4d43] italic mb-3 font-serif">{selectedNode.question}</p>
                <div className={`flex items-center justify-end gap-1 text-[9px] font-mono py-1.5 px-2 rounded-full w-fit ml-auto border ${currentSeason === 3 ? 'text-rose-600 bg-rose-100 border-rose-200' : 'text-amber-700 bg-amber-600/10 border-amber-600/20'}`}>
                  <AlertCircle size={12} />
                  {currentSeason === 3 ? `[${selectedNode.destroyed_by}] をクリアしてインフラを破壊せよ` : `大索引で [${selectedNode.required_index_id}] を解読せよ`}
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-lg border animate-in fade-in ${currentSeason === 3 ? 'bg-black/5 border-rose-900/30' : 'bg-amber-600/10 border-amber-600/20'}`}>
                <div className={`flex items-center gap-2 mb-2 ${currentSeason === 3 ? 'text-rose-800' : 'text-amber-700'}`}>
                  {currentSeason === 3 ? <Flame size={14} /> : <Network size={14} />}
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">{currentSeason === 3 ? 'Infrastructure Destroyed' : 'Truth Unlocked'}</span>
                </div>
                <p className="text-sm font-bold text-[#3a2f29] mb-2">{selectedNode.unlocked_truth.node_title}</p>
                <p className="text-sm text-[#5c4d43] leading-relaxed font-serif">{selectedNode.unlocked_truth.hidden_note}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}