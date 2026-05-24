import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function RoomManager({ 
  gameState, 
  setGameState, 
  roomId, 
  setRoomId, 
  isHost, 
  setIsHost, 
  isTeachingMode 
}) {
  const [mqttStatus, setMqttStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const clientRef = useRef(null);
  const syncInProgress = useRef(false);

  // Parse room from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      setRoomId(roomParam);
      setIsHost(false);
      connectToRoom(roomParam, false);
    }
  }, []);

  // Generate QR Code when Room ID changes
  useEffect(() => {
    if (roomId && canvasRef.current) {
      const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#F3F4F6',
          light: '#12261C'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [roomId, mqttStatus]);

  // Sync state changes to MQTT (Host broadcasts, Guest broadcasts if they edit)
  useEffect(() => {
    if (mqttStatus === 'connected' && clientRef.current && roomId) {
      if (syncInProgress.current) {
        // Prevent feedback loop
        syncInProgress.current = false;
        return;
      }
      
      const payload = JSON.stringify({
        senderId: clientRef.current.options.clientId,
        timestamp: Date.now(),
        state: gameState
      });
      
      clientRef.current.publish(`mahjong-helper/room/${roomId}/state`, payload, { qos: 1, retain: true });
    }
  }, [gameState, roomId, mqttStatus]);

  const connectToRoom = (targetRoomId, amIHost) => {
    if (clientRef.current) {
      clientRef.current.end();
    }

    // Set Room ID and Host state immediately so UI updates instantly!
    setRoomId(targetRoomId);
    setIsHost(amIHost);
    setMqttStatus('connecting');
    
    const clientId = `mj_player_${Math.random().toString(16).substring(2, 8)}`;
    
    // Multiple fallback public brokers in case HiveMQ is blocked/offline
    const BROKERS = [
      'wss://broker.hivemq.com:8004/mqtt',
      'wss://broker.emqx.io:8084/mqtt',
      'wss://test.mosquitto.org:8081/mqtt'
    ];
    let brokerIndex = 0;
    
    const tryConnect = () => {
      if (!window.mqtt) {
        console.error('MQTT.js library not loaded in window!');
        setMqttStatus('error');
        return;
      }
      
      const brokerUrl = BROKERS[brokerIndex];
      console.log(`Connecting to MQTT broker: ${brokerUrl} (Attempt ${brokerIndex + 1})`);
      
      try {
        const client = window.mqtt.connect(brokerUrl, {
          clientId,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 4000,
        });

        clientRef.current = client;

        client.on('connect', () => {
          setMqttStatus('connected');
          client.subscribe(`mahjong-helper/room/${targetRoomId}/state`, { qos: 1 });
          console.log(`Successfully connected to broker ${brokerUrl} for room ${targetRoomId}`);
        });

        client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.senderId !== clientId) {
              syncInProgress.current = true;
              setGameState(data.state);
            }
          } catch (e) {
            console.error('Error parsing sync message:', e);
          }
        });

        client.on('error', (err) => {
          console.warn(`Connection failed for broker: ${brokerUrl}. Retrying next...`, err);
          client.end();
          
          // Switch to next broker and retry after delay
          brokerIndex = (brokerIndex + 1) % BROKERS.length;
          setMqttStatus('connecting');
          setTimeout(tryConnect, 2000);
        });

        client.on('close', () => {
          console.log(`Connection closed for broker: ${brokerUrl}`);
        });

      } catch (err) {
        console.error('MQTT connection initialization threw error:', err);
        brokerIndex = (brokerIndex + 1) % BROKERS.length;
        setTimeout(tryConnect, 2000);
      }
    };
    
    tryConnect();
  };

  const handleCreateRoom = () => {
    const newRoomId = `mj-${Math.floor(10000 + Math.random() * 90000)}`;
    connectToRoom(newRoomId, true);
  };

  const handleJoinRoomSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const targetRoomId = joinCodeInput.trim().toLowerCase();
    connectToRoom(targetRoomId, false);
  };

  const handleLeaveRoom = () => {
    if (clientRef.current) {
      clientRef.current.end();
      clientRef.current = null;
    }
    setRoomId('');
    setIsHost(false);
    setMqttStatus('disconnected');
    // Clear query param
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass-panel p-5">
      <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
        📡 {roomId ? '房間同步狀態' : '手機同步與多人連線'}
      </h3>

      {isTeachingMode && !roomId && (
        <div className="tip-bubble text-xs mb-4">
          <h4 className="font-bold text-[#10B981] mb-1">💡 什麼是多人連線？</h4>
          <p>
            一人建立房間後，會產生一個專屬房間號碼與 QR Code。其他玩家可以用手機掃描 QR Code 或輸入號碼加入。加入後，不論誰在自己手機上記分，所有人的畫面都會即時同步！
          </p>
        </div>
      )}

      {/* Disconnected / Initial State */}
      {!roomId && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleCreateRoom}
              className="btn btn-primary flex-1 py-3 text-sm"
            >
              🏠 建立新連線房間 (主持)
            </button>
          </div>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs">或</span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          <form onSubmit={handleJoinRoomSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="輸入 5 碼房間代號 (例如: mj-12345)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="form-input text-sm py-2 flex-1"
            />
            <button type="submit" className="btn btn-secondary px-4 text-sm">
              加入房間
            </button>
          </form>
        </div>
      )}

      {/* Connected State */}
      {roomId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-gray-800">
            <div>
              <p className="text-xs text-gray-400">房間代號</p>
              <p className="text-xl font-mono font-bold text-white uppercase tracking-wider">{roomId}</p>
            </div>
            <div className="text-right">
              <span className={`badge ${
                mqttStatus === 'connected' 
                  ? 'badge-green' 
                  : mqttStatus === 'connecting' 
                  ? 'badge-gold' 
                  : 'badge-red'
              } text-xs`}>
                {mqttStatus === 'connected' && '● 已同步連線'}
                {mqttStatus === 'connecting' && '○ 連線中...'}
                {mqttStatus === 'error' && '⚡ 連線失敗'}
                {mqttStatus === 'disconnected' && '● 連線中斷'}
              </span>
              <p className="text-[10px] text-gray-500 mt-1">
                身分: {isHost ? '房主 (主持)' : '成員 (加入)'}
              </p>
            </div>
          </div>

          {/* QR Code and Sharing Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/20 p-3 rounded">
            <div className="bg-[#12261C] p-2 rounded border border-gray-800 shrink-0">
              <canvas ref={canvasRef} className="block"></canvas>
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-xs text-gray-300 font-medium">
                手機掃描 QR Code 即可加入此記分板房間。
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={handleCopyLink}
                  className="btn btn-secondary text-xs py-1.5 px-3"
                >
                  📋 {copied ? '已複製連結！' : '複製加入連結'}
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="btn btn-accent text-xs py-1.5 px-3"
                >
                  🚪 離開房間
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
