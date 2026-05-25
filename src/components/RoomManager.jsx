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

  // Use a Ref for gameState to avoid stale closures in MQTT message handlers
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Parse room from URL on mount (if joining via link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      setRoomId(roomParam);
      setIsHost(false);
      connectToRoom(roomParam, false);
    }
  }, []);

  // Self-healing: Auto reconnect on refresh if roomId is present in state/localStorage
  useEffect(() => {
    if (roomId && mqttStatus === 'disconnected' && !clientRef.current) {
      console.log('Restoring MQTT connection on reload/mount for room:', roomId);
      connectToRoom(roomId, isHost);
    }
  }, [roomId]);

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

  // Broadcast state changes to room (only if we updated it locally, i.e., syncInProgress is false)
  useEffect(() => {
    if (mqttStatus === 'connected' && clientRef.current && roomId) {
      if (syncInProgress.current) {
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
      clientRef.current = null;
    }

    // Update Room ID and Host state immediately so the UI transitions instantly!
    setRoomId(targetRoomId);
    setIsHost(amIHost);
    setMqttStatus('connecting');
    
    const clientId = `mj_player_${Math.random().toString(16).substring(2, 8)}`;
    
    // Multiple public MQTT brokers for failover redundancy
    const BROKERS = [
      'wss://broker.hivemq.com:8004/mqtt',
      'wss://broker.emqx.io:8084/mqtt',
      'wss://test.mosquitto.org:8081/mqtt'
    ];
    let brokerIndex = 0;
    let connectionTimeout = null;
    
    const tryConnect = () => {
      // Clear previous timeout if any
      if (connectionTimeout) clearTimeout(connectionTimeout);

      // Race condition safety: If CDN script hasn't finished loading, wait and retry
      if (!window.mqtt) {
        console.log('MQTT.js not loaded in window yet. Retrying in 500ms...');
        setMqttStatus('connecting');
        connectionTimeout = setTimeout(tryConnect, 500);
        return;
      }
      
      const brokerUrl = BROKERS[brokerIndex];
      console.log(`Connecting to MQTT broker: ${brokerUrl} (Attempt ${brokerIndex + 1})`);
      
      try {
        const client = window.mqtt.connect(brokerUrl, {
          clientId,
          clean: true,
          connectTimeout: 4000,
          reconnectPeriod: 10000, // Keep long reconnect to prevent collision with manual rotation
        });

        clientRef.current = client;

        // Manual timeout: If it doesn't connect in 5 seconds, rotate broker and try again
        connectionTimeout = setTimeout(() => {
          if (clientRef.current && mqttStatus !== 'connected') {
            console.warn(`Connection to ${brokerUrl} timed out after 5s. Rotating to next broker...`);
            client.end();
            clientRef.current = null;
            brokerIndex = (brokerIndex + 1) % BROKERS.length;
            setMqttStatus('connecting');
            tryConnect();
          }
        }, 5000);

        client.on('connect', () => {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          setMqttStatus('connected');
          
          // Subscribe to state updates
          client.subscribe(`mahjong-helper/room/${targetRoomId}/state`, { qos: 1 });
          
          if (amIHost) {
            // Host subscribes to join pings
            client.subscribe(`mahjong-helper/room/${targetRoomId}/join`, { qos: 1 });
            // Broadcast initial state so anyone currently in room gets it
            const payload = JSON.stringify({
              senderId: clientId,
              timestamp: Date.now(),
              state: gameStateRef.current
            });
            client.publish(`mahjong-helper/room/${targetRoomId}/state`, payload, { qos: 1, retain: true });
          } else {
            // Guest sends a join ping to request state from the host
            client.publish(`mahjong-helper/room/${targetRoomId}/join`, clientId, { qos: 1 });
          }
          console.log(`Successfully connected to broker ${brokerUrl} for room ${targetRoomId}`);
        });

        client.on('message', (topic, message) => {
          // Handshake protocol: Host responds to new joiners by republishing state
          if (topic === `mahjong-helper/room/${targetRoomId}/join`) {
            if (amIHost) {
              console.log('Guest joined the room. Re-broadcasting current state...');
              const payload = JSON.stringify({
                senderId: clientId,
                timestamp: Date.now(),
                state: gameStateRef.current
              });
              client.publish(`mahjong-helper/room/${targetRoomId}/state`, payload, { qos: 1, retain: true });
            }
            return;
          }

          // State sync updates
          try {
            const data = JSON.parse(message.toString());
            if (data.senderId !== clientId) {
              const incomingVersion = data.state?.version || 0;
              const localVersion = gameStateRef.current.version || 0;
              
              // Only apply sync if incoming state version is higher
              if (incomingVersion > localVersion) {
                console.log(`Syncing state: local version ${localVersion} -> incoming version ${incomingVersion}`);
                syncInProgress.current = true;
                setGameState(data.state);
              }
            }
          } catch (e) {
            console.error('Error parsing sync message:', e);
          }
        });

        client.on('error', (err) => {
          console.warn(`MQTT connection error on ${brokerUrl}:`, err);
          // Let the 5s timeout handle rotation
        });

        client.on('close', () => {
          console.log(`Connection closed for broker: ${brokerUrl}`);
        });

      } catch (err) {
        console.error('MQTT connection initialization threw error:', err);
        brokerIndex = (brokerIndex + 1) % BROKERS.length;
        connectionTimeout = setTimeout(tryConnect, 2000);
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
    localStorage.removeItem('mahjong_helper_room_id');
    localStorage.removeItem('mahjong_helper_is_host');
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
