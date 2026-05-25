import React, { useState, useEffect } from 'react';

// List of Taiwanese Mahjong Tai items for the manual checklist
const TAI_ITEMS = {
  basic: [
    { id: 'zimo', name: '自摸', tai: 1, desc: '自己摸到贏牌的最後一張牌。' },
    { id: 'menqing', name: '門清', tai: 1, desc: '沒有吃、碰、明槓，整手牌都是自己摸來的（可暗槓）。' },
    { id: 'duting', name: '獨聽', tai: 1, desc: '聽牌只聽一張（包括：中洞/卡窿、邊張、單吊）。' },
    { id: 'qianggang', name: '搶槓', tai: 1, desc: '對手明槓時，該牌剛好是自己要胡的牌。' },
    { id: 'gangkai', name: '槓上開花', tai: 1, desc: '摸到槓牌或補花後，補牌剛好胡牌。' },
    { id: 'haidi', name: '海底撈月', tai: 1, desc: '摸海底最後一張牌而胡牌。' },
    { id: 'tingpai', name: '聽牌 (宣告)', tai: 1, desc: '起手後宣告聽牌（需符合門清等條件）。' },
    { id: 'migi', name: '咪幾 (天聽/地聽)', tai: 8, desc: '閒家起手八張內在無吃碰槓的情況下宣告聽牌。' },
  ],
  winds: [
    { id: 'zhuangjia', name: '莊家', tai: 1, desc: '本局擔任莊家。' },
    { id: 'quanfeng', name: '圈風刻', tai: 1, desc: '擁有與當前圈風相同的風牌刻子（如東風圈拿到東風刻）。' },
    { id: 'menfeng', name: '門風刻', tai: 1, desc: '擁有與自己座位相同的風牌刻子（如坐南風位拿到南風刻）。' },
    { id: 'sanyuan', name: '三元牌刻', tai: 1, desc: '擁有中、發、白任意一組刻子（每組1台）。', count: true, max: 3 },
    { id: 'xiaosanyuan', name: '小三元', tai: 4, desc: '中、發、白其中兩組為刻子，一組為將牌（眼睛）。' },
    { id: 'dasanyuan', name: '大三元', tai: 8, desc: '中、發、白三組皆為刻子。' },
    { id: 'xiaosixi', name: '小四喜', tai: 8, desc: '東、南、西、北其中三組為刻子，一組為將牌（眼睛）。' },
    { id: 'dasisixi', name: '大四喜', tai: 16, desc: '東、南、西、北四組皆為刻子。' },
  ],
  combinations: [
    { id: 'pinghu', name: '平和', tai: 2, desc: '全由順子與一對將牌組成，無刻子、無花牌，且為雙頭聽，非自摸。' },
    { id: 'pengpenghu', name: '碰碰胡', tai: 4, desc: '全由刻子（或槓子）與一對將牌組成。' },
    { id: 'quanqiuren', name: '全求人', tai: 2, desc: '手牌全部吃碰外露，只剩一張牌單吊胡牌（必須是別人放槍）。' },
    { id: 'banqiuren', name: '半求人', tai: 1, desc: '手牌全部吃碰外露，只剩一張牌單吊自摸胡牌。' },
    { id: 'sanamke', name: '三暗刻', tai: 2, desc: '手牌中有三組沒有碰牌外露的刻子（暗刻，含自摸及暗槓）。' },
    { id: 'sianmke', name: '四暗刻', tai: 5, desc: '手牌中有四組暗刻。' },
    { id: 'wuanmke', name: '五暗刻', tai: 8, desc: '手牌中有五組暗刻（即碰碰胡且門清自摸）。' },
  ],
  suits: [
    { id: 'hunyise', name: '混一色', tai: 4, desc: '整手牌由單一花色（萬/筒/條）與字牌（風牌/三元牌）組成。' },
    { id: 'qingyise', name: '清一色', tai: 8, desc: '整手牌全由同一種花色組成（萬、條、或筒子），無字牌。' },
    { id: 'liguligu', name: '嚦咕嚦咕 (八對子)', tai: 8, desc: '特殊牌型：由七個對子與一個刻子組成（共16張）。' },
    { id: 'tianhu', name: '天胡', tai: 16, desc: '莊家起手17張牌直接胡牌。' },
    { id: 'dihu', name: '地胡', tai: 16, desc: '閒家摸第一張牌即自摸胡牌，或莊家打出第一張牌即放槍給閒家胡牌（中間無吃碰槓）。' },
  ],
  flowers: [
    { id: 'zhenghua', name: '正花', tai: 1, desc: '拿到與自己風向相符的花牌（東1、南2、西3、北4，梅蘭竹菊同理）。', count: true, max: 2 },
    { id: 'yitaihua', name: '一台花', tai: 2, desc: '拿到「春夏秋冬」或「梅蘭竹菊」完整的一套（4張）。', count: true, max: 2 },
    { id: 'qiqiangyi', name: '七搶一', tai: 8, desc: '某玩家已拿到7張花牌，另一玩家摸到第8張花牌時，前者可搶牌胡牌。' },
    { id: 'baxianguohai', name: '八仙過海', tai: 8, desc: '某玩家拿到全部 8 張花牌，直接胡牌。' },
  ]
};

// Help map tile codes to readable names and display colors
const TILE_MAP = {
  // 萬 (w)
  '1w': { name: '一萬', color: 'mj-txt-dragon-red' }, '2w': { name: '二萬', color: 'mj-txt-dragon-red' }, '3w': { name: '三萬', color: 'mj-txt-dragon-red' },
  '4w': { name: '四萬', color: 'mj-txt-dragon-red' }, '5w': { name: '五萬', color: 'mj-txt-dragon-red' }, '6w': { name: '六萬', color: 'mj-txt-dragon-red' },
  '7w': { name: '七萬', color: 'mj-txt-dragon-red' }, '8w': { name: '八萬', color: 'mj-txt-dragon-red' }, '9w': { name: '九萬', color: 'mj-txt-dragon-red' },
  // 筒 (t)
  '1t': { name: '一筒', color: 'mj-txt-wind' }, '2t': { name: '二筒', color: 'mj-txt-wind' }, '3t': { name: '三筒', color: 'mj-txt-wind' },
  '4t': { name: '四筒', color: 'mj-txt-wind' }, '5t': { name: '五筒', color: 'mj-txt-wind' }, '6t': { name: '六筒', color: 'mj-txt-wind' },
  '7t': { name: '七筒', color: 'mj-txt-wind' }, '8t': { name: '八筒', color: 'mj-txt-wind' }, '9t': { name: '九筒', color: 'mj-txt-wind' },
  // 條 (s)
  '1s': { name: '一條', color: 'mj-txt-dragon-green' }, '2s': { name: '二條', color: 'mj-txt-dragon-green' }, '3s': { name: '三條', color: 'mj-txt-dragon-green' },
  '4s': { name: '四條', color: 'mj-txt-dragon-green' }, '5s': { name: '五條', color: 'mj-txt-dragon-green' }, '6s': { name: '六條', color: 'mj-txt-dragon-green' },
  '7s': { name: '七條', color: 'mj-txt-dragon-green' }, '8s': { name: '八條', color: 'mj-txt-dragon-green' }, '9s': { name: '九條', color: 'mj-txt-dragon-green' },
  // 字
  'E': { name: '東', color: 'mj-txt-wind' }, 'S': { name: '南', color: 'mj-txt-wind' }, 'W': { name: '西', color: 'mj-txt-wind' }, 'N': { name: '北', color: 'mj-txt-wind' },
  'Z': { name: '中', color: 'mj-txt-dragon-red' }, 'F': { name: '發', color: 'mj-txt-dragon-green' }, 'B': { name: '白', color: 'mj-txt-dragon-white' },
  // 花
  'H1': { name: '春', color: 'mj-txt-dragon-red' }, 'H2': { name: '夏', color: 'mj-txt-dragon-red' }, 'H3': { name: '秋', color: 'mj-txt-dragon-red' }, 'H4': { name: '冬', color: 'mj-txt-dragon-red' },
  'H5': { name: '梅', color: 'mj-txt-dragon-green' }, 'H6': { name: '蘭', color: 'mj-txt-dragon-green' }, 'H7': { name: '竹', color: 'mj-txt-dragon-green' }, 'H8': { name: '菊', color: 'mj-txt-dragon-green' }
};

const getTileOrder = (tile) => {
  if (tile.startsWith('H')) return 60 + parseInt(tile[1]);
  if (tile === 'E') return 41;
  if (tile === 'S') return 42;
  if (tile === 'W') return 43;
  if (tile === 'N') return 44;
  if (tile === 'B') return 51;
  if (tile === 'F') return 52;
  if (tile === 'Z') return 53;
  const val = parseInt(tile[0]);
  const type = tile[1];
  if (type === 'w') return 10 + val;
  if (type === 't') return 20 + val;
  if (type === 's') return 30 + val;
  return 99;
};

export default function TaiCalculator({ onConfirm, isTeachingMode, currentDealerStreak }) {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'auto'

  // --- TAB 1: Manual Checklist State ---
  const [selected, setSelected] = useState({});
  const [counts, setCounts] = useState({ sanyuan: 0, zhenghua: 0, yitaihua: 0 });
  const [dealerStreak, setDealerStreak] = useState(currentDealerStreak || 0);
  const [totalTai, setTotalTai] = useState(0);
  const [selectedDesc, setSelectedDesc] = useState(null);

  // --- TAB 2: Auto Hand Builder State ---
  const [concealedHand, setConcealedHand] = useState([]); // Array of tile strings
  const [exposedMelds, setExposedMelds] = useState([]);   // [{ type: 'chow'|'pung'|'kong', tiles: [] }]
  const [winningTile, setWinningTile] = useState('');      // Winning tile string
  const [flowersList, setFlowersList] = useState([]);      // List of flowers
  
  // Selection Pool
  const [pool, setPool] = useState([]);
  const [isZimoAuto, setIsZimoAuto] = useState(true);
  const [isDealerAuto, setIsDealerAuto] = useState(false);
  const [dealerStreakAuto, setDealerStreakAuto] = useState(currentDealerStreak || 0);
  
  // Solver results
  const [autoAnalysis, setAutoAnalysis] = useState(null); // { valid: bool, tai: int, details: string[] }

  // 1. Manual Checklist Calculation Effects
  useEffect(() => {
    let tai = 0;
    const hasZimo = selected['zimo'];
    const hasMenqing = selected['menqing'];
    const hasDasanyuan = selected['dasanyuan'];
    const hasXiaosanyuan = selected['xiaosanyuan'];
    const hasDasisixi = selected['dasisixi'];
    const hasXiaosixi = selected['xiaosixi'];
    const hasQingyise = selected['qingyise'];
    const hasHunyise = selected['hunyise'];
    const hasWuanmke = selected['wuanmke'];
    const hasSianmke = selected['sianmke'];
    const hasSanamke = selected['sanamke'];
    const hasBaxianguohai = selected['baxianguohai'];
    const hasQiqiangyi = selected['qiqiangyi'];

    TAI_ITEMS.basic.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'menqing' && hasZimo) {
          tai += 2; // Menqing Zimo Special Bonus
        } else {
          tai += item.tai;
        }
      }
    });

    if (selected['zhuangjia']) {
      tai += 1;
      if (dealerStreak > 0) tai += dealerStreak * 2;
    }

    TAI_ITEMS.winds.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'sanyuan' && !hasDasanyuan && !hasXiaosanyuan) {
          tai += counts.sanyuan * item.tai;
        } else if (item.id !== 'sanyuan' && item.id !== 'xiaosanyuan' && item.id !== 'xiaosixi') {
          tai += item.tai;
        }
      }
    });
    if (hasDasanyuan) tai += 8;
    else if (hasXiaosanyuan) tai += 4;
    if (hasDasisixi) tai += 16;
    else if (hasXiaosixi) tai += 8;

    TAI_ITEMS.combinations.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'sanamke' && (hasWuanmke || hasSianmke)) {}
        else if (item.id === 'sianmke' && hasWuanmke) {}
        else if (item.id !== 'sanamke' && item.id !== 'sianmke') {
          tai += item.tai;
        }
      }
    });
    if (hasWuanmke) tai += 8;
    else if (hasSianmke) tai += 5;
    else if (hasSanamke) tai += 2;

    TAI_ITEMS.suits.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'hunyise' && hasQingyise) {}
        else if (item.id !== 'hunyise') {
          tai += item.tai;
        }
      }
    });
    if (hasQingyise) tai += 8;
    else if (hasHunyise) tai += 4;

    TAI_ITEMS.flowers.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'zhenghua' && !hasBaxianguohai && !hasQiqiangyi) {
          tai += counts.zhenghua * item.tai;
        } else if (item.id === 'yitaihua' && !hasBaxianguohai && !hasQiqiangyi) {
          tai += counts.yitaihua * item.tai;
        } else if (item.id !== 'zhenghua' && item.id !== 'yitaihua') {
          tai += item.tai;
        }
      }
    });

    setTotalTai(tai);
  }, [selected, counts, dealerStreak]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === 'dasanyuan' && next[id]) { next['xiaosanyuan'] = false; next['sanyuan'] = false; }
      if (id === 'xiaosanyuan' && next[id]) { next['dasanyuan'] = false; next['sanyuan'] = false; }
      if (id === 'dasisixi' && next[id]) next['xiaosixi'] = false;
      if (id === 'xiaosixi' && next[id]) next['dasisixi'] = false;
      if (id === 'qingyise' && next[id]) next['hunyise'] = false;
      if (id === 'hunyise' && next[id]) next['qingyise'] = false;
      if (id === 'wuanmke' && next[id]) { next['sianmke'] = false; next['sanamke'] = false; }
      if (id === 'sianmke' && next[id]) { next['wuanmke'] = false; next['sanamke'] = false; }
      if (id === 'sanamke' && next[id]) { next['wuanmke'] = false; next['sianmke'] = false; }
      if (id === 'baxianguohai' && next[id]) { next['qiqiangyi'] = false; next['zhenghua'] = false; next['yitaihua'] = false; }
      if (id === 'qiqiangyi' && next[id]) { next['baxianguohai'] = false; next['zhenghua'] = false; next['yitaihua'] = false; }
      return next;
    });
  };

  const handleCountChange = (key, val) => {
    setCounts(prev => {
      const next = { ...prev, [key]: val };
      setSelected(prevSel => ({ ...prevSel, [key]: val > 0 }));
      return next;
    });
  };

  const handleShowDesc = (item) => {
    setSelectedDesc({
      title: `🀄 ${item.name} (${item.tai}台)`,
      desc: item.desc
    });
  };

  // --- TAB 2: Hand Builder Actions ---
  const handleAddToPool = (tileCode) => {
    if (tileCode.startsWith('H')) {
      // Flowers bypass pool, add straight to flower list
      if (flowersList.length < 8 && !flowersList.includes(tileCode)) {
        setFlowersList([...flowersList, tileCode]);
      }
      return;
    }
    if (pool.length < 4) {
      setPool([...pool, tileCode]);
    }
  };

  const clearPool = () => setPool([]);

  const addPoolToHand = () => {
    if (pool.length === 0) return;
    
    // Check limit (Total tiles in hand + melds*3 + winningTile must not exceed 17)
    const currentTotal = concealedHand.length + (exposedMelds.length * 3) + (winningTile ? 1 : 0);
    if (currentTotal + pool.length > 17) {
      alert('手牌總數不能超過 17 張！');
      return;
    }
    
    setConcealedHand([...concealedHand, ...pool].sort((a,b) => getTileOrder(a) - getTileOrder(b)));
    setPool([]);
  };

  const formChowFromPool = () => {
    if (pool.length !== 3) {
      alert('吃牌/順子必須正好選取 3 張牌！');
      return;
    }
    const sorted = [...pool].sort((a,b) => getTileOrder(a) - getTileOrder(b));
    const suit = sorted[0][1];
    const val1 = parseInt(sorted[0][0]);
    const val2 = parseInt(sorted[1][0]);
    const val3 = parseInt(sorted[2][0]);

    if (!['w','t','s'].includes(suit) || sorted[1][1] !== suit || sorted[2][1] !== suit || val2 !== val1 + 1 || val3 !== val1 + 2) {
      alert('非法的順子！必須是同花色且連續的 3 張牌（例如：1萬、2萬、3萬）。');
      return;
    }

    const currentTotal = concealedHand.length + (exposedMelds.length * 3) + (winningTile ? 1 : 0);
    if (currentTotal + 3 > 17) {
      alert('手牌總數不能超過 17 張！');
      return;
    }

    setExposedMelds([...exposedMelds, { type: 'chow', tiles: sorted }]);
    setPool([]);
  };

  const formPungFromPool = () => {
    if (pool.length !== 3) {
      alert('碰牌/刻子必須正好選取 3 張相同的牌！');
      return;
    }
    if (pool[0] !== pool[1] || pool[1] !== pool[2]) {
      alert('必須選取 3 張完全相同的牌！');
      return;
    }

    const currentTotal = concealedHand.length + (exposedMelds.length * 3) + (winningTile ? 1 : 0);
    if (currentTotal + 3 > 17) {
      alert('手牌總數不能超過 17 張！');
      return;
    }

    setExposedMelds([...exposedMelds, { type: 'pung', tiles: [...pool] }]);
    setPool([]);
  };

  const formKongFromPool = () => {
    if (pool.length !== 4) {
      alert('槓牌必須正好選取 4 張相同的牌！');
      return;
    }
    if (pool[0] !== pool[1] || pool[1] !== pool[2] || pool[2] !== pool[3]) {
      alert('必須選取 4 張完全相同的牌！');
      return;
    }

    const currentTotal = concealedHand.length + (exposedMelds.length * 3) + (winningTile ? 1 : 0);
    if (currentTotal + 3 > 17) { // Kong counts as 3 tiles for partition logic
      alert('手牌總數不能超過 17 張！');
      return;
    }

    setExposedMelds([...exposedMelds, { type: 'kong', tiles: [...pool] }]);
    setPool([]);
  };

  const setPoolAsWinning = () => {
    if (pool.length !== 1) {
      alert('請先在選取池中選擇「單獨 1 張牌」再設為胡牌！');
      return;
    }
    setWinningTile(pool[0]);
    setPool([]);
  };

  const handleRemoveConcealed = (idx) => {
    setConcealedHand(concealedHand.filter((_, i) => i !== idx));
  };

  const handleRemoveMeld = (idx) => {
    setExposedMelds(exposedMelds.filter((_, i) => i !== idx));
  };

  const handleRemoveFlower = (idx) => {
    setFlowersList(flowersList.filter((_, i) => i !== idx));
  };

  // --- AUTOMATIC MAHJONG SOLVER ALGORITHM ---
  const runAutoAnalysis = () => {
    // 1. Total Tile Check
    // Total virtual tiles for check = concealedHand.length + exposedMelds.length * 3 + (winningTile ? 1 : 0)
    // Needs to be exactly 17 tiles.
    const activeConcealed = [...concealedHand];
    if (winningTile && !activeConcealed.includes(winningTile)) {
      // If winning tile isn't explicitly in concealed hand, add it.
      // But typically, the user selects their 16 concealed tiles, then adds 1 winning tile to make 17.
    }
    
    const tileSum = concealedHand.length + (exposedMelds.length * 3) + (winningTile ? 1 : 0);
    if (tileSum !== 17) {
      setAutoAnalysis({
        valid: false,
        tai: 0,
        details: [],
        message: `手牌數量錯誤。目前共有 ${tileSum} 張牌。台灣麻將胡牌時手牌（含吃碰槓與胡牌）必須剛好為 17 張！`
      });
      return;
    }

    // Prepare full list of concealed tiles for validation (including winning tile)
    let fullConcealed = [...concealedHand];
    if (winningTile) {
      fullConcealed.push(winningTile);
    }
    fullConcealed.sort((a,b) => getTileOrder(a) - getTileOrder(b));

    // Solver Decomposer
    const canDecompose = (tiles) => {
      if (tiles.length === 0) return { ok: true, groups: [] };
      const sorted = [...tiles].sort((a, b) => getTileOrder(a) - getTileOrder(b));
      const first = sorted[0];

      // Try Pung
      const pungCount = sorted.filter(t => t === first).length;
      if (pungCount >= 3) {
        const remaining = [...sorted];
        remaining.splice(remaining.indexOf(first), 1);
        remaining.splice(remaining.indexOf(first), 1);
        remaining.splice(remaining.indexOf(first), 1);
        const res = canDecompose(remaining);
        if (res.ok) {
          return {
            ok: true,
            groups: [{ type: 'pung', tiles: [first, first, first] }, ...res.groups]
          };
        }
      }

      // Try Chow
      const firstType = first.substring(1);
      const firstVal = parseInt(first[0]);
      if (['w','t','s'].includes(firstType)) {
        const second = `${firstVal + 1}${firstType}`;
        const third = `${firstVal + 2}${firstType}`;
        if (sorted.includes(second) && sorted.includes(third)) {
          const remaining = [...sorted];
          remaining.splice(remaining.indexOf(first), 1);
          remaining.splice(remaining.indexOf(second), 1);
          remaining.splice(remaining.indexOf(third), 1);
          const res = canDecompose(remaining);
          if (res.ok) {
            return {
              ok: true,
              groups: [{ type: 'chow', tiles: [first, second, third] }, ...res.groups]
            };
          }
        }
      }

      return { ok: false, groups: [] };
    };

    // Find all valid decompositions (choose one with pair)
    let validDecomps = [];
    const uniqueTiles = [...new Set(fullConcealed)];
    
    uniqueTiles.forEach(eyeCandidate => {
      const eyeCount = fullConcealed.filter(t => t === eyeCandidate).length;
      if (eyeCount >= 2) {
        const remaining = [...fullConcealed];
        remaining.splice(remaining.indexOf(eyeCandidate), 1);
        remaining.splice(remaining.indexOf(eyeCandidate), 1);
        
        const decom = canDecompose(remaining);
        if (decom.ok) {
          validDecomps.push({
            pair: eyeCandidate,
            groups: decom.groups
          });
        }
      }
    });

    if (validDecomps.length === 0) {
      setAutoAnalysis({
        valid: false,
        tai: 0,
        details: [],
        message: '手牌結構無法胡牌！手牌必須由 5 組順子/刻子與 1 對將眼組成。請檢查花色或漏牌。'
      });
      return;
    }

    // Analyze Tai for each valid decomposition, and select the highest scoring one
    let bestTai = 0;
    let bestDetails = [];

    validDecomps.forEach(decomp => {
      let tai = 0;
      let details = [];

      // Combine exposed melds and concealed groups for rules
      const allGroups = [
        ...exposedMelds.map(m => ({ type: m.type, tiles: m.tiles, exposed: true })),
        ...decomp.groups.map(g => ({ type: g.type, tiles: g.tiles, exposed: false }))
      ];
      
      const allTiles = [
        ...fullConcealed,
        ...exposedMelds.flatMap(m => m.tiles)
      ];

      // --- 1. Basic win styles ---
      if (isZimoAuto) {
        tai += 1;
        details.push('自摸 (1台)');
      }

      // Check Menqing
      const hasExposed = exposedMelds.some(m => m.type !== 'kong' || m.tiles.length === 4); // Bright meld or exposed kong
      // In Taiwan rules, exposed eating/panging makes it not menqing.
      const isMenqing = exposedMelds.filter(m => m.type === 'chow' || m.type === 'pung').length === 0;
      if (isMenqing) {
        if (isZimoAuto) {
          tai += 2; // Menqing + Zimo = Menqing Zimo (3台)
          details.push('門清自摸 (3台)');
        } else {
          tai += 1;
          details.push('門清 (1台)');
        }
      }

      // Check Zhuangjia (Dealer)
      if (isDealerAuto) {
        tai += 1;
        details.push('莊家 (1台)');
        if (dealerStreakAuto > 0) {
          tai += dealerStreakAuto * 2;
          details.push(`連 ${dealerStreakAuto} 拉 ${dealerStreakAuto} (+${dealerStreakAuto * 2}台)`);
        }
      }

      // --- 2. Hand Combination structure ---
      // Check All Pungs (碰碰胡)
      const allPungs = allGroups.every(g => g.type === 'pung' || g.type === 'kong');
      if (allPungs) {
        tai += 4;
        details.push('碰碰胡 (4台)');
      }

      // Check Pinghu (平和)
      // All Chows (5 chows), no flowers, pair not wind/dragon, waiting on a two-way wait.
      const allChows = allGroups.every(g => g.type === 'chow');
      const noFlowers = flowersList.length === 0;
      const eyeSuit = decomp.pair.substring(1);
      const isEyeSuit = ['w','t','s'].includes(eyeSuit);
      if (allChows && noFlowers && isEyeSuit && !isZimoAuto) {
        tai += 2;
        details.push('平和 (2台)');
      }

      // Check Dark Pungs (暗刻 counts)
      // Concealed pungs in hand. Kongs count if concealed.
      const darkPungCount = decomp.groups.filter(g => g.type === 'pung').length + exposedMelds.filter(m => m.type === 'kong' && m.tiles.length === 4).length; // Concealed Kongs
      if (darkPungCount === 3) {
        tai += 2;
        details.push('三暗刻 (2台)');
      } else if (darkPungCount === 4) {
        tai += 5;
        details.push('四暗刻 (5台)');
      } else if (darkPungCount === 5) {
        tai += 8;
        details.push('五暗刻 (8台)');
      }

      // --- 3. Suits ---
      const suits = allTiles.map(t => {
        if (['E','S','W','N','Z','F','B'].includes(t)) return 'z';
        return t[1];
      });
      const uniqueSuits = [...new Set(suits)];
      const hasWord = uniqueSuits.includes('z');
      const colorSuits = uniqueSuits.filter(s => s !== 'z');

      if (colorSuits.length === 1) {
        if (hasWord) {
          tai += 4;
          details.push('混一色 (4台)');
        } else {
          tai += 8;
          details.push('清一色 (8台)');
        }
      }

      // --- 4. Winds & Dragons ---
      // Check Dragons (中發白)
      const countPungsOfDragon = (code) => allGroups.some(g => (g.type === 'pung' || g.type === 'kong') && g.tiles[0] === code);
      const hasZpung = countPungsOfDragon('Z'); // 中
      const hasFpung = countPungsOfDragon('F'); // 發
      const hasBpung = countPungsOfDragon('B'); // 白
      const countDragonPungs = (hasZpung ? 1 : 0) + (hasFpung ? 1 : 0) + (hasBpung ? 1 : 0);

      if (countDragonPungs === 3) {
        tai += 8;
        details.push('大三元 (8台)');
      } else if (countDragonPungs === 2 && ['Z','F','B'].includes(decomp.pair)) {
        tai += 4;
        details.push('小三元 (4台)');
      } else {
        if (hasZpung) { tai += 1; details.push('紅中刻 (1台)'); }
        if (hasFpung) { tai += 1; details.push('青發刻 (1台)'); }
        if (hasBpung) { tai += 1; details.push('白板刻 (1台)'); }
      }

      // Check Winds (東南北西)
      const countPungsOfWind = (code) => allGroups.some(g => (g.type === 'pung' || g.type === 'kong') && g.tiles[0] === code);
      const hasEpung = countPungsOfWind('E');
      const hasSpung = countPungsOfWind('S');
      const hasWpung = countPungsOfWind('W');
      const hasNpung = countPungsOfWind('N');
      const countWindPungs = (hasEpung ? 1 : 0) + (hasSpung ? 1 : 0) + (hasWpung ? 1 : 0) + (hasNpung ? 1 : 0);

      if (countWindPungs === 4) {
        tai += 16;
        details.push('大四喜 (16台)');
      } else if (countWindPungs === 3 && ['E','S','W','N'].includes(decomp.pair)) {
        tai += 8;
        details.push('小四喜 (8台)');
      } else {
        // Individual wind points
        if (hasEpung) { tai += 1; details.push('東風刻 (1台)'); }
        if (hasSpung) { tai += 1; details.push('南風刻 (1台)'); }
        if (hasWpung) { tai += 1; details.push('西風刻 (1台)'); }
        if (hasNpung) { tai += 1; details.push('北風刻 (1台)'); }
      }

      // --- 5. Flowers ---
      if (flowersList.length > 0) {
        tai += flowersList.length;
        details.push(`花牌 (+${flowersList.length}台)`);
        
        if (flowersList.length === 8) {
          tai += 8; // Baxianguohai
          details.push('八仙過海 (8台)');
        } else if (flowersList.length === 7) {
          tai += 8; // Qiqiangyi
          details.push('七搶一 (8台)');
        }
      }

      // --- 6. Special Waits (獨聽/單吊) ---
      // Single Wait (單吊): winning tile is the pair
      const isSingleWait = decomp.pair === winningTile;
      if (isSingleWait) {
        tai += 1;
        details.push('單吊 (1台)');
      } else {
        // Middle wait or edge wait
        // Check if winningTile is in one of the concealed chows
        decomp.groups.forEach(g => {
          if (g.type === 'chow' && g.tiles.includes(winningTile)) {
            const idx = g.tiles.indexOf(winningTile);
            const vals = g.tiles.map(t => parseInt(t[0]));
            if (idx === 1) {
              tai += 1;
              details.push(`卡窿/中洞 (1台) [胡 ${TILE_MAP[winningTile].name}]`);
            } else if (idx === 0 && vals[0] === 3) {
              tai += 1;
              details.push(`邊張 (1台) [胡 ${TILE_MAP[winningTile].name}]`);
            } else if (idx === 2 && vals[2] === 7) {
              tai += 1;
              details.push(`邊張 (1台) [胡 ${TILE_MAP[winningTile].name}]`);
            }
          }
        });
      }

      if (tai > bestTai) {
        bestTai = tai;
        bestDetails = details;
      }
    });

    setAutoAnalysis({
      valid: true,
      tai: bestTai,
      details: bestDetails
    });
  };

  // Run analysis when hand changes
  useEffect(() => {
    if (activeTab === 'auto' && (concealedHand.length > 0 || winningTile)) {
      runAutoAnalysis();
    }
  }, [concealedHand, exposedMelds, winningTile, flowersList, isZimoAuto, isDealerAuto, dealerStreakAuto, activeTab]);

  return (
    <div className="glass-panel p-5 w-full">
      {/* Tabs Header */}
      <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800 text-xs mb-4">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${
            activeTab === 'manual' 
              ? 'bg-[#D4AF37] text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📝 手動勾選牌型
        </button>
        <button
          onClick={() => setActiveTab('auto')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${
            activeTab === 'auto' 
              ? 'bg-[#10B981] text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🀄 自動輸入牌組算台
        </button>
      </div>

      {/* --- TAB 1: MANUAL CHECKLIST --- */}
      {activeTab === 'manual' && (
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <h3 className="text-md font-bold text-gray-300">勾選台數計算</h3>
            <div className="text-right">
              <span className="text-xl font-black text-[#D4AF37]">{totalTai} 台</span>
            </div>
          </div>

          {isTeachingMode && (
            <div className="bg-emerald-950/40 border-l-4 border-emerald-500 p-2.5 rounded text-xs mb-4 text-gray-300">
              💡 點選任何台數牌型可以查看其規則說明。
            </div>
          )}

          {/* Description moved to overlay popup */}

          <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
            {Object.entries(TAI_ITEMS).map(([category, items]) => {
              let catName = '其他';
              if (category === 'basic') catName = '基本與胡法';
              if (category === 'winds') catName = '莊家與字牌';
              if (category === 'combinations') catName = '牌面結構';
              if (category === 'suits') catName = '花色與特殊牌型';
              if (category === 'flowers') catName = '花牌系列';

              return (
                <div key={category} className="border-b border-gray-800 pb-3 last:border-0">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">{catName}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => {
                      const isChecked = selected[item.id];
                      
                      if (item.id === 'zhuangjia' && isChecked) {
                        return (
                          <div key={item.id} className="col-span-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-2 rounded flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-[#D4AF37] flex items-center gap-1">
                                <input 
                                  type="checkbox" 
                                  checked={true}
                                  onChange={() => toggleSelect(item.id)}
                                  className="w-4 h-4 accent-[#D4AF37]" 
                                />
                                莊家 (+1台)
                              </label>
                              <button 
                                type="button"
                                onClick={() => handleShowDesc(item)} 
                                className="text-xs text-gray-500 underline"
                              >
                                說明
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-xs bg-black/40 p-1.5 rounded">
                              <span>連莊數 (+2N台):</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setDealerStreak(Math.max(0, dealerStreak - 1))}
                                  className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold text-[#D4AF37]">{dealerStreak === 0 ? '無 (底)' : `連 ${dealerStreak} 拉 ${dealerStreak} (+${dealerStreak * 2}台)`}</span>
                                <button 
                                  type="button"
                                  onClick={() => setDealerStreak(dealerStreak + 1)}
                                  className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-2.5 rounded border text-left cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-white' 
                              : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-black/35'
                          }`}
                          onClick={() => handleShowDesc(item)}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {!item.count ? (
                              <input 
                                type="checkbox"
                                checked={isChecked || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(item.id);
                                }}
                                className="w-4 h-4 accent-[#10B981] cursor-pointer shrink-0"
                              />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            )}
                            
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{item.name}</p>
                              <span className="text-[10px] text-gray-500">+{item.tai}台</span>
                            </div>
                          </div>
                          
                          {item.count ? (
                            <div 
                              className="flex items-center gap-1.5 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleCountChange(item.id, Math.max(0, (counts[item.id] || 0) - 1))}
                                className="w-4 h-4 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-xs text-white"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-[#10B981] min-w-4 text-center">{counts[item.id] || 0}</span>
                              <button
                                type="button"
                                onClick={() => handleCountChange(item.id, Math.min(item.max, (counts[item.id] || 0) + 1))}
                                className="w-4 h-4 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-xs text-white"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="text-[10px] text-gray-500 hover:text-white shrink-0 underline bg-transparent border-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowDesc(item);
                              }}
                            >
                              查看
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSelected({});
                setCounts({ sanyuan: 0, zhenghua: 0, yitaihua: 0 });
                setDealerStreak(0);
                setTotalTai(0);
                setSelectedDesc(null);
              }}
              className="btn btn-secondary flex-1 py-2 text-xs"
            >
              🧹 重設
            </button>
            <button
              type="button"
              onClick={() => onConfirm(totalTai, Object.keys(selected).filter(k => selected[k]))}
              className="btn btn-primary flex-1 py-2 text-xs"
            >
              💾 套用手動台數
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: AUTOMATIC HAND BUILDER --- */}
      {activeTab === 'auto' && (
        <div className="space-y-4">
          {/* Status info bar */}
          <div className="flex justify-between items-center bg-black/35 p-3 rounded border border-gray-800">
            <div>
              <span className="text-xs text-gray-400">當前手牌張數: </span>
              <span className={`text-md font-bold ${
                (concealedHand.length + exposedMelds.length * 3 + (winningTile ? 1 : 0)) === 17 
                  ? 'text-[#10B981]' 
                  : 'text-[#E11D48]'
              }`}>
                {concealedHand.length + (exposedMelds.length * 3) + (winningTile ? 1 : 0)} / 17張
              </span>
            </div>
            <div className="text-right">
              {autoAnalysis && autoAnalysis.valid ? (
                <span className="text-lg font-black text-[#10B981]">{autoAnalysis.tai} 台</span>
              ) : (
                <span className="text-xs text-gray-500 italic">牌組未聽牌/未滿</span>
              )}
            </div>
          </div>

          {/* Quick config checkboxes */}
          <div className="grid grid-cols-2 gap-2 bg-black/10 p-2.5 rounded text-xs border border-gray-900">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isZimoAuto} 
                onChange={(e) => setIsZimoAuto(e.target.checked)}
                className="w-4 h-4 accent-[#10B981]" 
              />
              贏家是「自摸」
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isDealerAuto} 
                onChange={(e) => setIsDealerAuto(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]" 
              />
              贏家是「莊家」
            </label>
            {isDealerAuto && (
              <div className="col-span-2 flex items-center justify-between mt-1 pt-1.5 border-t border-gray-800">
                <span>連莊加台 (+2N):</span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setDealerStreakAuto(Math.max(0, dealerStreakAuto - 1))}
                    className="px-1.5 py-0.5 bg-gray-800 rounded"
                  >
                    -
                  </button>
                  <span className="text-[#D4AF37] font-bold">連 {dealerStreakAuto} 拉 {dealerStreakAuto}</span>
                  <button 
                    type="button" 
                    onClick={() => setDealerStreakAuto(dealerStreakAuto + 1)}
                    className="px-1.5 py-0.5 bg-gray-800 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selection Pool Panel */}
          <div className="bg-[#12261C]/50 p-3 rounded-lg border border-[#D4AF37]/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400 font-bold">選取緩衝池 (最多 4 張牌):</span>
              {pool.length > 0 && (
                <button onClick={clearPool} className="text-[10px] text-red-400 underline">
                  清空緩衝池
                </button>
              )}
            </div>
            
            {pool.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2 text-center">請點選下方牌圖選擇加入</p>
            ) : (
              <div className="flex gap-2 justify-center py-2">
                {pool.map((t, idx) => (
                  <div key={idx} className="mj-tile mj-tile-sm scale-95">
                    <span className={TILE_MAP[t]?.color}>{TILE_MAP[t]?.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5 mt-2">
              <button 
                onClick={addPoolToHand} 
                disabled={pool.length === 0}
                className="btn btn-secondary text-[11px] py-1 px-1 flex-1 font-bold"
              >
                📥 入暗牌
              </button>
              <button 
                onClick={formChowFromPool} 
                disabled={pool.length !== 3}
                className="btn btn-secondary text-[11px] py-1 px-1 flex-1 font-bold"
              >
                🍲 組吃牌
              </button>
              <button 
                onClick={formPungFromPool} 
                disabled={pool.length !== 3}
                className="btn btn-secondary text-[11px] py-1 px-1 flex-1 font-bold"
              >
                ⚡ 組碰牌
              </button>
              <button 
                onClick={setPoolAsWinning} 
                disabled={pool.length !== 1}
                className="btn btn-accent text-[11px] py-1 px-1 flex-1 font-bold"
              >
                🀄 設胡牌
              </button>
            </div>
          </div>

          {/* Active Hand Display Layout */}
          <div className="hand-builder-container">
            <span className="text-[10px] text-gray-500 font-bold block mb-1">您的手牌配置:</span>
            
            <div className="flex flex-wrap gap-2 items-center">
              {/* Exposed Melds */}
              {exposedMelds.map((meld, idx) => (
                <div key={`meld-${idx}`} className="meld-box">
                  <span className="meld-label">{meld.type === 'chow' ? '吃' : meld.type === 'pung' ? '碰' : '槓'}</span>
                  {meld.type === 'kong' ? (
                    <div className="flex -space-x-1.5">
                      <div className="mj-tile mj-tile-sm scale-90 border-r border-[#15803d]"><span className={TILE_MAP[meld.tiles[0]]?.color}>{TILE_MAP[meld.tiles[0]]?.name}</span></div>
                      <div className="mj-tile mj-tile-sm scale-90 border-r border-[#15803d]"><span className={TILE_MAP[meld.tiles[0]]?.color}>{TILE_MAP[meld.tiles[0]]?.name}</span></div>
                      <div className="mj-tile mj-tile-sm scale-90 border-r border-[#15803d]"><span className={TILE_MAP[meld.tiles[0]]?.color}>{TILE_MAP[meld.tiles[0]]?.name}</span></div>
                      <div className="mj-tile mj-tile-sm scale-90 bg-emerald-100"><span className={TILE_MAP[meld.tiles[0]]?.color}>{TILE_MAP[meld.tiles[0]]?.name}</span></div>
                    </div>
                  ) : (
                    meld.tiles.map((t, tIdx) => (
                      <div key={tIdx} className="mj-tile mj-tile-sm scale-90">
                        <span className={TILE_MAP[t]?.color}>{TILE_MAP[t]?.name}</span>
                      </div>
                    ))
                  )}
                  <button 
                    onClick={() => handleRemoveMeld(idx)} 
                    className="text-[10px] text-red-500 ml-1 hover:text-red-400 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Concealed Hand */}
              {concealedHand.map((t, idx) => (
                <div 
                  key={`concealed-${idx}`} 
                  onClick={() => handleRemoveConcealed(idx)}
                  className="mj-tile mj-tile-hand hover:bg-red-950/20"
                >
                  <span className={TILE_MAP[t]?.color}>{TILE_MAP[t]?.name}</span>
                </div>
              ))}

              {/* Winning Tile Highlight */}
              {winningTile && (
                <div 
                  onClick={() => setWinningTile('')}
                  className="mj-tile mj-tile-hand mj-tile-winning relative"
                >
                  <span className="absolute -top-2 -right-2 badge badge-red text-[8px] px-1 py-0.5 font-bold z-10">胡</span>
                  <span className={TILE_MAP[winningTile]?.color}>{TILE_MAP[winningTile]?.name}</span>
                </div>
              )}
            </div>

            {/* Flowers row */}
            {flowersList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-gray-800">
                <span className="text-[10px] text-gray-500 font-bold mr-1">花牌:</span>
                {flowersList.map((f, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleRemoveFlower(idx)}
                    className="mj-tile mj-tile-sm bg-rose-950/20 hover:bg-red-950/40"
                    style={{width: '28px', height: '38px', fontSize: '0.9rem'}}
                  >
                    <span className={TILE_MAP[f]?.color}>{TILE_MAP[f]?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tile Selector Board */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 font-bold block">點選牌加入緩衝池 (花牌直接加入花牌列):</span>
            
            <div className="space-y-2 max-h-[30vh] overflow-y-auto bg-black/20 p-2.5 rounded border border-gray-800">
              {/* Suits */}
              {['w', 't', 's'].map(suit => {
                const suitName = suit === 'w' ? '萬子' : suit === 't' ? '筒子' : '條子';
                return (
                  <div key={suit} className="flex gap-2 items-center">
                    <span className="text-[10px] text-gray-500 w-8 font-bold shrink-0">{suitName}</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Array.from({length: 9}).map((_, i) => {
                        const code = `${i+1}${suit}`;
                        return (
                          <div 
                            key={code} 
                            onClick={() => handleAddToPool(code)}
                            className="mj-tile mj-tile-sm shrink-0"
                          >
                            <span className={TILE_MAP[code]?.color}>{TILE_MAP[code]?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {/* Winds & Dragons */}
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-gray-500 w-8 font-bold shrink-0">字牌</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {['E', 'S', 'W', 'N', 'Z', 'F', 'B'].map(code => (
                    <div 
                      key={code} 
                      onClick={() => handleAddToPool(code)}
                      className="mj-tile mj-tile-sm shrink-0"
                    >
                      <span className={TILE_MAP[code]?.color}>{TILE_MAP[code]?.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flowers */}
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-gray-500 w-8 font-bold shrink-0">花牌</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'].map(code => (
                    <div 
                      key={code} 
                      onClick={() => handleAddToPool(code)}
                      className="mj-tile mj-tile-sm shrink-0"
                    >
                      <span className={TILE_MAP[code]?.color}>{TILE_MAP[code]?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Solver Feedback Details */}
          {autoAnalysis && (
            <div className={`p-3 rounded text-xs border ${
              autoAnalysis.valid 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {autoAnalysis.valid ? (
                <div>
                  <p className="font-bold mb-1.5 text-sm">🎉 自動分析成功！符合胡牌牌型：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {autoAnalysis.details.length === 0 ? (
                      <span className="text-gray-400">底牌/無特別台數</span>
                    ) : (
                      autoAnalysis.details.map(d => (
                        <span key={d} className="bg-emerald-900/50 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                          {d}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <p>⚠️ {autoAnalysis.message}</p>
              )}
            </div>
          )}

          {/* Tab Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setConcealedHand([]);
                setExposedMelds([]);
                setWinningTile('');
                setFlowersList([]);
                setPool([]);
                setAutoAnalysis(null);
              }}
              className="btn btn-secondary flex-1 py-2 text-xs"
            >
              🧹 重設手牌
            </button>
            <button
              type="button"
              disabled={!autoAnalysis || !autoAnalysis.valid}
              onClick={() => onConfirm(autoAnalysis.tai, autoAnalysis.details)}
              className={`btn flex-1 py-2 text-xs ${
                autoAnalysis && autoAnalysis.valid ? 'btn-primary' : 'btn-disabled'
              }`}
            >
              💾 套用自動台數
            </button>
          </div>
        </div>
      )}

      {/* Floating Explanation Modal Popup */}
      {selectedDesc && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-content glass-panel p-6 border-[#D4AF37]/50 bg-[#071810]/95 text-center max-w-sm">
            <span className="text-4xl block mb-2">🀄</span>
            <h3 className="text-lg font-black text-[#D4AF37] mb-3">
              {selectedDesc.title}
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-6 text-left bg-black/40 p-4 rounded-lg border border-gray-800">
              {selectedDesc.desc}
            </p>
            <button
              onClick={() => setSelectedDesc(null)}
              className="btn btn-primary w-full py-2.5 text-xs font-bold"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// handleShowDesc moved inside the component
