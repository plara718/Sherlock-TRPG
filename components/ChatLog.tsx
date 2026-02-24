import React from 'react';

type ChatLogProps = {
  speaker: string;
  text: string;
  feedback?: { type: 'success' | 'fail' | 'penalty'; msg: string } | null;
};

export default function ChatLog({ speaker, text, feedback }: ChatLogProps) {
  const cleanText = text.replace(/\[<NOISE>\]/g, '');

  // システム（地の文）かどうかの判定
  const isSystem = speaker === 'System';

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 枠のデザインを分岐 */}
      <div
        className={`p-4 sm:p-5 rounded-xl border transition-all ${
          isSystem
            ? 'bg-[#e6d5c3]/40 border-[#8c7a6b]/30 shadow-inner'
            : 'bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm'
        }`}
      >
        {/* キャラクター発言の時のみ名前を表示 */}
        {!isSystem && (
          <div className="font-bold text-xs font-mono text-[#8c7a6b] mb-1.5 uppercase tracking-widest">
            {speaker}
          </div>
        )}

        {/* テキストのスタイルを分岐 */}
        <div
          className={`text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif ${
            isSystem ? 'text-[#5c4d43] italic' : 'text-[#3a2f29]'
          }`}
        >
          {cleanText}
        </div>
      </div>

      {/* フィードバック表示エリア */}
      {feedback && (
        <div
          className={`p-3 sm:p-4 rounded-lg border-l-4 shadow-sm animate-in zoom-in-95 duration-300 ${
            feedback.type === 'success'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 border-y-emerald-200 border-r-emerald-200'
              : 'border-rose-600 bg-rose-50 text-rose-900 border-y-rose-200 border-r-rose-200'
          }`}
        >
          <p className="font-bold font-mono text-xs sm:text-sm tracking-widest mb-1">
            {feedback.type === 'success'
              ? 'INTERRUPT SUCCESS'
              : feedback.type === 'penalty'
              ? 'INVALID INTERRUPT'
              : 'INTERRUPT MISSED'}
          </p>
          <p className="text-sm sm:text-base italic font-serif leading-relaxed">
            {feedback.msg}
          </p>
        </div>
      )}
    </div>
  );
}