'use client';

import React, { useState } from 'react';
import { Play, Zap, HelpCircle } from 'lucide-react';

type ControlsProps = {
  isStreaming: boolean;
  selectedSkill: string | null;
  onNext: () => void;
  onInterrupt: (skill: string) => void;
};

export default function Controls({
  isStreaming,
  selectedSkill,
  onNext,
  onInterrupt,
}: ControlsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const skills = ['SCOPE', 'HEART', 'LOGIC'];

  return (
    <div className="p-3 sm:p-4 bg-[#FDF6E3] border-t-2 sm:border-t-4 border-slate-800 shrink-0 relative shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      {/* スキルヘルプのポップアップ */}
      {showHelp && (
        <div className="absolute bottom-full left-0 w-full p-2 mb-2 z-30 animate-in slide-in-from-bottom-2">
          <div className="bg-slate-800 text-slate-200 text-xs sm:text-sm p-3 rounded shadow-lg border border-slate-600 grid gap-2">
            <p>
              <span className="text-blue-400 font-bold tracking-widest">
                SCOPE:
              </span>{' '}
              現場の微細な物理的痕跡や傷から事実を導く
            </p>
            <p>
              <span className="text-red-400 font-bold tracking-widest">
                HEART:
              </span>{' '}
              恨み、愛情、絶望など人間の心理・動機を読み解く
            </p>
            <p>
              <span className="text-amber-400 font-bold tracking-widest">
                LOGIC:
              </span>{' '}
              時間や空間、アリバイの数学的な矛盾を突く
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end gap-2 sm:gap-4 relative">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest font-mono">
            <span>INTERRUPT SKILL</span>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              HELP
            </button>
          </div>
          <div className="flex gap-2 h-12">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => onInterrupt(skill)}
                disabled={isStreaming}
                className={`flex-1 rounded font-bold text-xs sm:text-sm tracking-widest border-2 transition-all active:scale-95 flex items-center justify-center gap-1 relative overflow-hidden ${
                  selectedSkill === skill
                    ? 'bg-amber-500 border-amber-600 text-slate-900 shadow-[0_0_10px_rgba(217,119,6,0.5)]'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedSkill === skill && (
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                )}
                {skill}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={isStreaming}
          className="h-12 w-16 sm:w-20 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow active:scale-95"
          aria-label="Next Text"
        >
          <Play
            className={`w-5 h-5 sm:w-6 sm:h-6 ${
              isStreaming ? 'opacity-50' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}
