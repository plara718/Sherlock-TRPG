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
    <div className="p-4 sm:p-5 bg-[#e6d5c3] border-t border-[#8c7a6b]/30 shrink-0 relative shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      
      {/* スキルヘルプのポップアップ */}
      {showHelp && (
        <div className="absolute bottom-full left-0 w-full p-3 sm:p-4 mb-1 z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-[#2a2420] text-[#d8c8b8] text-[10px] sm:text-xs p-4 sm:p-5 rounded-xl shadow-2xl border border-[#5c4d43] grid gap-3 leading-relaxed font-serif">
            <p>
              <span className="text-blue-400 font-bold font-mono tracking-widest mr-2">
                SCOPE:
              </span>
              現場の微細な物理的痕跡や傷から事実を導く
            </p>
            <p>
              <span className="text-rose-400 font-bold font-mono tracking-widest mr-2">
                HEART:
              </span>
              恨み、愛情、絶望など人間の心理・動機を読み解く
            </p>
            <p>
              <span className="text-emerald-400 font-bold font-mono tracking-widest mr-2">
                LOGIC:
              </span>
              時間や空間、アリバイの数学的な矛盾を突く
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end gap-3 sm:gap-4 relative max-w-2xl mx-auto">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-[#8c7a6b] tracking-widest font-mono">
            <span>INTERRUPT SKILL</span>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="hover:text-[#5c4d43] transition-colors flex items-center gap-1 p-1 active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              HELP
            </button>
          </div>
          
          <div className="flex gap-2 sm:gap-3 h-12 sm:h-14">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => onInterrupt(skill)}
                disabled={isStreaming}
                className={`flex-1 rounded-xl font-bold text-xs sm:text-sm tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-1.5 relative overflow-hidden ${
                  selectedSkill === skill
                    ? 'bg-amber-600 border-amber-700 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                    : 'bg-[#f4ebd8] border-[#8c7a6b]/50 text-[#5c4d43] hover:bg-[#d8c8b8] hover:border-[#8c7a6b]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedSkill === skill && (
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current animate-pulse" />
                )}
                {skill}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={isStreaming}
          className="h-12 sm:h-14 w-16 sm:w-20 bg-[#3a2f29] hover:bg-[#1a1512] text-[#f4ebd8] rounded-xl font-bold flex items-center justify-center transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 border border-[#5c4d43]"
          aria-label="Next Text"
        >
          <Play
            className={`w-5 h-5 sm:w-6 sm:h-6 fill-current ${
              isStreaming ? 'opacity-50' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}