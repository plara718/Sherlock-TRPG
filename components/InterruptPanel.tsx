'use client';

import React, { useState, useEffect } from 'react';
// ▼ Network を import に追加しました
import { ShieldAlert, Fingerprint, BrainCircuit, HeartHandshake, Clock, HelpCircle, Sparkles, Mail, Users, Network } from 'lucide-react';

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
}: InterruptPanelProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const isIrene = protagonist === 'irene';

  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const skillOptions = isMoriarty
    ? [
        { id: 'LINK', label: 'LINK (結合)', icon: <Network size={16} /> },
        { id: 'SCOPE', label: 'SCOPE (俯瞰)', icon: <BrainCircuit size={16} /> },
        { id: 'ANALYZE', label: 'ANALYZE (解体)', icon: <Fingerprint size={16} /> }
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
      case 'Irene':
        icon = <Sparkles size={14} />; label = "Irene's Whisper"; colorClass = "bg-rose-900 hover:bg-rose-800 text-rose-100"; borderClass = "border-rose-500/50"; break;
      case 'Mycroft':
        icon = <Mail size={14} />; label = "Mycroft's Telegram"; colorClass = "bg-blue-900 hover:bg-blue-800 text-blue-100"; borderClass = "border-blue-500/50"; break;
      case 'Wiggins':
        icon = <Users size={14} />; label = "Wiggins's Report"; colorClass = "bg-amber-700 hover:bg-amber-600 text-amber-50"; borderClass = "border-amber-400/50"; break;
    }

    return (
      <button
        onClick={() => { setShowHint(true); if(onUseIntervention) onUseIntervention(); }}
        className={`flex items-center justify-center gap-1.5 w-full py-2.5 mt-3 rounded-lg border text-xs font-bold tracking-widest uppercase transition-transform active:scale-95 shadow-md ${colorClass} ${borderClass} animate-pulse`}
      >
        {icon} {label} (介入を要請する)
      </button>
    );
  };

  return (
    <div className={`p-4 sm:p-6 border-t-2 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-full duration-300 relative select-none pb-[calc(1rem+env(safe-area-inset-bottom))] ${
      isMoriarty ? 'bg-[#1a0f15] border-fuchsia-900/50' : isIrene ? 'bg-[#1a0f12] border-rose-900/50' : 'bg-[#1a1512] border-rose-900/50'
    }`}>
      
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      
      <div className="max-w-xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className={isMoriarty ? 'text-fuchsia-500 animate-pulse' : 'text-rose-500 animate-pulse'} />
            <div>
              <p className={`text-[10px] font-mono tracking-widest uppercase ${isMoriarty ? 'text-fuchsia-400' : 'text-rose-400'}`}>System Warning</p>
              <h3 className="text-white font-bold text-sm sm:text-base tracking-widest">LOGIC INTERRUPT REQUIRED</h3>
            </div>
          </div>
          <div className={`text-3xl font-black font-mono tabular-nums tracking-tighter ${timeLeft <= 5 ? 'text-rose-500 animate-[shake_0.5s_infinite]' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        {hintText && !showHint && (
          <div className="mb-4">
            {renderInterventionButton() || (
              <button 
                onClick={() => setShowHint(true)}
                className="w-full bg-[#2a2420] hover:bg-[#3a2f29] text-[#8c7a6b] hover:text-[#d8c8b8] border border-[#8c7a6b]/30 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <HelpCircle size={14} /> HINT (推論の補助を要求)
              </button>
            )}
          </div>
        )}

        {showHint && (
          <div className={`mb-4 p-3 rounded-lg border text-sm font-serif leading-relaxed animate-in fade-in slide-in-from-top-2 shadow-inner ${
            interventionType === 'Irene' ? 'bg-rose-950/30 border-rose-500/30 text-rose-100' :
            interventionType === 'Mycroft' ? 'bg-blue-950/30 border-blue-500/30 text-blue-100' :
            interventionType === 'Wiggins' ? 'bg-amber-950/30 border-amber-500/30 text-amber-100' :
            'bg-[#2a2420] border-[#8c7a6b]/30 text-[#d8c8b8]'
          }`}>
            <span className="font-bold mr-2 text-[10px] tracking-widest uppercase opacity-70">
              {interventionType ? `${interventionType}:` : 'HINT:'}
            </span>
            {hintText}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          {skillOptions.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(skill.id)}
              className={`py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all border-2 active:scale-95 ${
                selectedSkill === skill.id
                  ? isMoriarty ? 'bg-fuchsia-900/40 border-fuchsia-500 text-fuchsia-100 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : isIrene ? 'bg-rose-900/40 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-emerald-900/40 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-[#2a2420] border-[#3a2f29] text-[#8c7a6b] hover:bg-[#3a2f29] hover:border-[#5c4d43] hover:text-[#d8c8b8]'
              }`}
            >
              {skill.icon}
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest">{skill.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <p className="text-[10px] font-mono text-[#8c7a6b] mb-2 uppercase tracking-widest flex items-center gap-2">
            Evidence Link <span className="text-[8px] opacity-60">(Optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {collectedEvidences.map((ev) => (
              <button
                key={ev}
                onClick={() => setSelectedEvidence(selectedEvidence === ev ? null : ev)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 border ${
                  selectedEvidence === ev
                    ? 'bg-amber-600 text-[#1a1512] border-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.5)]'
                    : 'bg-[#2a2420] text-[#a8988a] border-[#3a2f29] hover:bg-[#3a2f29] hover:text-[#f4ebd8]'
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
            isMoriarty ? 'bg-fuchsia-900 hover:bg-fuchsia-800' : isIrene ? 'bg-fuchsia-800 hover:bg-fuchsia-700' : 'bg-rose-800 hover:bg-rose-700'
          }`}
        >
          {uiLabels.actionButton}
        </button>
      </div>
    </div>
  );
}