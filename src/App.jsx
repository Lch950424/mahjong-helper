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
  },
  version: 0
};

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [appMode, setAppMode] = useState('landing'); // landing, setup, play, finish, view, join_room
  const [isTeachingMode, setIsTeachingMode] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const isGuest = roomId && !isHost;

  // 1. Check URL parameters and Restore localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    const roomParam = params.get('room');

    if (shareParam) {
      // Direct share view (Read-only historical summary)
      try {
        const decodedData = JSON.parse(decodeURIComponent(atob(shareParam)));
        setGameState(decodedData);
        setAppMode('view');
        return;
      } catch (e) {
        console.error('Failed to parse shared URL state:', e);
      }
    }

    if (roomParam) {
      // Direct room join via link
      setRoomId(roomParam);
      setIsHost(false);
      setGameState({
        ...INITIAL_STATE,
        version: -1
      });
      setAppMode('play');
      return;
    }

    // Normal visit - restore from localStorage
    const savedState = localStorage.getItem('mahjong_helper_game_state');
    const savedMode = localStorage.getItem('mahjong_helper_app_mode');
    const savedRoomId = localStorage.getItem('mahjong_helper_room_id');
    const savedIsHost = localStorage.getItem('mahjong_helper_is_host');
    const savedTeaching = localStorage.getItem('mahjong_helper_teaching_mode');

    if (savedState) {
      try {
        setGameState(JSON.parse(savedState));
      } catch (e) {
        console.error('Failed to parse saved game state:', e);
      }
    }
    if (savedMode) {
      setAppMode(savedMode);
    } else {
      setAppMode('landing');
    }
    if (savedRoomId) setRoomId(savedRoomId);
    if (savedIsHost) setIsHost(savedIsHost === 'true');
    if (savedTeaching) setIsTeachingMode(savedTeaching === 'true');
  }, []);

  // 2. Persist state changes to localStorage
  useEffect(() => {
    if (appMode !== 'view' && appMode !== 'landing' && appMode !== 'join_room') {
      localStorage.setItem('mahjong_helper_game_state', JSON.stringify(gameState));
      localStorage.setItem('mahjong_helper_app_mode', appMode);
      localStorage.setItem('mahjong_helper_room_id', roomId);
      localStorage.setItem('mahjong_helper_is_host', isHost ? 'true' : 'false');
      localStorage.setItem('mahjong_helper_teaching_mode', isTeachingMode ? 'true' : 'false');
    }
  }, [gameState, appMode, roomId, isHost, isTeachingMode]);

  const handleSeatSetupComplete = (arrangedPlayers) => {
    setGameState(prev => ({
      ...prev,
      players: arrangedPlayers,
      appMode: 'play',
      version: (prev.version || 0) + 1
    }));
    setAppMode('play');
  };

  const handleFinishGame = () => {
    if (window.confirm('確定要結束本局並進行勝負結算嗎？')) {
      setGameState(prev => ({
        ...prev,
        appMode: 'finish',
        version: (prev.version || 0) + 1
      }));
      setAppMode('finish');
    }
  };

  const handleRestartGame = () => {
    if (window.confirm('確定要重開一局嗎？所有現有積分與紀錄將會被清除。')) {
      localStorage.removeItem('mahjong_helper_game_state');
      localStorage.removeItem('mahjong_helper_app_mode');
      localStorage.removeItem('mahjong_helper_room_id');
      localStorage.removeItem('mahjong_helper_is_host');

      setGameState({
        ...INITIAL_STATE,
        baseSetting: gameState.baseSetting,
        appMode: 'landing',
        version: 0
      });
      setAppMode('landing');
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
      },
      version: (prev.version || 0) + 1
    }));
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const targetRoomId = joinCodeInput.trim().toLowerCase();
    
    // Set parameters which triggers RoomManager connect on load
    setRoomId(targetRoomId);
    setIsHost(false);
    setGameState({
      ...INITIAL_STATE,
      version: -1
    });
    setAppMode('play');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 px-4 py-3 bg-[#081810]/90">
        <div className="container flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (appMode !== 'play' && appMode !== 'setup') {
              window.location.href = window.location.origin + window.location.pathname;
            }
          }}>
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
                🎓 教學
              </button>
              <button
                onClick={() => setIsTeachingMode(false)}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  !isTeachingMode 
                    ? 'bg-[#D4AF37] text-black shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔥 高手
              </button>
            </div>

            {appMode !== 'landing' && appMode !== 'join_room' && appMode !== 'view' && !isGuest && (
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
        
        {/* LANDING CHOICE PAGE */}
        {appMode === 'landing' && (
          <div className="max-w-xl mx-auto my-12 text-center space-y-8 animate-slideIn">
            <div className="space-y-3">
              <div className="text-6xl flex justify-center gap-2">
                <span>🀄</span>
                <span>🎲</span>
              </div>
              <h2 className="text-3xl font-black text-gradient text-[#D4AF37]">歡迎使用麻將計分助手</h2>
              <p className="text-gray-400 text-sm">請選擇您要主持全新麻將局，還是加入朋友的手機同步房間：</p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <button
                onClick={() => setAppMode('setup')}
                className="glass-panel p-6 text-left border-gray-800 hover:border-[#D4AF37] hover:shadow-gold transition-all duration-300 flex items-center gap-4 group"
              >
                <div className="text-4xl bg-[#D4AF37]/10 p-3 rounded-lg text-[#D4AF37] group-hover:scale-110 transition-transform">
                  🏠
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">主持新對局 / 單機遊玩</h3>
                  <p className="text-xs text-gray-500">自訂底台數、擲骰抓位及就座指南，並可選擇開房連線。</p>
                </div>
              </button>

              <button
                onClick={() => setAppMode('join_room')}
                className="glass-panel p-6 text-left border-gray-800 hover:border-[#10B981] hover:shadow-lg hover:shadow-emerald-950 transition-all duration-300 flex items-center gap-4 group"
              >
                <div className="text-4xl bg-[#10B981]/10 p-3 rounded-lg text-[#10B981] group-hover:scale-110 transition-transform">
                  📡
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">加入現有好友房間</h3>
                  <p className="text-xs text-gray-500">輸入朋友發給您的房間代碼或掃描 QR Code，多人手機同步記分板。</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* JOIN ROOM PROMPT */}
        {appMode === 'join_room' && (
          <div className="glass-panel p-6 max-w-md mx-auto my-12 animate-slideIn border-gray-800">
            <h3 className="text-xl font-bold text-[#10B981] mb-2 flex items-center gap-2">
              📡 加入對局房間
            </h3>
            <p className="text-xs text-gray-400 mb-6">請輸入好友發給您的 5 碼房間代號（例如：mj-12345）。</p>

            <form onSubmit={handleJoinRoomSubmit} className="space-y-4">
              <div>
                <label className="form-label">房間代號</label>
                <input
                  type="text"
                  required
                  placeholder="mj-xxxxx"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="form-input text-lg font-mono font-bold tracking-wider"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAppMode('landing')}
                  className="btn btn-secondary flex-1 py-3 text-sm"
                >
                  返回選單
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 py-3 text-sm"
                >
                  確認加入
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Share view / Read-only board */}
        {appMode === 'view' && (
          <div className="space-y-6 max-w-3xl mx-auto animate-slideIn">
            <div className="glass-panel p-6 border-[#D4AF37] bg-emerald-950/20 text-center">
              <span className="text-3xl">🏆</span>
              <h2 className="text-xl font-bold text-[#D4AF37] mt-2 mb-1">您正在瀏覽分享的對局戰績</h2>
              <p className="text-xs text-gray-400 mb-4">本網頁為唯讀歷史報表，載入了該場對局的所有計分與歷程。</p>
              <button
                onClick={() => {
                  window.history.pushState({}, document.title, window.location.pathname);
                  setGameState(INITIAL_STATE);
                  setAppMode('landing');
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

        {/* Phase 2 & 3: Active Scoreboard or Share view + Room Sync */}
        {(appMode === 'play' || appMode === 'finish') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Scoreboard (during play) or ShareCard (during finish) */}
            <div className="lg:col-span-2 space-y-6">
              {appMode === 'play' ? (
                <>
                  <Scoreboard 
                    gameState={gameState} 
                    setGameState={setGameState}
                    isTeachingMode={isTeachingMode}
                    isHost={isHost}
                    isGuest={isGuest}
                  />
                  
                  {!isGuest && (
                    <div className="pt-2">
                      <button
                        onClick={handleFinishGame}
                        className="btn btn-accent w-full py-3.5 text-lg font-black"
                      >
                        🏁 結束本局對局，結算勝負！
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ShareCard 
                  gameState={gameState}
                  isTeachingMode={isTeachingMode}
                />
              )}
            </div>

            {/* Right side: Room Sync Manager (remains mounted to sync finish state) */}
            <div className="space-y-6">
              <RoomManager 
                gameState={gameState}
                setGameState={setGameState}
                roomId={roomId}
                setRoomId={setRoomId}
                isHost={isHost}
                setIsHost={setIsHost}
                isTeachingMode={isTeachingMode}
                setAppMode={setAppMode}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-900 mt-8">
        <p>© 2026 台灣麻將助手. All rights reserved. 設計用於家庭聚會與麻將教學。</p>
      </footer>
    </div>
  );
}
