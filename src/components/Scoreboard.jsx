import React, { useState } from 'react';
import TaiCalculator from './TaiCalculator';

export default function Scoreboard({ 
  gameState, 
  setGameState, 
  isTeachingMode,
  isHost
}) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTaiCalcModal, setShowTaiCalcModal] = useState(false);
  
  // Modal Entry Form State
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [winType, setWinType] = useState('zimo'); // zimo, discard, draw
  const [loserIdx, setLoserIdx] = useState(1);
  const [taiCount, setTaiCount] = useState(0);
  const [selectedTaiList, setSelectedTaiList] = useState([]);
  
  const { players, roundInfo, history, baseSetting } = gameState;
  const { windCircle, dealerIndex, dealerStreak, handNum } = roundInfo;

  // Directions mapping
  const winds = ['東', '南', '西', '北'];

  const handleOpenLogModal = () => {
    // Pre-select winner as current dealer by default
    setWinnerIdx(dealerIndex);
    // Pre-select first non-dealer as loser for discard
    const firstNonDealer = (dealerIndex + 1) % 4;
    setLoserIdx(firstNonDealer);
    setWinType('zimo');
    setTaiCount(0);
    setSelectedTaiList([]);
    setShowLogModal(true);
  };

  const handleApplyTai = (tai, list) => {
    setTaiCount(tai);
    setSelectedTaiList(list);
    setShowTaiCalcModal(false);
  };

  const handleSaveHand = () => {
    const updatedPlayers = players.map(p => ({ ...p }));
    let logEntry = {
      handId: Date.now(),
      roundName: `${windCircle}風圈 - ${players[dealerIndex].wind}風局 (第 ${handNum} 手)`,
      dealerName: players[dealerIndex].name,
      dealerStreak,
      winType,
    };

    if (winType === 'draw') {
      // Draw (流局): No score change. Dealer continues (連莊)
      logEntry.description = '流局 (荒牌)';
      logEntry.scoreChange = {};
      
      const newRoundInfo = {
        ...roundInfo,
        dealerStreak: dealerStreak + 1,
        handNum: handNum + 1
      };

      setGameState({
        ...gameState,
        roundInfo: newRoundInfo,
        history: [logEntry, ...history],
        version: (gameState.version || 0) + 1
      });
      setShowLogModal(false);
      return;
    }

    // Points calculation: Base + (Tai * TaiValue)
    const points = baseSetting.base + (taiCount * baseSetting.taiValue);
    logEntry.tai = taiCount;
    logEntry.taiDetails = selectedTaiList;
    logEntry.winner = players[winnerIdx].name;

    const scoreChange = {};

    if (winType === 'zimo') {
      // Self-drawn (自摸): Winner gets points from other 3 players.
      logEntry.description = `${players[winnerIdx].name} 自摸 ${taiCount} 台 (+${points * 3}分)`;
      
      updatedPlayers[winnerIdx].score += points * 3;
      scoreChange[players[winnerIdx].name] = points * 3;

      players.forEach((p, idx) => {
        if (idx !== winnerIdx) {
          updatedPlayers[idx].score -= points;
          scoreChange[p.name] = -points;
        }
      });
    } else if (winType === 'discard') {
      // Discard Win (放槍): Winner gets points from discarder (loser). Others 0.
      logEntry.loser = players[loserIdx].name;
      logEntry.description = `${players[winnerIdx].name} 胡 ${players[loserIdx].name} 放槍 ${taiCount} 台 (+${points}分)`;
      
      updatedPlayers[winnerIdx].score += points;
      updatedPlayers[loserIdx].score -= points;
      
      scoreChange[players[winnerIdx].name] = points;
      scoreChange[players[loserIdx].name] = -points;
      
      players.forEach((p, idx) => {
        if (idx !== winnerIdx && idx !== loserIdx) {
          scoreChange[p.name] = 0;
        }
      });
    }

    logEntry.scoreChange = scoreChange;

    // Determine next dealer and streak
    let nextDealerIndex = dealerIndex;
    let nextDealerStreak = 0;
    let nextWindCircle = windCircle;
    let nextHandNum = handNum + 1;

    // In Taiwanese Mahjong:
    // If dealer wins (either self-draw or discard win), they continue (連莊)
    if (winnerIdx === dealerIndex) {
      nextDealerStreak = dealerStreak + 1;
    } else {
      // If someone else wins, dealer shifts to next player (下莊)
      nextDealerIndex = (dealerIndex + 1) % 4;
      nextDealerStreak = 0;

      // If dealer shifts back to 0 (East seat), we checked if it moves to next wind circle
      // Wait, dealer shifts in seating order (東 -> 南 -> 西 -> 北).
      // When the original East player shifts (after North finishes being dealer), one full round of dealers (東局, 南局, 西局, 北局) is done!
      // In Taiwan rules: When North player loses dealer position, the dealer index shifts back to East (index 0), and that completes one "局" cycle.
      // Wait! If the dealer shifts from North (index 3) to East (index 0), it means one round of dealers is complete.
      // If this was the last round in the circle (e.g. after North of East-wind circle), does the wind circle change?
      // In Taiwan Mahjong:
      // East-wind circle (東風圈): East局, South局, West局, North局 (each shifts when someone else wins).
      // Once North player in East-wind circle loses dealer, we shift to South-wind circle (南風圈) East局.
      // So when dealer shifts from Index 3 to Index 0:
      if (dealerIndex === 3) {
        const circleSequence = ['東', '南', '西', '北'];
        const currentCircleIdx = circleSequence.indexOf(windCircle);
        nextWindCircle = circleSequence[(currentCircleIdx + 1) % 4];
      }
    }

    // Assign new winds based on who is the current dealer (Dealer is always East wind of that局!)
    // In Taiwanese Mahjong, physical seats are fixed, but the "wind" representing dealer shifts.
    // However, in this scoreboard, we keep the seat wind relative or fix the display.
    // The easiest display for players is to show their relative score sheet.
    
    setGameState({
      ...gameState,
      players: updatedPlayers,
      roundInfo: {
        windCircle: nextWindCircle,
        dealerIndex: nextDealerIndex,
        dealerStreak: nextDealerStreak,
        handNum: nextHandNum
      },
      history: [logEntry, ...history],
      version: (gameState.version || 0) + 1
    });

    setShowLogModal(false);
  };

  const handleUndoLastHand = () => {
    if (history.length === 0) return;
    if (!window.confirm('確定要復原上一手（刪除最後一筆紀錄並還原分數）嗎？')) return;

    const lastHand = history[0];
    const updatedPlayers = players.map(p => ({ ...p }));

    // Revert score changes
    if (lastHand.scoreChange) {
      Object.entries(lastHand.scoreChange).forEach(([name, diff]) => {
        const pIdx = updatedPlayers.findIndex(p => p.name === name);
        if (pIdx !== -1) {
          updatedPlayers[pIdx].score -= diff;
        }
      });
    }

    // Revert round info
    let prevDealerIndex = dealerIndex;
    let prevDealerStreak = lastHand.dealerStreak;
    let prevWindCircle = windCircle;
    
    // Calculate previous dealer position
    // If the last hand was a draw or dealer won, the dealer didn't change
    if (lastHand.winType === 'draw' || lastHand.winner === lastHand.dealerName) {
      prevDealerIndex = dealerIndex;
    } else {
      // Dealer changed! We must shift back by 1 player
      prevDealerIndex = (dealerIndex - 1 + 4) % 4;
      
      // If we shifted from East (0) back to North (3), we might need to revert wind circle
      if (dealerIndex === 0) {
        const circleSequence = ['東', '南', '西', '北'];
        const currentCircleIdx = circleSequence.indexOf(windCircle);
        prevWindCircle = circleSequence[(currentCircleIdx - 1 + 4) % 4];
      }
    }

    setGameState({
      ...gameState,
      players: updatedPlayers,
      roundInfo: {
        windCircle: prevWindCircle,
        dealerIndex: prevDealerIndex,
        dealerStreak: prevDealerStreak,
        handNum: Math.max(1, handNum - 1)
      },
      history: history.slice(1),
      version: (gameState.version || 0) + 1
    });
  };

  return (
    <div className="space-y-6">
      {/* HUD Info bar */}
      <div className="glass-panel p-4 flex justify-between items-center bg-emerald-950/40">
        <div>
          <span className="badge badge-gold font-bold text-sm tracking-wider mr-2">
            {windCircle}風圈
          </span>
          <span className="text-gray-300 font-medium">
            {players[dealerIndex]?.name} 的 {players[dealerIndex]?.wind}風局
          </span>
          {dealerStreak > 0 && (
            <span className="ml-2 badge badge-red animate-pulse">
              連 {dealerStreak}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">當前進度</p>
          <p className="font-bold text-white">第 {handNum} 局</p>
        </div>
      </div>

      {isTeachingMode && (
        <div className="tip-bubble text-xs">
          <h4 className="font-bold text-[#10B981] mb-1">💡 莊家與連莊規則說明</h4>
          <p className="mb-1">
            • <strong>莊家連莊</strong>：若這回合是莊家胡牌、自摸或流局，則莊家繼續坐莊（連莊數+1），並獲得連莊台數加成。
          </p>
          <p>
            • <strong>下莊移位</strong>：若閒家贏牌，莊家下莊，由右手邊的下一家（逆時針）擔任新莊家，連莊數歸零。
          </p>
        </div>
      )}

      {/* Players grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {players.map((player, idx) => {
          const isCurrentDealer = idx === dealerIndex;
          return (
            <div 
              key={player.name}
              className={`glass-panel p-4 text-center transition-all relative ${
                isCurrentDealer 
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-gold' 
                  : 'border-gray-800'
              }`}
            >
              {isCurrentDealer && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 badge badge-red text-[10px] px-2 py-0.5 font-bold">
                  莊家 {dealerStreak > 0 ? `L${dealerStreak}` : ''}
                </span>
              )}
              <span className="text-xs text-gray-500 font-mono block mb-1">座位: {player.wind}風</span>
              <h4 className="text-lg font-bold text-white mb-2">{player.name}</h4>
              <div className={`text-2xl font-black ${
                player.score >= 1000 ? 'text-[#10B981]' : 'text-[#E11D48]'
              }`}>
                {player.score}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {player.score - 1000 >= 0 ? `+${player.score - 1000}` : player.score - 1000}
              </p>
            </div>
          );
        })}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleOpenLogModal}
          className="btn btn-primary flex-1 py-3 text-lg"
        >
          📝 登記這回合結果
        </button>

        {history.length > 0 && (
          <button
            onClick={handleUndoLastHand}
            className="btn btn-secondary px-4 text-sm"
            title="復原上一手"
          >
            ↩ 復原
          </button>
        )}
      </div>

      {/* History Log */}
      <div className="glass-panel p-4">
        <h3 className="text-md font-bold text-[#D4AF37] mb-3">📋 本局對戰紀錄 ({history.length} 回合)</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-6 text-gray-500 italic text-sm">
            目前尚無紀錄，點選上方按鈕開始登記！
          </div>
        ) : (
          <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
            {history.map((log) => (
              <div 
                key={log.handId} 
                className="result-entry bg-black/35 border border-gray-800/80 p-3 rounded flex justify-between items-center text-sm"
              >
                <div>
                  <span className="text-xs text-gray-400 font-mono block">{log.roundName}</span>
                  <span className="font-medium text-white">{log.description}</span>
                  {log.taiDetails && log.taiDetails.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.taiDetails.map(t => (
                        <span key={t} className="text-[10px] bg-emerald-950/50 border border-emerald-500/20 text-[#10B981] px-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className={`badge ${log.winType === 'draw' ? 'badge-gold' : 'badge-green'} text-xs`}>
                    {log.winType === 'zimo' && '自摸'}
                    {log.winType === 'discard' && '胡牌'}
                    {log.winType === 'draw' && '流局'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Hand Result Modal */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel p-6 border-gray-700 bg-[#0F261B]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">登記回合結果</h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="form-label">獲勝類型</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'zimo', label: '自摸' },
                    { id: 'discard', label: '胡牌 (放槍)' },
                    { id: 'draw', label: '流局' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWinType(t.id)}
                      className={`btn text-xs py-2 ${
                        winType === t.id ? 'btn-primary' : 'btn-secondary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {winType !== 'draw' && (
                <>
                  {/* Winner Select */}
                  <div>
                    <label className="form-label">贏家 (胡牌者)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {players.map((p, idx) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setWinnerIdx(idx)}
                          className={`btn text-xs py-2 ${
                            winnerIdx === idx ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Discarder Select (only if Discard Win) */}
                  {winType === 'discard' && (
                    <div>
                      <label className="form-label">放槍者 (放銃/出銃)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {players.map((p, idx) => {
                          const isWinner = idx === winnerIdx;
                          return (
                            <button
                              key={p.name}
                              type="button"
                              disabled={isWinner}
                              onClick={() => setLoserIdx(idx)}
                              className={`btn text-xs py-2 ${
                                isWinner 
                                  ? 'btn-disabled' 
                                  : loserIdx === idx 
                                  ? 'btn-accent' 
                                  : 'btn-secondary'
                              }`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tai Count Select */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="form-label mb-0">台數計分</label>
                      <button
                        type="button"
                        onClick={() => setShowTaiCalcModal(true)}
                        className="text-xs text-[#D4AF37] hover:underline"
                      >
                        🧮 開啟台數計算器
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={taiCount}
                        onChange={(e) => setTaiCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="form-input text-center text-lg font-bold w-24"
                      />
                      <span className="text-gray-400">台</span>
                      <span className="text-sm text-gray-500">
                        (= {baseSetting.base + (taiCount * baseSetting.taiValue)} 分 / 底數 {baseSetting.base} 台數 {baseSetting.taiValue})
                      </span>
                    </div>
                  </div>
                </>
              )}

              {winType === 'draw' && (
                <div className="p-3 bg-black/20 rounded text-xs text-gray-400">
                  💡 流局：四家皆未胡牌，本局分數不變，莊家繼續連莊（連莊數 +1）。
                </div>
              )}

              {/* Confirm / Action */}
              <div className="pt-4 border-t border-gray-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveHand}
                  className="btn btn-primary flex-1"
                >
                  確認送出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tai Calculator Modal */}
      {showTaiCalcModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-panel max-w-xl p-0 overflow-hidden border-gray-700">
            <div className="p-4 bg-emerald-950 flex justify-between items-center border-b border-gray-800">
              <h3 className="text-md font-bold text-white">🧮 選擇胡牌台數</h3>
              <button 
                onClick={() => setShowTaiCalcModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <TaiCalculator 
              onConfirm={handleApplyTai} 
              isTeachingMode={isTeachingMode}
              currentDealerStreak={winnerIdx === dealerIndex ? dealerStreak : 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
