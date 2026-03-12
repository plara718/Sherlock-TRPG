'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Fingerprint, BrainCircuit, HeartHandshake, HelpCircle, Sparkles, Mail, Users, Network, Calculator, Eye, EyeOff } from 'lucide-react';

type InterruptPanelProps = {
  collectedEvidences: string[];
  hintText?: string;
  interventionType?: 'Irene' | 'Mycroft' | 'Wiggins' | null;
  isInterventionAvailable?: boolean;
  interventionUsed?: boolean;
  onUseIntervention?: () => void;
  onSubmit: (skill: string, evidence: string | null) => void;
  onTimeUp: () => void;
  protagonist?: string;
  uiLabels: { gaugeName: string; actionButton: string };
  isMoriarty?: boolean;
  isEvidenceRequired?: boolean;
};

export default function InterruptPanel({
  collectedEvidences,
  hintText,
  interventionType,
  isInterventionAvailable,
  interventionUsed,
  onUseIntervention,
  onSubmit,
  onTimeUp,
  protagonist = 'watson',
  uiLabels,
  isMoriarty = false,
  isEvidenceRequired = false,
}: InterruptPanelProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const isIrene = protagonist === 'irene';
  const isMetaHint = hintText?.startsWith('【');

  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  // ▼ モリアーティモード専用スキルを仕様書通りに反映
  const skillOptions = isMoriarty
    ? [
        { id: 'CALCULUS', label: 'CALCULUS (計算)', icon: <Calculator size={16} /> },
        { id: 'AESTHETIC', label: 'AESTHETIC (美学)', icon: <Eye size={16} /> },
        { id: 'SHADOW', label: 'SHADOW (暗躍)', icon: <EyeOff size={16} /> }
      ]
    : isIrene
      ? [
          { id: 'LINK', label: 'LINK (結合)', icon: <Network size={16} /> },
          { id: 'SCOPE', label: 'SCOPE (俯瞰)', icon: <BrainCircuit size={16} /> },
          { id: 'EMPATHY', label: 'EMPATHY (共感)', icon: <HeartHandshake size={16} /> }
        ]
      : [
          { id: 'LINK', label: 'LINK (結合)', icon: <Network size={16} /> },
          { id: 'SCOPE', label: 'SCOPE (俯瞰)', icon: <BrainCircuit size={16} /> },
          { id: 'MEDICAL', label: 'MEDICAL (医学)', icon: <HeartHandshake size={16} /> }
        ];

  const renderInterventionButton = () => {
    if (!interventionType || !isInterventionAvailable || interventionUsed) return null;
    let icon, label, colorClass, borderClass;
    switch (interventionType) {
      case 'Irene': icon = <Sparkles size={14} />; label = "Irene's Whisper"; colorClass = "bg-rose-900 hover:bg-rose-800 text-rose-100"; borderClass = "border-rose-500/50"; break;
      case 'Mycroft': icon = <Mail size={14} />; label = "Mycroft's Telegram"; colorClass = "bg-blue-900 hover:bg-blue-800 text-blue-100"; borderClass = "border-blue-500/50"; break;
      case 'Wiggins': icon = <Users size={14} />; label = "Wiggins's Report"; colorClass = "bg-amber-700 hover:bg-amber-600 text-amber-50"; borderClass = "border-amber-400/50"; break;
    }
    return (
      <button onClick={() => { setShowHint(true); if(onUseIntervention) onUseIntervention(); }} className={`flex items-center justify-center gap-1.5 w-full py-2.5 mt-3 rounded-lg border text-xs font-bold tracking-widest uppercase transition-transform active:scale-95 shadow-md ${colorClass} ${borderClass} animate-pulse`}>
        {icon} {label} (介入を要請する)
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 border-t-2 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-full duration-300 relative select-none pb-[calc(1rem+env(safe-area-inset-bottom))] bg-theme-bg-dark border-theme-border-base/50">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      
      <div className="max-w-xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-theme-accent-main animate-pulse" />
            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase text-theme-accent-muted">System Warning</p>
              <h3 className="text-theme-text-light font-bold text-sm sm:text-base tracking-widest">LOGIC INTERRUPT REQUIRED</h3>
            </div>
          </div>
          <div className={`text-3xl font-black font-mono tabular-nums tracking-tighter ${timeLeft <= 5 ? 'text-theme-accent-main animate-[shake_0.5s_infinite]' : 'text-theme-text-light'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        {hintText && !showHint && !isMetaHint && (
          <div className="mb-4">
            {renderInterventionButton() || (
              <button onClick={() => setShowHint(true)} className="w-full bg-theme-bg-dark-panel hover:bg-theme-bg-panel text-theme-text-muted hover:text-theme-text-light border border-theme-border-base/30 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2">
                <HelpCircle size={14} /> HINT (推論の補助を要求)
              </button>
            )}
          </div>
        )}

        {(showHint || isMetaHint) && hintText && (
          <div className={`mb-4 p-3 sm:p-4 rounded-lg border text-sm font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 shadow-inner ${
            isMetaHint ? 'bg-theme-accent-main text-white font-sans font-bold shadow-lg' :
            interventionType === 'Irene' ? 'bg-rose-950/30 border-rose-500/30 text-rose-100' :
            interventionType === 'Mycroft' ? 'bg-blue-950/30 border-blue-500/30 text-blue-100' :
            interventionType === 'Wiggins' ? 'bg-amber-950/30 border-amber-500/30 text-amber-100' :
            'bg-theme-bg-dark-panel border-theme-border-base/30 text-theme-text-light-muted'
          }`}>
            {!isMetaHint && (
              <span className="font-bold mr-2 text-[10px] tracking-widest uppercase opacity-70">
                {interventionType ? `${interventionType}:` : 'HINT:'}
              </span>
            )}
            {hintText}
          </div>
        )}

        <div className="mb-5">
          <p className="text-[10px] font-mono mb-2 uppercase tracking-widest flex items-center gap-2 text-theme-text-muted">
            Evidence Link 
            {isEvidenceRequired ? (
              <span className="text-theme-accent-main font-bold border border-theme-accent-main/30 px-1.5 py-0.5 rounded shadow-sm animate-pulse">Required (必須)</span>
            ) : (
              <span className="text-emerald-500 font-bold border border-emerald-500/30 px-1.5 py-0.5 rounded opacity-70">Optional (任意)</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {collectedEvidences.map((ev) => (
              <button key={ev} onClick={() => setSelectedEvidence(selectedEvidence === ev ? null : ev)} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 border ${selectedEvidence === ev ? 'bg-theme-accent-main text-white border-theme-accent-main shadow-md' : 'bg-theme-bg-dark-panel text-theme-text-muted border-theme-border-dark hover:bg-theme-bg-panel hover:text-theme-text-light'}`}>{ev}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2">
          {skillOptions.map((skill) => (
            <button 
              key={skill.id} 
              onClick={() => {
                onSubmit(skill.id, selectedEvidence);
              }} 
              className="py-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 active:scale-95 shadow-lg bg-theme-bg-panel/20 border-theme-border-base/50 hover:bg-theme-bg-panel hover:border-theme-accent-main text-theme-text-light"
            >
              {skill.icon}
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest">{skill.label}</span>
              <span className="text-[8px] opacity-60 px-2 py-0.5 rounded font-mono bg-theme-bg-dark text-theme-text-muted border border-theme-border-dark">TAP TO RUN</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}