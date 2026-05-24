import React, { useState, useEffect } from 'react';

// List of Taiwanese Mahjong Tai items with metadata and description
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

export default function TaiCalculator({ onConfirm, isTeachingMode, currentDealerStreak }) {
  const [selected, setSelected] = useState({});
  const [counts, setCounts] = useState({ sanyuan: 0, zhenghua: 0, yitaihua: 0 });
  const [dealerStreak, setDealerStreak] = useState(currentDealerStreak || 0);
  const [totalTai, setTotalTai] = useState(0);
  const [selectedDesc, setSelectedDesc] = useState('');

  // Auto-manage exclusions and calculate total Tai
  useEffect(() => {
    let tai = 0;

    // Mutually exclusive flags
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

    // 1. Calculate basics
    TAI_ITEMS.basic.forEach(item => {
      if (selected[item.id]) {
        // Special interaction: 門清 + 自摸 = 3台 (門清1+自摸1+門清自摸加1)
        if (item.id === 'menqing' && hasZimo) {
          tai += 2; // 1 (menqing) + 1 (special bonus for menqing zimo)
        } else {
          tai += item.tai;
        }
      }
    });

    // 2. Winds & Dragons
    if (selected['zhuangjia']) {
      tai += 1; // Dealer base
      if (dealerStreak > 0) {
        tai += dealerStreak * 2; // 連N拉N = 2N 台 (台灣常規：連1拉1=2台，連2拉2=4台)
      }
    }

    TAI_ITEMS.winds.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'sanyuan') {
          // If big/small three dragons are selected, don't add individual sanyuan points
          if (!hasDasanyuan && !hasXiaosanyuan) {
            tai += counts.sanyuan * item.tai;
          }
        } else if (item.id === 'xiaosanyuan' && hasDasanyuan) {
          // Exclude xiaosanyuan if dasanyuan
        } else if (item.id === 'xiaosixi' && hasDasisixi) {
          // Exclude xiaosixi if dasisixi
        } else if (item.id !== 'sanyuan' && item.id !== 'xiaosanyuan' && item.id !== 'xiaosixi') {
          tai += item.tai;
        }
      }
    });
    // Add specific items if not double counted
    if (hasDasanyuan) tai += 8;
    else if (hasXiaosanyuan) tai += 4;
    
    if (hasDasisixi) tai += 16;
    else if (hasXiaosixi) tai += 8;

    // 3. Combinations
    TAI_ITEMS.combinations.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'sanamke' && (hasWuanmke || hasSianmke)) {
          // Skip sanamke if higher ones
        } else if (item.id === 'sianmke' && hasWuanmke) {
          // Skip sianmke if wuanmke
        } else if (item.id !== 'sanamke' && item.id !== 'sianmke') {
          tai += item.tai;
        }
      }
    });
    if (hasWuanmke) tai += 8;
    else if (hasSianmke) tai += 5;
    else if (hasSanamke) tai += 2;

    // 4. Suits
    TAI_ITEMS.suits.forEach(item => {
      if (selected[item.id]) {
        if (item.id === 'hunyise' && hasQingyise) {
          // Skip hunyise if qingyise
        } else if (item.id !== 'hunyise') {
          tai += item.tai;
        }
      }
    });
    if (hasQingyise) tai += 8;
    else if (hasHunyise) tai += 4;

    // 5. Flowers
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
      
      // Auto logic for mutually exclusive items
      if (id === 'dasanyuan' && next[id]) {
        next['xiaosanyuan'] = false;
        next['sanyuan'] = false;
      }
      if (id === 'xiaosanyuan' && next[id]) {
        next['dasanyuan'] = false;
        next['sanyuan'] = false;
      }
      if (id === 'dasisixi' && next[id]) {
        next['xiaosixi'] = false;
      }
      if (id === 'xiaosixi' && next[id]) {
        next['dasisixi'] = false;
      }
      if (id === 'qingyise' && next[id]) {
        next['hunyise'] = false;
      }
      if (id === 'hunyise' && next[id]) {
        next['qingyise'] = false;
      }
      if (id === 'wuanmke' && next[id]) {
        next['sianmke'] = false;
        next['sanamke'] = false;
      }
      if (id === 'sianmke' && next[id]) {
        next['wuanmke'] = false;
        next['sanamke'] = false;
      }
      if (id === 'sanamke' && next[id]) {
        next['wuanmke'] = false;
        next['sianmke'] = false;
      }
      if (id === 'baxianguohai' && next[id]) {
        next['qiqiangyi'] = false;
        next['zhenghua'] = false;
        next['yitaihua'] = false;
      }
      if (id === 'qiqiangyi' && next[id]) {
        next['baxianguohai'] = false;
        next['zhenghua'] = false;
        next['yitaihua'] = false;
      }
      return next;
    });
  };

  const handleCountChange = (key, val) => {
    setCounts(prev => {
      const next = { ...prev, [key]: val };
      setSelected(prevSel => ({
        ...prevSel,
        [key]: val > 0
      }));
      return next;
    });
  };

  const handleShowDesc = (item) => {
    setSelectedDesc(`【${item.name} / ${item.tai}台】: ${item.desc}`);
  };

  return (
    <div className="glass-panel p-5 w-full">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 className="text-xl font-bold text-[#D4AF37]">🧮 台灣麻將台數計算器</h3>
        <div className="text-right">
          <span className="text-sm text-gray-400 mr-2">總計:</span>
          <span className="text-2xl font-black text-[#10B981]">{totalTai} 台</span>
        </div>
      </div>

      {isTeachingMode && (
        <div className="bg-emerald-950/40 border-l-4 border-emerald-500 p-2.5 rounded text-xs mb-4 text-gray-300">
          💡 <strong>教學模式提示</strong>：點選任何台數牌型可以查看其規則說明。多數排他性牌型（如清一色與混一色）會自動互斥，幫您避免重複計台。
        </div>
      )}

      {selectedDesc && (
        <div className="bg-black/30 border border-gray-700 p-3 rounded text-sm text-gray-300 mb-4 animate-slideIn">
          {selectedDesc}
        </div>
      )}

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {/* Basic Categories */}
        {Object.entries(TAI_ITEMS).map(([category, items]) => {
          let catName = '其他';
          if (category === 'basic') catName = '基本與胡法';
          if (category === 'winds') catName = '莊家與字牌';
          if (category === 'combinations') catName = '牌面結構';
          if (category === 'suits') catName = '花色與特殊牌型';
          if (category === 'flowers') catName = '花牌系列';

          return (
            <div key={category} className="border-b border-gray-800 pb-3 last:border-0">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">{catName}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map(item => {
                  const isChecked = selected[item.id];
                  
                  // Special Dealer Streak sub-controls
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
                          <span>連莊數 (連N拉N = 2N台):</span>
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
                      className={`flex flex-col justify-between p-2 rounded border text-left cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-white' 
                          : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                      onClick={() => {
                        if (!item.count) {
                          toggleSelect(item.id);
                        }
                        handleShowDesc(item);
                      }}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-sm font-semibold">{item.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">+{item.tai}台</span>
                      </div>
                      
                      {item.count ? (
                        <div 
                          className="flex items-center justify-between mt-2 pt-1 border-t border-gray-800"
                          onClick={(e) => e.stopPropagation()} // Prevent parent click toggle
                        >
                          <span className="text-[10px] text-gray-500">數量:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCountChange(item.id, Math.max(0, (counts[item.id] || 0) - 1))}
                              className="w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-xs text-white"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#10B981]">{counts[item.id] || 0}</span>
                            <button
                              type="button"
                              onClick={() => handleCountChange(item.id, Math.min(item.max, (counts[item.id] || 0) + 1))}
                              className="w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-xs text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 block text-right mt-1">
                          {isChecked ? '✓ 已選' : '點選查看'}
                        </span>
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
            setSelectedDesc('');
          }}
          className="btn btn-secondary flex-1 py-2.5"
        >
          🧹 重設計算器
        </button>
        <button
          type="button"
          onClick={() => onConfirm(totalTai, Object.keys(selected).filter(k => selected[k]))}
          className="btn btn-primary flex-1 py-2.5"
        >
          💾 套用台數
        </button>
      </div>
    </div>
  );
}
