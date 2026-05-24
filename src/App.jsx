import React, { useState, useEffect } from 'react';
import SeatSetup from './components/SeatSetup';
import Scoreboard from './components/Scoreboard';
import RoomManager from './components/RoomManager';
import ShareCard from './components/ShareCard';

const INITIAL_STATE = {
  players: [
    { name: '玩家一', wind: '東', score: 1000 },
    { name: '玩家二', wind: '南', score: 1000 },
    { name: '玩家三', wind: '西', score: 1000 },
    { name: '玩家四', wind: '北', score: 1000 },
  ],
  roundInfo: {
    windCircle: '東', // 東、南、西、北
    dealerIndex: 0,   // Index of current dealer (0-3)
    dealerStreak: 0,  // Streak count
    handNum: 1,       // Hand index
  },
  history: [],
  baseSetting: {
    base: 50,
    taiValue: 20,
  }
};

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [appMode, setAppMode] = useState('setup'); // setup, play, finish, view
  const [isTeachingMode, setIsTeachingMode] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);

  // Check URL parameters for share-view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(atob(shareParam)));
        setGameState(decodedData);
        setAppMode('view');
      } catch (e) {
        console.error('Failed to parse shared URL state:', e);
      }
    }
  }, []);

  const handleSeatSetupComplete = (arrangedPlayers) => {
    setGameState(prev => ({
      ...prev,
      players: arrangedPlayers
    }));
    setAppMode('play');
  };

  const handleFinishGame = () => {
    if (window.confirm('確定要結束本局並進行勝負結算嗎？')) {
      setAppMode('finish');
    }
  };

  const handleRestartGame = () => {
    if (window.confirm('確定要重開一局嗎？所有現有積分與紀錄將會被清除。')) {
      setGameState({
        ...INITIAL_STATE,
        baseSetting: gameState.baseSetting // Keep current base settings
      });
      setAppMode('setup');
      setRoomId('');
      setIsHost(false);
      window.history.pushState({}, document.title, window.location.pathname);
    }
  };

  const handleBaseChange = (field, val) => {
    setGameState(prev => ({
      ...prev,
      baseSetting: {
        ...prev.baseSetting,
        [field]: Math.max(1, parseInt(val) || 0)
      }
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-4 py-3 bg-[#081810]/90">
        <div className="container flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = window.location.origin + window.location.pathname}>
            <span className="text-2xl">🀄</span>
            <div>
              <h1 className="text-md sm:text-lg font-black text-white leading-none">台灣麻將記分助手</h1>
              <span className="text-[10px] text-gray-400">Taiwan Mahjong Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switches */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800 text-xs">
              <button
                onClick={() => setIsTeachingMode(true)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  isTeachingMode 
                    ? 'bg-[#10B981] text-black shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎓 教學模式
              </button>
              <button
                onClick={() => setIsTeachingMode(false)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  !isTeachingMode 
                    ? 'bg-[#D4AF37] text-black shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔥 高手模式
              </button>
            </div>

            {appMode !== 'setup' && appMode !== 'view' && (
              <button
                onClick={handleRestartGame}
                className="btn btn-secondary py-1.5 px-3 text-xs border-red-900/30 text-red-400 hover:bg-red-950/20"
              >
                🔄 重開
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container flex-grow py-6 px-4">
        {/* Share view / Read-only board */}
        {appMode === 'view' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="glass-panel p-6 border-[#D4AF37] bg-emerald-950/20 text-center">
              <span className="text-3xl">🏆</span>
              <h2 className="text-xl font-bold text-[#D4AF37] mt-2 mb-1">您正在瀏覽分享的對局戰績</h2>
              <p className="text-xs text-gray-400 mb-4">本網頁為唯讀歷史報表，載入了該場對局的所有計分與歷程。</p>
              <button
                onClick={() => {
                  window.history.pushState({}, document.title, window.location.pathname);
                  setGameState(INITIAL_STATE);
                  setAppMode('setup');
                }}
                className="btn btn-primary text-xs px-4"
              >
                🀄 我也要開一局
              </button>
            </div>

            {/* Read only scorecard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {gameState.players.map((p, idx) => (
                <div key={p.name} className="glass-panel p-4 text-center border-gray-800">
                  <span className="text-xs text-gray-500 font-mono block mb-1">{p.wind}風位</span>
                  <h4 className="text-md font-bold text-white mb-2">{p.name}</h4>
                  <div className="text-xl font-black text-white">{p.score}</div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {p.score - 1000 >= 0 ? `+${p.score - 1000}` : p.score - 1000}
                  </p>
                </div>
              ))}
            </div>

            {/* Read only history */}
            <div className="glass-panel p-4">
              <h3 className="text-sm font-bold text-[#D4AF37] mb-3">對局歷程紀錄 ({gameState.history.length} 回合)</h3>
              <div className="space-y-2">
                {gameState.history.map((log) => (
                  <div key={log.handId} className="bg-black/30 border border-gray-800 p-3 rounded flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">{log.roundName}</span>
                      <span className="font-medium text-white">{log.description}</span>
                    </div>
                    <span className="badge badge-gold">{log.winType === 'zimo' ? '自摸' : log.winType === 'discard' ? '放槍' : '流局'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 1: Seat Drawing Setup */}
        {appMode === 'setup' && (
          <div className="space-y-6">
            {/* Base Settings Panel */}
            <div className="glass-panel p-5 max-w-2xl mx-auto">
              <h3 className="text-md font-bold text-[#D4AF37] mb-3">⚙️ 設定本局底台分數</h3>
              
              {isTeachingMode && (
                <div className="tip-bubble text-xs">
                  <h4 className="font-bold text-[#10B981] mb-0.5">💡 什麼是「底」與「台」？</h4>
                  <p>
                    • <strong>底 (Base)</strong>：只要贏牌，就能獲得的基本分數（例如：50分）。<br />
                    • <strong>台 (Tai Value)</strong>：贏牌時依照手牌難度（台數）增加的分數。每多一台，就加計一次台數分（例如：20分/台）。<br />
                    • <strong>計算公式</strong>：贏得的分數 = 底 + (台數 * 每台分數)。
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">底分數 (基本分)</label>
                  <input
                    type="number"
                    value={gameState.baseSetting.base}
                    onChange={(e) => handleBaseChange('base', e.target.value)}
                    className="form-input text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="form-label">每台分數 (台數分)</label>
                  <input
                    type="number"
                    value={gameState.baseSetting.taiValue}
                    onChange={(e) => handleBaseChange('taiValue', e.target.value)}
                    className="form-input text-lg font-bold"
                  />
                </div>
              </div>
            </div>

            <SeatSetup 
              players={gameState.players} 
              setPlayers={(p) => setGameState(prev => ({ ...prev, players: p }))}
              isTeachingMode={isTeachingMode}
              onComplete={handleSeatSetupComplete}
            />
          </div>
        )}

        {/* Phase 2: Active Scoreboard & Recording */}
        {appMode === 'play' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scoreboard and logs (Takes 2 columns on large screen) */}
            <div className="lg:col-span-2 space-y-6">
              <Scoreboard 
                gameState={gameState} 
                setGameState={setGameState}
                isTeachingMode={isTeachingMode}
                isHost={isHost}
              />
              
              <div className="pt-2">
                <button
                  onClick={handleFinishGame}
                  className="btn btn-accent w-full py-3.5 text-lg font-black"
                >
                  🏁 結束本局對局，結算勝負！
                </button>
              </div>
            </div>

            {/* Room Sync Manager (Takes 1 column on large screen) */}
            <div className="space-y-6">
              <RoomManager 
                gameState={gameState}
                setGameState={setGameState}
                roomId={roomId}
                setRoomId={setRoomId}
                isHost={isHost}
                setIsHost={setIsHost}
                isTeachingMode={isTeachingMode}
              />
            </div>
          </div>
        )}

        {/* Phase 3: Game Finished & Sharing */}
        {appMode === 'finish' && (
          <ShareCard 
            gameState={gameState}
            isTeachingMode={isTeachingMode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-900 mt-8">
        <p>© 2026 台灣麻將助手. All rights reserved. 設計用於家庭聚會與麻將教學。</p>
      </footer>
    </div>
  );
}
