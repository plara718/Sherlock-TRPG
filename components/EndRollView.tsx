'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Award, ChevronRight } from 'lucide-react';
import glossaryData from '@/data/glossary.json';
import { useSaveData } from '@/lib/SaveDataContext'; // 追加

export default function EndRollView() {
  // ▼ Contextから直接データを取得
  const { unlockedTerms, insightPoints, setView } = useSaveData();

  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0: 暗転, 1: 手紙, 2: リザルト
  const [letterVisible, setLetterVisible] = useState(false);

  // 大索引の収集率計算
  const unlockedCount = unlockedTerms.length;
  const totalCount = glossaryData.terms.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100) || 0;

  // 称号の判定
  const getTitle = () => {
    if (unlockPercentage === 100) return "THE UNOFFICIAL CHRONICLER (真実の記録者)";
    if (unlockPercentage >= 80) return "TRUSTED PARTNER (信頼すべき相棒)";
    return "THE GOOD DOCTOR (善良なる医師)";
  };

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase(1);
      setTimeout(() => setLetterVisible(true), 1000);
    }, 2000);
    return () => clearTimeout(timer1);
  }, []);

  const showResult = () => {
    setLetterVisible(false);
    setTimeout(() => setPhase(2), 1000);
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-[#1a1512] text-[#f4ebd8] font-serif overflow-hidden relative">
      
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stucco.png')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#1a1512_100%)] pointer-events-none" />

      {phase === 1 && (
        <div className={`max-w-xl w-full px-8 transition-opacity duration-1000 ${letterVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="space-y-6 text-sm sm:text-base leading-loose text-[#d8c8b8] tracking-widest">
            <p className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-[500ms] fill-mode-both">親愛なるワトスンへ。</p>
            <p className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-[2500ms] fill-mode-both">サセックスの海風は冷たいが、私の蜜蜂たちは元気にしている。<br />ロンドンの喧騒も、かつての凶悪な犯罪者たちも、今では遠い昔の幻のようだ。</p>
            <p className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-[5000ms] fill-mode-both">君が残してくれた数々の記録を読み返すたび、<br />私は自分の不完全な論理が、君という温かい人間性にどれほど救われていたかを痛感している。</p>
            <p className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-[8000ms] fill-mode-both">時代は変わり、論理だけでは解決できない不条理な暴力が世界を覆っている。<br />だが、我々が守り抜いたものは、君の記録と共に、確かに次の世代へ受け継がれていくはずだ。</p>
            <p className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-[11500ms] fill-mode-both">長い間、本当にありがとう。<br />君は最高の相棒だった。</p>
            <div className="pt-8 text-right animate-in fade-in duration-1000 delay-[14000ms] fill-mode-both">
              <p className="italic text-[#8c7a6b]">敬意を込めて。</p>
              <p className="text-lg mt-2 font-bold">シャーロック・ホームズ</p>
            </div>
          </div>
          <div className="mt-16 text-center animate-in fade-in duration-1000 delay-[17000ms] fill-mode-both">
            <button onClick={showResult} className="text-[#8c7a6b] hover:text-[#f4ebd8] text-sm tracking-widest flex items-center gap-2 mx-auto transition-colors">手紙を閉じる <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {phase === 2 && (
        <div className="max-w-md w-full px-6 animate-in zoom-in-95 fade-in duration-1000">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-[0.2em] mb-2 uppercase border-b border-[#8c7a6b]/30 pb-4 inline-block">FINAL RESULT</h1>
            <p className="text-[#8c7a6b] font-mono text-xs tracking-widest mt-2">CONNECTION TERMINATED</p>
          </div>

          <div className="space-y-6">
            <div className="bg-[#2a2420] border border-[#8c7a6b]/30 rounded-xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent opacity-50" />
              <Award className="mx-auto mb-3 text-amber-600" size={32} />
              <p className="text-[10px] font-mono text-[#8c7a6b] mb-1 uppercase tracking-widest">Final Title</p>
              <p className="text-lg font-bold text-amber-500 tracking-wider">{getTitle()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#2a2420] border border-[#8c7a6b]/30 rounded-xl p-5 text-center shadow-md">
                <BookOpen className="mx-auto mb-2 text-[#8c7a6b]" size={24} />
                <p className="text-[10px] font-mono text-[#8c7a6b] mb-1 uppercase tracking-widest">Index Restored</p>
                <p className="text-2xl font-bold text-[#d8c8b8] font-mono">{unlockPercentage}%</p>
                <p className="text-[9px] text-[#8c7a6b] mt-1 font-mono">({unlockedCount} / {totalCount})</p>
              </div>

              <div className="bg-[#2a2420] border border-[#8c7a6b]/30 rounded-xl p-5 text-center shadow-md">
                <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-[#8c7a6b] flex items-center justify-center text-[10px] font-bold text-[#8c7a6b]">pt</div>
                <p className="text-[10px] font-mono text-[#8c7a6b] mb-1 uppercase tracking-widest">Insight Points</p>
                <p className="text-2xl font-bold text-[#d8c8b8] font-mono">{insightPoints}</p>
                <p className="text-[9px] text-[#8c7a6b] mt-1 font-mono">Total Earned</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            {unlockPercentage < 100 && <p className="text-[#8c7a6b] text-xs mb-4 tracking-widest">※まだ解読されていない大索引データが存在します。</p>}
            {/* ▼ ContextのsetViewを使用してタイトルへ戻る */}
            <button onClick={() => setView('title')} className="bg-[#d8c8b8] text-[#1a1512] hover:bg-white font-bold py-3 px-8 rounded-full tracking-widest transition-transform active:scale-95 shadow-lg w-full sm:w-auto">TITLE MENU へ戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}