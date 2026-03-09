import React, { memo } from 'react';
import Image from 'next/image';

type ChatLogProps = {
  speaker: string;
  text: React.ReactNode;
  feedback?: { type: 'success' | 'fail' | 'penalty'; msg: string } | null;
  isMetaNotice?: boolean;
};

// スピーカー名から対応するアイコン画像のパスを取得する関数
const getIconPath = (speakerName: string) => {
  // ① 既存のアイコンを別名義でも使い回す
  if (['Holmes', 'Holmes (Letter)', 'Altamont'].includes(speakerName)) return '/images/icon_holmes.png';
  if (['Watson'].includes(speakerName)) return '/images/icon_watson.png';
  if (['Irene', 'Irene Adler', 'Irene (Letter)'].includes(speakerName)) return '/images/icon_irene.png';

  // =====================================================================
  // ▼ 今後アイコン画像を生成・追加した際に、以下のコメントアウトを外してください ▼
  // =====================================================================

  // ② 主要キャラクター専用アイコン
  // if (['Lestrade'].includes(speakerName)) return '/images/icon_lestrade.png';
  // if (['Mycroft', 'Mycroft Holmes'].includes(speakerName)) return '/images/icon_mycroft.png';
  // if (['Colonel Moran'].includes(speakerName)) return '/images/icon_moran.png';
  // if (['Moriarty'].includes(speakerName)) return '/images/icon_moriarty.png';

  // ③ 汎用アイコンの振り分け
  // const police = ['Gregson', 'Inspector Bradstreet', 'Inspector Gregory'];
  // const villains = ['Assassin', 'Cleaner', 'Sylvius', 'Abe Slaney', 'John Clay', 'Dr. Roylott', 'Jefferson Hope', 'Killer Evans', 'McFarlane', 'Oldacre'];
  // const women = ['Mary Morstan', 'Helen Stoner', 'Lady Hilda', 'Alice Turner', 'Effie Munro', 'Woman', 'Hudson'];
  
  // if (police.includes(speakerName) || speakerName.includes('Inspector')) return '/images/icon_police.png';
  // if (villains.includes(speakerName)) return '/images/icon_villain.png';
  // if (women.includes(speakerName) || speakerName.includes('Mrs.') || speakerName.includes('Miss') || speakerName.includes('Lady')) return '/images/icon_woman.png';
  
  // 上記に該当しない、System以外のモブはすべて男性用アイコンにする
  // if (speakerName !== 'System') return '/images/icon_man.png';

  // アイコンが設定されていない場合は null を返し、イニシャル表示にフォールバックさせる
  return null; 
};

// memo() でラップし、プロパティが変化しない過去のログの無駄な再描画を防ぐ（パフォーマンス改善）
const ChatLog = memo(function ChatLog({ speaker, text, feedback, isMetaNotice }: ChatLogProps) {
  const isSystem = speaker === 'System';
  const iconPath = getIconPath(speaker);

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {isMetaNotice ? (
        // システム通知用の専用UI
        <div className="p-4 sm:p-5 rounded-xl border border-amber-500/50 bg-[#1a1512] shadow-[0_0_15px_rgba(245,158,11,0.15)] text-center animate-in zoom-in-95 duration-500 relative overflow-hidden mx-auto w-full max-w-[90%]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
          <p className="font-mono text-[10px] text-amber-500 mb-2 tracking-[0.3em] uppercase animate-pulse">System Notice</p>
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans font-bold text-amber-50 tracking-wider">
            {text}
          </div>
        </div>
      ) : isSystem ? (
        // 通常の地の文のレイアウト
        <div className="p-4 sm:p-5 rounded-xl border transition-all bg-[#e6d5c3]/40 border-[#8c7a6b]/30 shadow-inner">
          <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-[#5c4d43] italic">
            {text}
          </div>
        </div>
      ) : (
        // キャラクターのレイアウト
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 mt-1">
            {iconPath ? (
              <Image 
                src={iconPath} 
                alt={speaker} 
                width={48} 
                height={48} 
                priority={true} // アイコンの遅延読み込み（チラつき）を防ぐ
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#8c7a6b] shadow-md object-cover bg-[#1a1512]" 
              />
            ) : (
              // アイコン未設定キャラ用のイニシャルプレースホルダー
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#8c7a6b]/50 bg-[#e6d5c3] flex items-center justify-center shadow-inner">
                <span className="font-bold font-mono text-[#8c7a6b] text-lg">
                  {speaker.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 sm:p-5 rounded-xl border transition-all bg-[#fffcf7] border-[#8c7a6b]/40 shadow-sm relative">
            {/* 吹き出しのしっぽ */}
            <div className="absolute top-4 -left-2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#8c7a6b]/40">
              <div className="absolute -top-2 -left-[7px] w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-[#fffcf7]" />
            </div>
            <div className="font-bold text-xs font-mono text-[#8c7a6b] mb-1.5 uppercase tracking-widest">{speaker}</div>
            <div className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-serif text-[#3a2f29]">{text}</div>
          </div>
        </div>
      )}

      {/* フィードバック表示エリア */}
      {feedback && (
        <div className={`p-3 sm:p-4 rounded-lg border-l-4 shadow-sm animate-in zoom-in-95 duration-300 ${feedback.type === 'success' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 border-y-emerald-200 border-r-emerald-200' : 'border-rose-600 bg-rose-50 text-rose-900 border-y-rose-200 border-r-rose-200'}`}>
          <p className="font-bold font-mono text-xs sm:text-sm tracking-widest mb-1">{feedback.type === 'success' ? 'INTERRUPT SUCCESS' : feedback.type === 'penalty' ? 'INVALID INTERRUPT' : 'INTERRUPT MISSED'}</p>
          <p className="text-sm sm:text-base italic font-serif leading-relaxed">{feedback.msg}</p>
        </div>
      )}
    </div>
  );
});

export default ChatLog;