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
    <div className="mb-4 flex flex-col gap-2">
      {/* 枠のデザインを分岐 */}
      <div
        className={`p-4 border rounded shadow-sm ${
          isSystem
            ? 'bg-slate-200 border-slate-300'
            : 'bg-white border-slate-300'
        }`}
      >
        {/* キャラクター発言の時のみ名前を表示 */}
        {!isSystem && (
          <div className="font-bold text-sm text-slate-500 mb-1">{speaker}</div>
        )}

        {/* テキストのスタイルを分岐 */}
        <div
          className={`text-lg leading-relaxed whitespace-pre-wrap ${
            isSystem ? 'text-slate-700 italic font-serif' : 'text-slate-800'
          }`}
        >
          {cleanText}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 border-l-4 ${
            feedback.type === 'success'
              ? 'border-green-600 bg-green-50 text-green-800'
              : 'border-red-600 bg-red-50 text-red-800'
          }`}
        >
          <p className="font-bold">
            {feedback.type === 'success'
              ? 'INTERRUPT SUCCESS'
              : feedback.type === 'penalty'
              ? 'INVALID INTERRUPT'
              : 'INTERRUPT MISSED'}
          </p>
          <p className="text-sm italic mt-1">{feedback.msg}</p>
        </div>
      )}
    </div>
  );
}
