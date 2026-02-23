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
};

export default function InterruptPanel({
  collectedEvidences,
  hintText,
  canUseIrene,
  ireneUsed,
  onUseIrene,
  onSubmit,
  onTimeUp,
}: InterruptPanelProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showHint, setShowHint] = useState(false);

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
    <div className="p-4 bg-slate-900 border-t-4 border-red-800 shadow-[0_-10px_20px_rgba(153,27,27,0.3)] animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-red-500 font-bold tracking-widest flex items-center gap-2 font-mono uppercase">
          <ShieldAlert size={18} className="animate-pulse" />
          Detect Hallucination
        </h3>
        <div className={`font-mono text-xl font-bold flex items-center gap-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
          <Clock size={18} /> 00:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-400 mb-4 font-mono">
        天才の暴走を繋ぎ止めろ。適切な視点と裏付けとなる証拠を提示せよ。
      </p>

      {/* スキル選択 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => setSelectedSkill('SCOPE')}
          className={`flex flex-col items-center py-3 rounded border-2 transition-all ${
            selectedSkill === 'SCOPE'
              ? 'bg-blue-900/50 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
              : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
          }`}
        >
          <Fingerprint size={20} className="mb-1" />
          <span className="text-[10px] font-bold tracking-wider">SCOPE</span>
        </button>
        <button
          onClick={() => setSelectedSkill('LOGIC')}
          className={`flex flex-col items-center py-3 rounded border-2 transition-all ${
            selectedSkill === 'LOGIC'
              ? 'bg-green-900/50 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
              : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
          }`}
        >
          <BrainCircuit size={20} className="mb-1" />
          <span className="text-[10px] font-bold tracking-wider">LOGIC</span>
        </button>
        <button
          onClick={() => setSelectedSkill('HEART')}
          className={`flex flex-col items-center py-3 rounded border-2 transition-all ${
            selectedSkill === 'HEART'
              ? 'bg-amber-900/50 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
          }`}
        >
          <HeartHandshake size={20} className="mb-1" />
          <span className="text-[10px] font-bold tracking-wider">HEART</span>
        </button>
      </div>

      {/* 証拠選択とヒント（アイリーン機能） */}
      <div className="mb-4">
        <div className="text-[10px] text-slate-500 font-mono mb-2 flex justify-between items-center">
          <span>SELECT EVIDENCE:</span>
          {hintText && !canUseIrene && (
            <button onClick={() => setShowHint(!showHint)} className="text-amber-500 flex items-center gap-1 hover:text-amber-400">
              <HelpCircle size={12} /> HINT
            </button>
          )}
          {canUseIrene && !ireneUsed && (
            <button 
              onClick={() => {
                setShowHint(true);
                if (onUseIrene) onUseIrene();
              }} 
              className="text-fuchsia-400 flex items-center gap-1 hover:text-fuchsia-300 font-bold animate-pulse px-2 py-0.5 border border-fuchsia-800 rounded bg-fuchsia-900/20"
            >
              <Sparkles size={12} /> IRENE'S WHISPER
            </button>
          )}
          {canUseIrene && ireneUsed && (
            <span className="text-fuchsia-700 flex items-center gap-1 font-bold opacity-60">
               <Sparkles size={12} /> IRENE (USED)
            </span>
          )}
        </div>
        
        {showHint && hintText && (
          <div className={`p-2 mb-3 rounded text-[10px] sm:text-xs font-serif leading-relaxed ${ireneUsed ? 'bg-fuchsia-950 text-fuchsia-200 border border-fuchsia-700 shadow-inner' : 'bg-slate-800 text-amber-200 border border-amber-900'}`}>
            {ireneUsed ? `「あら、見逃しているわよワトスン先生。彼の目は節穴ね…… ${hintText}」` : hintText}
          </div>
        )}

        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
          {collectedEvidences.length === 0 && (
            <span className="text-xs text-slate-600 italic">No evidence collected...</span>
          )}
          {collectedEvidences.map(ev => (
            <button
              key={ev}
              onClick={() => setSelectedEvidence(prev => prev === ev ? null : ev)}
              className={`text-[10px] px-2 py-1.5 rounded border transition-all ${
                selectedEvidence === ev
                  ? 'bg-red-900 border-red-500 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400'
              }`}
            >
              {ev}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (selectedSkill) onSubmit(selectedSkill, selectedEvidence);
        }}
        disabled={!selectedSkill}
        className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase rounded shadow-lg transition-colors flex items-center justify-center gap-2 active:scale-95"
      >
        Tether The Genius
      </button>
    </div>
  );
}