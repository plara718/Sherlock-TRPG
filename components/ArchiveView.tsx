import React, { useState } from 'react';
import { CheckCircle2, Circle, Lock, FolderOpen } from 'lucide-react';
import archiveData from '@/data/archive.json';

// --- 型定義 ---
type Episode = {
  id: string;
  title: string;
  status: 'cleared' | 'locked' | 'playing';
  category?: string; // カテゴリ分け用のプロパティ
};

type Season = {
  season_id: number | string;
  title: string;
  years: string;
  description: string;
  episodes: Episode[];
};

type ArchiveData = {
  seasons: Season[];
};

const data: ArchiveData = archiveData as ArchiveData;

// clearedEpisodes（クリア済みエピソードの配列）をPropsで受け取る
interface ArchiveViewProps {
  onSelectEpisode?: (episodeId: string) => void;
  clearedEpisodes?: string[]; 
}

// --- コンポーネント本体 ---
export default function ArchiveView({ onSelectEpisode, clearedEpisodes = [] }: ArchiveViewProps) {
  // 初期選択状態をSeason 1に設定
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | string>(data.seasons[0].season_id);

  // 選択中のシーズンデータを取得
  const selectedSeason = data.seasons.find(s => s.season_id === selectedSeasonId) || data.seasons[0];

  // ★エピソードのステータスを動的に判定する関数
  const getDynamicStatus = (episode: Episode): 'cleared' | 'locked' | 'playing' => {
    // 既にクリア済みなら 'cleared'
    if (clearedEpisodes.includes(episode.id)) return 'cleared';

    // スペシャルシナリオの動的解放ロジック
    if (episode.id.startsWith('SP-')) {
      let isUnlocked = false;
      switch (episode.id) {
        case 'SP-01':
          isUnlocked = clearedEpisodes.includes('#14'); // S2: #14 ボヘミアの醜聞 クリアで解放
          break;
        case 'SP-02':
          isUnlocked = clearedEpisodes.includes('#40'); // S3: #40 最後の事件：後編 クリアで解放
          break;
        case 'SP-03':
          isUnlocked = clearedEpisodes.includes('#58'); // S4: #58 別れの挨拶 クリアで解放
          break;
        case 'SP-04':
          isUnlocked = clearedEpisodes.includes('#15'); // S2: #15 黄色い顔 クリアで解放
          break;
        case 'SP-05':
          isUnlocked = clearedEpisodes.includes('#29'); // S2: #29 瀕死の探偵 クリアで解放
          break;
        case 'SP-06':
          isUnlocked = clearedEpisodes.includes('SP-05'); // SP-05 緋色の追憶 クリアで解放
          break;
      }
      return isUnlocked ? 'playing' : 'locked';
    }

    // 通常エピソード（#01〜）は現状のJSONのステータスを優先
    return episode.status; 
  };

  return (
    <div className="flex h-full bg-[#f4ebd8] text-[#3a2f29] font-serif">
      
      {/* 左側：シーズン選択サイドバー */}
      <div className="w-1/3 lg:w-1/4 border-r border-[#8c7a6b]/30 bg-[#e6d5c3] p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="text-xl font-bold mb-2 text-[#5c4d43] border-b border-[#8c7a6b]/30 pb-2">
          事件簿アーカイブ
        </h2>
        {data.seasons.map((season) => (
          <button
            key={season.season_id}
            onClick={() => setSelectedSeasonId(season.season_id)}
            className={`p-4 rounded-md text-left transition-all duration-200 border ${
              selectedSeasonId === season.season_id
                ? 'bg-[#5c4d43] text-[#f4ebd8] border-[#5c4d43] shadow-md'
                : 'bg-[#f4ebd8]/50 border-transparent hover:bg-[#d8c8b8] text-[#5c4d43]'
            }`}
          >
            <div className="font-bold text-lg">{season.title}</div>
            <div className={`text-sm mt-1 ${selectedSeasonId === season.season_id ? 'text-[#e6d5c3]' : 'text-[#8c7a6b]'}`}>
              {season.years}
            </div>
          </button>
        ))}
      </div>

      {/* 右側：エピソードリスト */}
      <div className="w-2/3 lg:w-3/4 p-6 overflow-y-auto">
        {/* シーズン概要ヘッダー */}
        <div className="mb-8 bg-[#e6d5c3] p-5 rounded-lg border border-[#8c7a6b]/30 shadow-sm">
          <h3 className="text-2xl font-bold mb-3 text-[#5c4d43]">{selectedSeason.title}</h3>
          <p className="text-base text-[#5c4d43] leading-relaxed">
            {selectedSeason.description}
          </p>
        </div>

        {/* エピソード一覧（カテゴリグループ化） */}
        <div className="space-y-4">
          {(() => {
            // エピソードを category ごとにグループ化
            const groupedEpisodes = selectedSeason.episodes.reduce((acc, episode) => {
              const category = episode.category || 'default';
              if (!acc[category]) acc[category] = [];
              acc[category].push(episode);
              return acc;
            }, {} as Record<string, Episode[]>);

            // グループごとに描画
            return Object.entries(groupedEpisodes).map(([category, episodes]) => (
              <div key={category} className="mb-8">
                
                {/* カテゴリ名がある場合（default以外）は見出し（フォルダ名）を表示 */}
                {category !== 'default' && (
                  <div className="flex items-center gap-2 mb-4 text-[#5c4d43]">
                    <FolderOpen className="w-5 h-5 text-[#8c7a6b]" />
                    <h4 className="text-lg font-bold border-b border-[#8c7a6b]/30 pb-1 flex-1">
                      {category}
                    </h4>
                  </div>
                )}

                {/* エピソードボタンのリスト */}
                <div className="space-y-3">
                  {episodes.map((episode) => {
                    const currentStatus = getDynamicStatus(episode);
                    
                    return (
                      <button
                        key={episode.id}
                        onClick={() => {
                          if (currentStatus !== 'locked' && onSelectEpisode) {
                            onSelectEpisode(episode.id);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-lg text-left transition-all duration-200 border
                          ${currentStatus === 'locked' 
                            ? 'bg-[#d8c8b8]/20 border-[#8c7a6b]/10 text-[#8c7a6b] cursor-not-allowed' 
                            : 'bg-[#f4ebd8] border-[#8c7a6b]/30 hover:bg-[#e6d5c3] hover:border-[#8c7a6b] text-[#3a2f29] shadow-sm'
                          }`}
                        disabled={currentStatus === 'locked'}
                      >
                        <div className="flex items-center gap-4">
                          {/* ステータスアイコン */}
                          {currentStatus === 'cleared' && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                          )}
                          {currentStatus === 'playing' && (
                            <Circle className="w-6 h-6 text-blue-700" />
                          )}
                          {currentStatus === 'locked' && (
                            <Lock className="w-6 h-6 text-[#8c7a6b]/70" />
                          )}
                          
                          {/* エピソードIDとタイトル */}
                          <div className="flex items-baseline gap-3">
                            <span className="font-bold font-serif text-[#5c4d43] min-w-[3.5rem]">
                              {episode.id}
                            </span>
                            <span className={`font-serif text-lg ${currentStatus === 'locked' ? 'opacity-70' : ''}`}>
                              {episode.title}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            ));
          })()}
        </div>
      </div>

    </div>
  );
}