import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function ShareCard({ gameState, isTeachingMode }) {
  const canvasRef = useRef(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { players, roundInfo, history, baseSetting } = gameState;

  // Trigger confetti for the winner on mount
  useEffect(() => {
    // Basic explosion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  // Generate canvas battle report and share link
  useEffect(() => {
    // 1. Generate Share Link
    try {
      const dataStr = JSON.stringify({
        players,
        roundInfo,
        history: history.slice(0, 15), // Limit history size to prevent URL length limits
        baseSetting
      });
      const encoded = btoa(encodeURIComponent(dataStr));
      const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      setShareLink(url);
    } catch (e) {
      console.error('Error generating share link:', e);
    }

    // 2. Render Canvas
    renderCanvas();
  }, [players, history, baseSetting]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set width and height (high resolution)
    canvas.width = 600;
    canvas.height = 800;

    // Draw background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0B1E14'); // Deep forest
    grad.addColorStop(1, '#050D09'); // Dark black-green
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw gold border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Inner subtle border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Title
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 36px "Noto Sans TC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🀄 台灣麻將對局結算', canvas.width / 2, 80);

    // Meta details
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px "Noto Sans TC", system-ui, sans-serif';
    const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`日期: ${dateStr}  |  底台數: ${baseSetting.base}底 / ${baseSetting.taiValue}台`, canvas.width / 2, 115);
    ctx.fillText(`總局數: 第 ${roundInfo.handNum - 1} 手結束  |  最終圈位: ${roundInfo.windCircle}風圈`, canvas.width / 2, 140);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(40, 165);
    ctx.lineTo(canvas.width - 40, 165);
    ctx.stroke();

    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // Top player title
    const MVP = sortedPlayers[0];
    const LVP = sortedPlayers[3];

    // Draw MVP/LVP Highlights
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.fillRect(40, 185, canvas.width - 80, 110);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.strokeRect(40, 185, canvas.width - 80, 110);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 22px "Noto Sans TC", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👑 本局雀神 (第一名)', 60, 225);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Noto Sans TC", system-ui, sans-serif';
    ctx.fillText(MVP.name, 60, 270);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 28px "Noto Sans TC", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${MVP.score} 分`, canvas.width - 60, 240);
    
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px "Noto Sans TC", system-ui, sans-serif';
    ctx.fillText(`淨賺 +${MVP.score - 1000} 分`, canvas.width - 60, 270);

    // Table Header
    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 16px "Noto Sans TC", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('名次', 60, 340);
    ctx.fillText('玩家姓名', 140, 340);
    ctx.fillText('初始方位', 300, 340);
    ctx.textAlign = 'right';
    ctx.fillText('最終積分', 420, 340);
    ctx.fillText('損益', 540, 340);

    // Draw Row Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(40, 355);
    ctx.lineTo(canvas.width - 40, 355);
    ctx.stroke();

    // Table Rows
    sortedPlayers.forEach((p, idx) => {
      const y = 400 + idx * 70;
      
      // Zebra background
      if (idx % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(40, y - 30, canvas.width - 80, 50);
      }

      // Rank symbol
      ctx.textAlign = 'left';
      ctx.font = 'bold 20px "Noto Sans TC", system-ui, sans-serif';
      if (idx === 0) {
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.fillText('🥇', 60, y);
      } else if (idx === 1) {
        ctx.fillStyle = '#94A3B8'; // Silver
        ctx.fillText('🥈', 60, y);
      } else if (idx === 2) {
        ctx.fillStyle = '#B45309'; // Bronze
        ctx.fillText('🥉', 60, y);
      } else {
        ctx.fillStyle = '#E11D48'; // Red/Last
        ctx.fillText('💀', 60, y);
      }

      // Player Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px "Noto Sans TC", system-ui, sans-serif';
      ctx.fillText(p.name, 140, y);

      // Seat Wind
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '16px "Noto Sans TC", system-ui, sans-serif';
      ctx.fillText(`${p.wind}風位`, 300, y);

      // Score
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px "Noto Sans TC", system-ui, sans-serif';
      ctx.fillText(p.score, 420, y);

      // Diff
      const diff = p.score - 1000;
      if (diff > 0) {
        ctx.fillStyle = '#10B981'; // Green profit
        ctx.fillText(`+${diff}`, 540, y);
      } else if (diff < 0) {
        ctx.fillStyle = '#E11D48'; // Red loss
        ctx.fillText(`${diff}`, 540, y);
      } else {
        ctx.fillStyle = '#9CA3AF'; // Gray even
        ctx.fillText('0', 540, y);
      }
    });

    // Draw Footer Notes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(40, 680);
    ctx.lineTo(canvas.width - 40, 680);
    ctx.stroke();

    // Footer signature
    ctx.fillStyle = '#6B7280';
    ctx.font = 'italic 14px "Noto Sans TC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('由「🀄 台灣麻將助手」製作生成', canvas.width / 2, 720);
    ctx.fillText('掃碼或點擊分享連結，可在線重播本局完整歷史紀錄！', canvas.width / 2, 745);

    setImageLoaded(true);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `mahjong-report-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass-panel p-6 max-w-2xl mx-auto my-6 text-center">
      <h2 className="text-2xl font-black text-[#D4AF37] mb-2">🏆 對局順利結束！</h2>
      <p className="text-gray-400 text-sm mb-6">點擊下方按鈕，您可以下載精美戰績海報或複製分享連結給朋友！</p>

      {isTeachingMode && (
        <div className="tip-bubble text-xs text-left mb-6">
          <h4 className="font-bold text-[#10B981] mb-1">💡 如何分享？</h4>
          <p className="mb-1">• <strong>下載戰績圖</strong>：自動將本次麻將的分數名次、日期、底台設定合成一張精美圖片，可分享至 Line/FB 社群。</p>
          <p>• <strong>複製分享連結</strong>：連結中內嵌了本局所有的對局歷程，任何人打開這個連結都能瀏覽所有回合的放槍、自摸紀錄。</p>
        </div>
      )}

      {/* Render canvas on screen but wrapped or styled nicely */}
      <div className="flex justify-center mb-6">
        <div className="border-2 border-[#D4AF37] p-1.5 rounded-lg bg-black/40 overflow-hidden max-w-full">
          <canvas 
            ref={canvasRef} 
            className="block max-w-full h-auto rounded"
            style={{ width: '300px', height: '400px' }}
          ></canvas>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <button
          onClick={handleDownloadImage}
          className="btn btn-primary flex-1 py-3 text-sm"
        >
          🖼️ 下載精美戰績圖
        </button>
        <button
          onClick={handleCopyLink}
          className="btn btn-secondary flex-1 py-3 text-sm"
        >
          📋 {copied ? '已複製連結！' : '複製歷史分享連結'}
        </button>
      </div>
      
      {shareLink && (
        <div className="mt-4 bg-black/40 p-2.5 rounded border border-gray-800 break-all text-left max-w-md mx-auto text-[10px] text-gray-500 font-mono">
          分享網址: {shareLink.substring(0, 80)}...
        </div>
      )}
    </div>
  );
}
