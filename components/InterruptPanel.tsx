'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, BookOpen } from 'lucide-react';

type InterruptPanelProps = {
  collectedEvidences: string[];
  onSubmit: (skill: string, evidence: string) => void;
  onTimeUp: () => void;
};

export default function InterruptPanel({
  collectedEvidences,
  onSubmit,
  onTimeUp,
}: InterruptPanelProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const skills = ['SCOPE', 'HEART', 'LOGIC'];

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  return (
    <div className="p-4 bg-slate-900 text-white border-t-4 border-red-600 shadow-[0_-10px_30px_rgba(220,38,38,0.2)] animate-in slide-in-from-bottom-4 relative">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-red-400 font-bold animate-pulse">
          <ShieldAlert className="w-5 h-5" />
          <span>TETHER REQUIRED!</span>
        </div>
        <div
          className={`flex items-center gap-2 font-mono text-lg font-bold ${
            timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-amber-400'
          }`}
        >
          <Clock className="w-5 h-5" />
          00:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* スキル選択 */}
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <p className="text-xs text-slate-400 font-bold mb-2">
            1. 繋ぎ止める視点
          </p>
          <div className="flex gap-2">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`flex-1 py-2 rounded text-xs font-bold border-2 transition-all ${
                  selectedSkill === skill
                    ? 'bg-amber-500 border-amber-400 text-slate-900'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* 証拠選択 */}
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400 font-bold">
              2. 手帳から証拠を提示
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {collectedEvidences.length === 0 ? (
              <span className="text-xs text-red-400 italic">
                ※手帳に証拠がありません
              </span>
            ) : (
              collectedEvidences.map((ev) => (
                <button
                  key={ev}
                  onClick={() => setSelectedEvidence(ev)}
                  className={`px-3 py-1.5 rounded text-xs font-bold border-2 transition-all ${
                    selectedEvidence === ev
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                >
                  {ev}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (selectedSkill && selectedEvidence)
            onSubmit(selectedSkill, selectedEvidence);
        }}
        disabled={!selectedSkill || !selectedEvidence}
        className="w-full mt-4 py-3 rounded font-bold text-lg tracking-widest bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        TETHER THE GENIUS
      </button>
    </div>
  );
}
