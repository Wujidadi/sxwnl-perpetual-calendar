// 繁體中文（臺灣慣用詞）

export default {
  // 天文・行星
  astro: {
    planets: ['地球', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'],
    angle: {
      deg: '°',  arcmin: "'",  arcsec: '"',
      hour: 'h ', min: 'm', sec: 's',
      cnMin: '分', cnSec: '秒',
    },
  },

  // 農曆・干支・節氣
  lunar: {
    numerals:        ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    heavenlyStems:   ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    earthlyBranches: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    zodiac:          ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'],
    westernZodiac:   ['摩羯', '水瓶', '雙魚', '白羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手'],
    phases:          ['朔', '上弦', '望', '下弦'],
    terms:           ['冬至', '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種', '夏至', '小暑', '大暑', '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'],
    monthNames:      ['十一', '十二', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    dayNames:        ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '卅一'],
    leapPrefix:      '閏',
    bigMonthSuffix:  '大',
    smallMonthSuffix: '小',
  },

  // 星期
  weekday: {
    short:   ['日', '一', '二', '三', '四', '五', '六'],
    full:    ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    prefix:  '星期',
  },

  // 日／月食
  eclipse: {
    solar: {
      N: '無食',  P: '偏食',  T: '全食',  A: '環食',
      T0: '全食（無中心線）',  A0: '環食（無中心線）',
      T1: '全食（中心未完全進入）', A1: '環食（中心未完全進入）',
      H: '混合食',  H2: '全環食（全始）',  H3: '全環食（全終）',
    },
    lunar: {
      penumbral: '半影食', partial: '偏食', total: '全食',
    },
    phases: {
      P1: '初虧', U1: '食既', Max: '食甚', U4: '生光', P4: '復圓',
      Pe1: '半影始', Pe4: '半影終',
      centerStart: '中心始', centerEnd: '中心終',
      partialStart: '偏食始', partialEnd: '偏食終',
      noonMax: '地方視午食',
    },
    metrics: {
      magnitude: '食分',
      gamma: 'γ 值',
      maxLocation: '最大食地標',
      bandWidth: '食帶寬度',
      centralDuration: '中心食持續時間',
      delta_t: 'ΔT',
      duration: '持續時間',
    },
  },

  // UI 共用
  ui: {
    appTitle: '萬年曆',
    locale: '語系',
    buttons: {
      compute: '計算',
      query: '查詢',
      findEclipse: '自動找近期日食',
      timeline: '時間軸',
      search: '尋找日食',
    },
    labels: {
      year: '年',
      month: '月',
      day: '日',
      time: '時間（北京時）',
      longitude: '經度',
      latitude: '緯度',
      altitude: '海拔',
      city: '城市',
      result: '結果',
      type: '類型',
      time_: '時刻',
      note: '備註',
    },
    pages: {
      'month-calendar':  '月曆',
      'year-calendar':   '年曆',
      'shuoqi':          '朔氣',
      'rise-set':        '升中降',
      'bazi':            '八字',
      'tools':           '工具',
      'ephemeris':       '星曆',
      'celestial':       '天象',
      'stars':           '星表',
      'constants':       '常數',
      'solar-eclipse':   '日月食',
      'local-eclipse':   '地方食',
      'eclipse-outline': '日食概略',
    },
    cityPicker: {
      region: '— 省／地區 —',
      city:   '— 城市 —',
    },
  },
};
