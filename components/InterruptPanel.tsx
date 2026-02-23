'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Brain, Heart, Zap, AlertTriangle, Lightbulb } from 'lucide-react';

const SKILLS = [
  { id: 'SCOPE', icon: Eye, color: 'bg-blue-600', hover: 'hover:bg-blue-500', label: '観察' },
  { id: 'LOGIC', icon: Brain, color: 'bg-emerald-600', hover: 'hover:bg-emerald-500', label: '論理' },
  { id: 'HEART', icon: Heart, color: 'bg-rose-600', hover: 'hover:bg-rose-500', label: '心理' },
];

type InterruptPanelProps = {
  collectedEvidences: string[];
  hintText?: string; // ←【追加】
  onSubmit: (skill: string, evidence: string) => void;
  onTimeUp: () => void;
};

export default function InterruptPanel({
  collectedEvidences,
  hintText,
  onSubmit,
  onTimeUp,
}: InterruptPanelProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [showHint, setShowHint] = useState(false); // ←【追加】ヒント表示ステート

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1; // 約10秒で0になる
      });
    }, 100); 

    return () => clearInterval(timer);
  }, [onTimeUp]);

  return (
    <div className="bg-slate-900 border-t-4 border-amber-500 p-3 sm:p-4 flex flex-col gap-3 relative overflow-hidden animate-in slide-in-from-bottom-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* 警告アニメーション背景 */}
      <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />

      {/* ヘッダー＆タイマー＆ヒント */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs sm:text-sm animate-pulse">
            <AlertTriangle size={16} />
            <span>天才の思考が飛躍中！視点と証拠で繋ぎ止めろ！</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ▼ ヒントボタン */}
            {hintText && (
              <button 
                onClick={() => setShowHint(!showHint)}
                className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded transition-colors ${
                  showHint ? 'bg-amber-100 text-amber-900' : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 border border-amber-600/50'
                }`}
              >
                <Lightbulb size={12} />
                {showHint ? 'CLOSE HINT' : 'HINT'}
              </button>
            )}
            {/* ▼ タイマーバー */}
            <div className="w-24 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-600">
              <div
                className={`h-full transition-all duration-100 ${
                  timeLeft > 40 ? 'bg-amber-500' : 'bg-red-600'
                }`}
                style={{ width: `${timeLeft}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* ▼ ヒント表示エリア */}
        {showHint && hintText && (
          <div className="bg-[#FDF6E3] border-l-4 border-amber-500 p-2 text-xs sm:text-sm text-slate-800 font-serif font-bold shadow-inner animate-in fade-in slide-in-from-top-1">
            💡 {hintText}
          </div>
        )}
      </div>

      <div className="flex gap-4 relative z-10">
        {/* 左側：スキル選択 */}
        <div className="w-1/3 flex flex-col gap-2">
          <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">1. Perspective</div>
          {SKILLS.map((skill) => {
            const Icon = skill.icon;
            const isSelected = selectedSkill === skill.id;
            return (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill.id)}
                className={`flex items-center justify-center gap-2 py-2 sm:py-3 rounded border-2 transition-all font-bold text-xs sm:text-sm ${
                  isSelected
                    ? `${skill.color} border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.5)] scale-105`
                    : `bg-slate-800 border-slate-600 text-slate-300 ${skill.hover}`
                }`}
              >
                <Icon size={16} />
                {skill.id}
              </button>
            );
          })}
        </div>

        {/* 右側：証拠選択と発動 */}
        <div className="w-2/3 flex flex-col gap-2">
          <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">2. Evidence</div>
          <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 overflow-y-auto max-h-[120px] custom-scrollbar flex flex-col gap-1">
            {collectedEvidences.length === 0 ? (
              <div className="text-slate-500 text-xs text-center mt-4">手帳に証拠がない</div>
            ) : (
              collectedEvidences.map((ev) => (
                <button
                  key={ev}
                  onClick={() => setSelectedEvidence(ev)}
                  className={`text-left px-2 py-1.5 rounded text-xs sm:text-sm font-bold truncate transition-colors ${
                    selectedEvidence === ev
                      ? 'bg-amber-500 text-slate-900 shadow-inner'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {ev}
                </button>
              ))
            )}
          </div>
          
          <button
            onClick={() => {
              if (selectedSkill && selectedEvidence) {
                onSubmit(selectedSkill, selectedEvidence);
              }
            }}
            disabled={!selectedSkill || !selectedEvidence}
            className="mt-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Zap size={18} /> TETHER THE GENIUS
          </button>
        </div>
      </div>
    </div>
  );
}