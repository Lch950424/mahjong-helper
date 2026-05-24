import React, { useState } from 'react';

export default function SeatSetup({ players, setPlayers, isTeachingMode, onComplete }) {
  const [step, setStep] = useState(1);
  const [inputNames, setInputNames] = useState(['玩家一', '玩家二', '玩家三', '玩家四']);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [firstDrawerIdx, setFirstDrawerIdx] = useState(0);
  const [drawnTiles, setDrawnTiles] = useState([]); // [{ playerIndex, wind }]
  const [availableWinds, setAvailableWinds] = useState(['東', '南', '西', '北']);
  const [drawingTurn, setDrawingTurn] = useState(0); // Index of player who is drawing now

  const handleStartSetup = (e) => {
    e.preventDefault();
    setStep(2);
    setDrawingTurn(0);
    setDrawnTiles([]);
    setAvailableWinds(['東', '南', '西', '北']);
  };

  const handleRollDice = () => {
    if (diceRolling) return;
    setDiceRolling(true);
    
    // Simulate dice roll animation
    let count = 0;
    const interval = setInterval(() => {
      setDiceResult([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      count++;
      if (count > 8) {
        clearInterval(interval);
        
        const finalDice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ];
        const sum = finalDice.reduce((a, b) => a + b, 0);
        setDiceResult(finalDice);
        
        // In Taiwanese Mahjong:
        // Temp dealer is Player 1 (Index 0).
        // Sum counts counter-clockwise:
        // 1, 5, 9, 13, 17 => Player 1 (Index 0)
        // 2, 6, 10, 14, 18 => Player 2 (Index 1)
        // 3, 7, 11, 15 => Player 3 (Index 2)
        // 4, 8, 12, 16 => Player 4 (Index 3)
        const targetIdx = (sum - 1) % 4;
        setFirstDrawerIdx(targetIdx);
        setDrawingTurn(targetIdx);
        setDiceRolling(false);
        setStep(3); // Move to drawing step
      }
    }, 100);
  };

  const handleDrawTile = (tileIndex) => {
    if (drawnTiles.length >= 4) return;
    
    // The current drawer picks a tile from availableWinds
    const wind = availableWinds[tileIndex];
    const currentPlayerIdx = drawingTurn;
    
    const newDrawn = [...drawnTiles, { playerIndex: currentPlayerIdx, wind }];
    setDrawnTiles(newDrawn);
    
    const newAvailable = availableWinds.filter((_, i) => i !== tileIndex);
    setAvailableWinds(newAvailable);
    
    // Move turn to next player counter-clockwise (index + 1) % 4
    if (newDrawn.length < 4) {
      setDrawingTurn((currentPlayerIdx + 1) % 4);
    } else {
      // Finished drawing!
      // Assign seat positions based on drawn winds
      const updatedPlayers = [...inputNames].map((name, index) => {
        const draw = newDrawn.find(d => d.playerIndex === index);
        return {
          name,
          wind: draw.wind,
          score: 1000, // Initial score
        };
      });
      
      // Sort players so East is first, then South, West, North
      // Seating order: 東 -> 南 -> 西 -> 北 (counter-clockwise)
      const windOrder = { '東': 0, '南': 1, '西': 2, '北': 3 };
      updatedPlayers.sort((a, b) => windOrder[a.wind] - windOrder[b.wind]);
      
      setPlayers(updatedPlayers);
      setStep(4);
    }
  };

  const handleQuickSetup = () => {
    // Pro Mode Quick Seating (Random wind assignment)
    const winds = ['東', '南', '西', '北'].sort(() => Math.random() - 0.5);
    const updatedPlayers = inputNames.map((name, i) => ({
      name,
      wind: winds[i],
      score: 1000
    }));
    const windOrder = { '東': 0, '南': 1, '西': 2, '北': 3 };
    updatedPlayers.sort((a, b) => windOrder[a.wind] - windOrder[b.wind]);
    setPlayers(updatedPlayers);
    onComplete(updatedPlayers);
  };

  return (
    <div className="glass-panel p-6 max-w-2xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gradient text-[#D4AF37]">🀄 開局準備與抓位</h2>
        {!isTeachingMode && step < 4 && (
          <button onClick={handleQuickSetup} className="btn btn-secondary text-sm">
            ⚡ 快速隨機分位
          </button>
        )}
      </div>

      {isTeachingMode && (
        <div className="tip-bubble mb-6">
          <h4 className="font-bold text-[#10B981] mb-1">💡 什麼是抓位？</h4>
          <p className="text-sm">
            抓位是麻將開局前決定每個人「坐什麼方位」與「拿什麼風牌」的儀式。
            準備東、南、西、北四張牌蓋上，由一人丟三顆骰子，點數總和決定從誰開始抽牌，抽到東風的人就坐在東風位（莊家），其餘人依東、南、西、北逆時針入座。
          </p>
        </div>
      )}

      {/* Step 1: Input Player Names */}
      {step === 1 && (
        <form onSubmit={handleStartSetup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {inputNames.map((name, idx) => (
              <div key={idx}>
                <label className="form-label">玩家 {idx + 1} 名字</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    const newNames = [...inputNames];
                    newNames[idx] = e.target.value;
                    setInputNames(newNames);
                  }}
                  className="form-input"
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4">
            開始抓位流程
          </button>
        </form>
      )}

      {/* Step 2: Roll Dice to choose first drawer */}
      {step === 2 && (
        <div className="text-center py-6">
          <p className="mb-4 text-lg">現在由暫定莊家 <strong>{inputNames[0]}</strong> 擲骰子決定誰先抽牌：</p>
          
          <div className="dice-container">
            {diceResult ? diceResult.map((val, idx) => (
              <div key={idx} className={`dice ${diceRolling ? 'dice-shake' : ''}`}>
                {val === 1 && <div className="dot red" style={{gridArea: '2/2'}}></div>}
                {val === 2 && (
                  <>
                    <div className="dot" style={{gridArea: '1/1'}}></div>
                    <div className="dot" style={{gridArea: '3/3'}}></div>
                  </>
                )}
                {val === 3 && (
                  <>
                    <div className="dot" style={{gridArea: '1/1'}}></div>
                    <div className="dot" style={{gridArea: '2/2'}}></div>
                    <div className="dot" style={{gridArea: '3/3'}}></div>
                  </>
                )}
                {val === 4 && (
                  <>
                    <div className="dot red" style={{gridArea: '1/1'}}></div>
                    <div className="dot red" style={{gridArea: '1/3'}}></div>
                    <div className="dot red" style={{gridArea: '3/1'}}></div>
                    <div className="dot red" style={{gridArea: '3/3'}}></div>
                  </>
                )}
                {val === 5 && (
                  <>
                    <div className="dot" style={{gridArea: '1/1'}}></div>
                    <div className="dot" style={{gridArea: '1/3'}}></div>
                    <div className="dot" style={{gridArea: '2/2'}}></div>
                    <div className="dot" style={{gridArea: '3/1'}}></div>
                    <div className="dot" style={{gridArea: '3/3'}}></div>
                  </>
                )}
                {val === 6 && (
                  <>
                    <div className="dot" style={{gridArea: '1/1'}}></div>
                    <div className="dot" style={{gridArea: '1/3'}}></div>
                    <div className="dot" style={{gridArea: '2/1'}}></div>
                    <div className="dot" style={{gridArea: '2/3'}}></div>
                    <div className="dot" style={{gridArea: '3/1'}}></div>
                    <div className="dot" style={{gridArea: '3/3'}}></div>
                  </>
                )}
              </div>
            )) : (
              <div className="text-gray-500 italic text-sm">骰子準備中...</div>
            )}
          </div>

          {diceResult && !diceRolling && (
            <div className="my-4 text-gradient text-xl font-bold text-[#D4AF37]">
              點數合計: {diceResult.reduce((a, b) => a + b, 0)} 點！
            </div>
          )}

          {isTeachingMode && diceResult && !diceRolling && (
            <div className="text-left bg-black/35 p-3 rounded mb-4 text-xs text-gray-300">
              💡 計算規則：從莊家自己開始數1，右手邊（逆時針）為2，對家為3，左手邊為4，數到 {diceResult.reduce((a, b) => a + b, 0)} 即為起抽玩家。
              得出的起抽玩家為：<strong>{inputNames[(diceResult.reduce((a, b) => a + b, 0) - 1) % 4]}</strong>。
            </div>
          )}

          <button
            onClick={handleRollDice}
            disabled={diceRolling}
            className={`btn btn-primary px-8 mt-2 ${diceRolling ? 'btn-disabled' : ''}`}
          >
            {diceRolling ? '擲骰中...' : '按此擲骰子'}
          </button>
        </div>
      )}

      {/* Step 3: Draw Tiles */}
      {step === 3 && (
        <div className="text-center py-4">
          <p className="mb-6 text-lg">
            輪到 <strong>{inputNames[drawingTurn]}</strong> 抽牌！請點擊一張牌：
          </p>

          <div className="flex gap-4 justify-center my-8">
            {availableWinds.map((_, idx) => (
              <div
                key={idx}
                onClick={() => handleDrawTile(idx)}
                className="mj-tile"
                style={{ fontSize: '1.2rem', color: '#166534' }}
              >
                🀄
              </div>
            ))}
          </div>

          <div className="mt-6 text-left">
            <h4 className="font-semibold mb-2">目前抽牌結果：</h4>
            <div className="grid grid-cols-2 gap-2">
              {inputNames.map((name, idx) => {
                const draw = drawnTiles.find(d => d.playerIndex === idx);
                return (
                  <div key={idx} className="bg-black/20 p-2 rounded flex justify-between items-center">
                    <span>{name}</span>
                    {draw ? (
                      <span className="badge badge-gold font-bold text-base px-3 py-1">{draw.wind}</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">等待抽牌...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Show Seating Order and Guide How to Sit */}
      {step === 4 && (
        <div className="py-2">
          <div className="text-center mb-6">
            <p className="text-green-400 font-bold text-lg mb-1">🎉 抓位完成！請依以下方位就座：</p>
            <p className="text-xs text-gray-400">麻將的逆時針順序是：東 ➔ 南 ➔ 西 ➔ 北</p>
          </div>

          {/* Interactive Seating Map */}
          <div className="seat-map-container my-8">
            <div className="seat-table">麻將桌</div>
            
            {/* North Seat */}
            <div className="seat-player north">
              <span className="text-xs text-gray-400 font-normal">上方(北風)</span>
              <strong>{players.find(p => p.wind === '北')?.name}</strong>
              <span className="badge badge-gold text-xs">北</span>
            </div>
            
            {/* South Seat */}
            <div className="seat-player south">
              <span className="text-xs text-gray-400 font-normal">下方(南風)</span>
              <strong>{players.find(p => p.wind === '南')?.name}</strong>
              <span className="badge badge-gold text-xs">南</span>
            </div>

            {/* East Seat - Dealer first round */}
            <div className="seat-player east active">
              <span className="text-xs text-gray-400 font-normal">右方(東風 - 莊家)</span>
              <strong>{players.find(p => p.wind === '東')?.name}</strong>
              <span className="badge badge-gold text-xs">東</span>
            </div>

            {/* West Seat */}
            <div className="seat-player west">
              <span className="text-xs text-gray-400 font-normal">左方(西風)</span>
              <strong>{players.find(p => p.wind === '西')?.name}</strong>
              <span className="badge badge-gold text-xs">西</span>
            </div>
          </div>

          {isTeachingMode && (
            <div className="tip-bubble text-sm mb-6">
              <h4 className="font-bold text-[#10B981] mb-1">💡 如何坐位子？</h4>
              <p className="mb-2">
                <strong>1. 安排座位</strong>：
                抽到<strong>東風</strong>的人先選一個位子坐下。接著，抽到<strong>南風</strong>的人坐在東風的<strong>右手邊</strong>，抽到<strong>西風</strong>的人坐在東風的<strong>對面</strong>，抽到<strong>北風</strong>的人坐在東風的<strong>左手邊</strong>。
              </p>
              <p>
                <strong>2. 開局起莊</strong>：
                坐在東風位的人在第一圈（東風圈）第一局（東風局）擔任<strong>莊家</strong>。
              </p>
            </div>
          )}

          <button
            onClick={() => onComplete(players)}
            className="btn btn-primary w-full py-3"
          >
            大家已就座，開始正規麻將！
          </button>
        </div>
      )}
    </div>
  );
}
