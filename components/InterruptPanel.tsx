'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, BrainCircuit, HeartHandshake, Clock, HelpCircle, Sparkles } from 'lucide-react';

type InterruptPanelProps = {
  collectedEvidences: string[];
  hintText?: string;
  canUseIrene?: boolean; 
  ireneUsed?: boolean;   
  onUseIrene?: () => void; 
  onSubmit: (skill: string, evidence: string | null) => void;
  onTimeUp: () => void;
  protagonist?: string; // ← 追加
};

export default function InterruptPanel({
  collectedEvidences,
  hintText,
  canUseIrene,
  ireneUsed,
  onUseIrene,
  onSubmit,
  onTimeUp,
  protagonist = 'watson',
}: InterruptPanelProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showHint, setShowHint] = useState(false);

  const isIrene = protagonist === 'irene';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onTimeUp]);

  return (
    <div className={`p-4 sm:p-5 bg-[#1a1512] border-t-4 shadow-[0_-10px_30px_rgba(159,18,57,0.3)] animate-in slide-in-from-bottom-4 relative overflow-hidden ${isIrene ? 'border-fuchsia-800' : 'border-rose-800'}`}>
      
      {/* 背景の薄い警告ノイズ */}
      <div className={`absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(159,18,57,0.2)_10px,rgba(159,18,57,0.2)_20px)] ${isIrene ? 'hue-rotate-[280deg]' : ''}`} />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`${isIrene ? 'text-fuchsia-400' : 'text-rose-500'} font-bold tracking-widest flex items-center gap-2 font-mono uppercase text-sm sm:text-base`}>
            <ShieldAlert size={18} className="animate-pulse" />
            {isIrene ? 'Detect Flaw' : 'Detect Hallucination'}
          </h3>
          <div className={`font-mono text-xl sm:text-2xl font-bold flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border ${timeLeft <= 5 ? 'text-rose-500 animate-pulse border-rose-900/50' : 'text-[#d8c8b8] border-[#5c4d43]'}`}>
            <Clock size={18} /> 00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-[#8c7a6b] mb-5 font-mono leading-relaxed">
          {isIrene 
            ? '敵の慢心を突け。相手の隙となる視点と、それを証明する証拠を突きつけなさい。' 
            : '天才の暴走を繋ぎ止めろ。適切な視点と裏付けとなる証拠を提示せよ。'}
        </p>

        {/* スキル選択 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          <button
            onClick={() => setSelectedSkill('SCOPE')}
            className={`flex flex-col items-center py-3 sm:py-4 rounded-xl border-2 transition-all active:scale-95 ${
              selectedSkill === 'SCOPE'
                ? 'bg-blue-900/30 border-blue-500/80 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'bg-[#2a2420] border-[#3a2f29] text-[#8c7a6b] hover:border-[#5c4d43] hover:text-[#d8c8b8]'
            }`}
          >
            <Fingerprint size={22} className="mb-1.5" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wider">SCOPE</span>
          </button>
          
          <button
            onClick={() => setSelectedSkill('LOGIC')}
            className={`flex flex-col items-center py-3 sm:py-4 rounded-xl border-2 transition-all active:scale-95 ${
              selectedSkill === 'LOGIC'
                ? 'bg-emerald-900/30 border-emerald-500/80 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-[#2a2420] border-[#3a2f29] text-[#8c7a6b] hover:border-[#5c4d43] hover:text-[#d8c8b8]'
            }`}
          >
            <BrainCircuit size={22} className="mb-1.5" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wider">LOGIC</span>
          </button>
          
          <button
            onClick={() => setSelectedSkill('HEART')}
            className={`flex flex-col items-center py-3 sm:py-4 rounded-xl border-2 transition-all active:scale-95 ${
              selectedSkill === 'HEART'
                ? 'bg-amber-900/30 border-amber-500/80 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-[#2a2420] border-[#3a2f29] text-[#8c7a6b] hover:border-[#5c4d43] hover:text-[#d8c8b8]'
            }`}
          >
            <HeartHandshake size={22} className="mb-1.5" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wider">HEART</span>
          </button>
        </div>

        {/* 証拠選択とヒント */}
        <div className="mb-6">
          <div className="text-[10px] sm:text-xs text-[#8c7a6b] font-mono mb-3 flex justify-between items-center">
            <span className="tracking-widest">SELECT EVIDENCE:</span>
            
            {hintText && !canUseIrene && (
              <button onClick={() => setShowHint(!showHint)} className="text-amber-600 flex items-center gap-1 hover:text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-900/50">
                <HelpCircle size={12} /> HINT
              </button>
            )}
            
            {/* アイリーン視点の時は、自分自身の囁き機能を使えなくする */}
            {canUseIrene && !ireneUsed && !isIrene && (
              <button 
                onClick={() => { setShowHint(true); if (onUseIrene) onUseIrene(); }} 
                className="text-fuchsia-400 flex items-center gap-1.5 font-bold animate-pulse px-3 py-1 border border-fuchsia-800 rounded-full bg-fuchsia-900/30 hover:bg-fuchsia-900/50 active:scale-95 shadow-[0_0_10px_rgba(192,38,211,0.2)]"
              >
                <Sparkles size={12} /> IRENE'S WHISPER
              </button>
            )}
            
            {canUseIrene && ireneUsed && !isIrene && (
              <span className="text-fuchsia-900 flex items-center gap-1 font-bold opacity-60">
                 <Sparkles size={12} /> IRENE (USED)
              </span>
            )}
          </div>
          
          {showHint && hintText && (
            <div className={`p-3 sm:p-4 mb-4 rounded-lg text-[10px] sm:text-xs font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 shadow-inner ${
              ireneUsed ? 'bg-fuchsia-950/50 text-fuchsia-200 border border-fuchsia-800/50' : 'bg-[#2a2420] text-amber-200 border border-amber-900/50'
            }`}>
              {ireneUsed ? `「あら、見逃しているわよワトスン先生。彼の目は節穴ね…… ${hintText}」` : hintText}
            </div>
          )}

          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
            {collectedEvidences.length === 0 && (
              <span className="text-xs text-[#5c4d43] italic font-serif">No evidence collected...</span>
            )}
            {collectedEvidences.map(ev => (
              <button
                key={ev}
                onClick={() => setSelectedEvidence(prev => prev === ev ? null : ev)}
                className={`text-[10px] sm:text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                  selectedEvidence === ev
                    ? 'bg-rose-900 border-rose-500 text-rose-100 shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                    : 'bg-[#2a2420] border-[#3a2f29] text-[#d8c8b8] hover:border-[#5c4d43]'
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { if (selectedSkill) onSubmit(selectedSkill, selectedEvidence); }}
          disabled={!selectedSkill}
          className={`w-full py-3.5 sm:py-4 disabled:bg-[#2a2420] disabled:text-[#5c4d43] disabled:border disabled:border-[#3a2f29] disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase rounded-full shadow-lg transition-transform flex items-center justify-center gap-2 active:scale-95 text-sm ${
            isIrene ? 'bg-fuchsia-800 hover:bg-fuchsia-700' : 'bg-rose-800 hover:bg-rose-700'
          }`}
        >
          {isIrene ? 'Counter The Threat' : 'Tether The Genius'}
        </button>
      </div>
    </div>
  );
}