'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Network, Lock, HelpCircle, X } from 'lucide-react';
import spiderData from '@/data/spider_web.json';
import glossaryData from '@/data/glossary.json';

type ClearedData = {
  [epId: string]: { rank: string; tether: number };
};

type SpiderWebTabProps = {
  clearedData: ClearedData;
  unlockedTerms: string[];
};

export default function SpiderWebTab({
  clearedData,
  unlockedTerms,
}: SpiderWebTabProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // チュートリアル用のステート管理
  const [tutorialStep, setTutorialStep] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<any[]>([]);

  // クリア状況からチュートリアルの発火を判定
  useEffect(() => {
    const hasClearedEp6 = Object.keys(clearedData).includes('#06');
    const hasSeenTutorial = localStorage.getItem('tether_spider_tutorial_done');
    
    if (hasClearedEp6 && !hasSeenTutorial) {
      setTutorialStep(1);
    }
  }, [clearedData]);

  // 初期ノードの配置計算
  useEffect(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const centerX = clientWidth / 2;
    const centerY = clientHeight / 2;

    const newNodes = spiderData.pins.map((pin: any, index: number) => {
      const isCleared = Object.keys(clearedData).includes(pin.source_episode);
      const isTruthUnlocked = unlockedTerms.includes(pin.required_index_id);

      const angle = (index / spiderData.pins.length) * Math.PI * 2;
      const radius = isTruthUnlocked ? clientWidth * 0.15 : clientWidth * 0.35;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      return {
        ...pin,
        x,
        y,
        isCleared,
        isTruthUnlocked,
      };
    });

    setNodes(newNodes);
  }, [clearedData, unlockedTerms]);

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
      <div className="flex items-end justify-between mb-4 border-b border-slate-300 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-slate-600 text-[10px] sm:text-xs font-mono">
              相関図 - 暗躍する影のネットワーク
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mt-1 flex items-center gap-2">
              <Network size={24} className="text-amber-700" />
              THE SPIDER WEB
            </h2>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className="mb-1 text-slate-400 hover:text-amber-600 transition-colors"
            title="この画面について"
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
            Connections
          </p>
          <p className="text-lg font-bold text-amber-600 font-mono">
            {nodes.filter((n) => n.isTruthUnlocked).length} / {nodes.length}
          </p>
        </div>
      </div>

      {/* ヘルプモーダル */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#f4ecd8] border-2 border-amber-700 p-6 rounded shadow-2xl max-w-md w-full relative">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-3 border-b border-slate-300 pb-2">
              <Network size={18} className="inline mr-2 text-amber-700 mb-1" />
              THE SPIDER WEB とは？
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed font-serif mb-4">
              個々の犯罪は独立して存在しているのではない。ロンドンの地下には、それらを繋ぐ巨大な蜘蛛の巣が張り巡らされている。<br/><br/>
              ここでは、解決した事件から得られた『署名』や『技術的共通点』をマッピングしている。大索引（THE GREAT INDEX）での解析が進み、特定の用語を解読することで、この画面の事件（点）が中央の黒幕へと線で結ばれていく。<br/><br/>
              すべての線が中央へと収束する時、君は犯罪界のナポレオンが構築した、冷徹な数学的ネットワークの正体に辿り着くことになるだろう。
            </p>
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full bg-slate-800 text-amber-500 font-bold py-2 rounded text-sm tracking-widest hover:bg-slate-700 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* チュートリアルオーバーレイ */}
      {tutorialStep > 0 && (
        <div className="absolute inset-0 z-[60] bg-black/70 flex items-center justify-center pointer-events-none animate-in fade-in">
          <div className="bg-slate-900 border-2 border-amber-500 p-6 rounded-lg shadow-[0_0_30px_rgba(245,158,11,0.3)] max-w-sm pointer-events-auto text-center transform -translate-y-12">
            <h3 className="text-amber-500 font-bold font-mono text-sm tracking-widest mb-3 border-b border-amber-500/30 pb-2">
              SYSTEM INTERCEPT
            </h3>
            <p className="text-slate-200 font-serif text-sm leading-relaxed mb-6">
              {tutorialStep === 1 && "「ワトスン、これまでの事件を単なる偶然だと思っていないか？ ブリキ箱に眠っていた奇妙な記録群……それらを今こそ一つに繋ぎ合わせる時だ。」"}
              {tutorialStep === 2 && "「見ろ。大索引のデータと照合することで、無関係に見えた事件が中央の『M.C.』という一つの重力源へ引き寄せられていく。ロンドンの地下には巨大な蜘蛛の巣が張られているのだ。」"}
            </p>
            <button 
              onClick={handleTutorialNext}
              className="bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded text-xs tracking-widest transition-all active:scale-95"
            >
              {tutorialStep === 1 ? "NEXT" : "UNDERSTOOD (確認)"}
            </button>
          </div>
        </div>
      )}

      {/* ネットワーク描画エリア */}
      <div
        ref={containerRef}
        className={`flex-1 bg-slate-900 rounded-lg border-2 border-slate-700 relative overflow-hidden shadow-inner ${tutorialStep === 1 ? 'ring-4 ring-amber-500/50 animate-pulse' : ''}`}
        onClick={() => setSelectedPinId(null)}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-900 to-black" />
        
        {/* 背景の同心円グリッド */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-[80%] h-[80%] border border-amber-500 rounded-full absolute" />
          <div className="w-[50%] h-[50%] border border-amber-500 rounded-full absolute" />
          <div className="w-[20%] h-[20%] border border-amber-500 rounded-full absolute bg-amber-900/20" />
        </div>

        {/* 接続線の描画 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {nodes.map((node) => {
            if (!node.isCleared) return null;
            if (!containerRef.current) return null;

            const { clientWidth, clientHeight } = containerRef.current;
            const centerX = clientWidth / 2;
            const centerY = clientHeight / 2;

            return (
              <line
                key={`line-${node.id}`}
                x1={node.x}
                y1={node.y}
                x2={centerX}
                y2={centerY}
                stroke={node.isTruthUnlocked ? '#d97706' : '#334155'}
                strokeWidth={node.isTruthUnlocked ? 2 : 1}
                strokeDasharray={node.isTruthUnlocked ? 'none' : '4 4'}
                className="transition-all duration-1000 ease-in-out"
              />
            );
          })}
        </svg>

        {/* 中央のコアノード */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
          <div className="w-12 h-12 bg-black border-2 border-amber-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(180,83,9,0.5)]">
            <span className="text-amber-500 font-serif font-bold text-lg">
              M.C.
            </span>
          </div>
          <span className="mt-2 text-[10px] font-mono text-amber-700 bg-black/50 px-2 py-0.5 rounded tracking-widest border border-amber-900/50">
            THE CORE
          </span>
        </div>

        {/* 各事件ノードの配置 */}
        {nodes.map((node) => {
          if (!node.isCleared) return null;
          const isSelected = selectedPinId === node.id;

          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-500 ease-out"
              style={{ left: node.x, top: node.y }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPinId(node.id);
              }}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  isSelected
                    ? 'bg-amber-400 border-white scale-150 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                    : node.isTruthUnlocked
                    ? 'bg-amber-700 border-amber-400 hover:scale-125'
                    : 'bg-slate-700 border-slate-500 hover:scale-125 hover:bg-slate-600'
                }`}
              />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max text-center pointer-events-none">
                <p className="text-[9px] font-mono text-slate-400 bg-black/60 px-1 rounded">
                  {node.source_episode}
                </p>
              </div>
            </div>
          );
        })}

        {/* ノード詳細パネル */}
        {selectedNode && (
          <div
            className="absolute bottom-4 left-4 right-4 bg-slate-800/95 border-l-4 border-amber-600 p-4 rounded shadow-2xl z-30 backdrop-blur-sm animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2 border-b border-slate-600 pb-2">
              <div>
                <span className="text-[10px] font-mono text-amber-500 bg-amber-900/30 px-2 py-0.5 rounded mr-2">
                  {selectedNode.source_episode}
                </span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {selectedNode.id.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedPinId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="font-serif font-bold text-lg text-white mb-2">
              {selectedNode.title}
            </h3>

            {!selectedNode.isTruthUnlocked ? (
              <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Lock size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">
                    Encrypted Query
                  </span>
                </div>
                <p className="text-sm text-slate-300 italic">
                  {selectedNode.question}
                </p>
                <div className="mt-3 text-[10px] text-amber-700 font-mono text-right">
                  * 大索引で関連データ [{selectedNode.required_index_id}] を解読せよ
                </div>
              </div>
            ) : (
              <div className="bg-amber-900/20 p-3 rounded border border-amber-700/50 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <Network size={14} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">
                    Truth Unlocked
                  </span>
                </div>
                <p className="text-sm font-bold text-amber-400 mb-2">
                  {selectedNode.unlocked_truth.node_title}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed font-serif">
                  {selectedNode.unlocked_truth.hidden_note}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}