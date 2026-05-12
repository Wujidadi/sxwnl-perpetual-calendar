// 简体中文（沿用原版字串）

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

  // 农曆・干支・节气
  lunar: {
    numerals:        ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    heavenlyStems:   ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    earthlyBranches: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    zodiac:          ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
    westernZodiac:   ['摩羯', '水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手'],
    phases:          ['朔', '上弦', '望', '下弦'],
    terms:           ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'],
    monthNames:      ['十一', '十二', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    dayNames:        ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '卅一'],
    leapPrefix:      '闰',
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
      N: '无食',  P: '偏食',  T: '全食',  A: '环食',
      T0: '全食（无中心线）',  A0: '环食（无中心线）',
      T1: '全食（中心未完全进入）', A1: '环食（中心未完全进入）',
      H: '混合食',  H2: '全环食（全始）',  H3: '全环食（全终）',
    },
    lunar: {
      penumbral: '半影食', partial: '偏食', total: '全食',
    },
    phases: {
      P1: '初亏', U1: '食既', Max: '食甚', U4: '生光', P4: '复圆',
      Pe1: '半影始', Pe4: '半影终',
      centerStart: '中心始', centerEnd: '中心终',
      partialStart: '偏食始', partialEnd: '偏食终',
      noonMax: '地方视午食',
    },
    metrics: {
      magnitude: '食分',
      gamma: 'γ 值',
      maxLocation: '最大食地标',
      bandWidth: '食带宽度',
      centralDuration: '中心食持续时间',
      delta_t: 'ΔT',
      duration: '持续时间',
    },
  },

  // UI 共用
  ui: {
    appTitle: '万年历',
    locale: '语系',
    buttons: {
      compute: '计算',
      query: '查询',
      findEclipse: '自动找近期日食',
      timeline: '时间轴',
      search: '寻找日食',
    },
    labels: {
      year: '年',
      month: '月',
      day: '日',
      time: '时间（北京时）',
      longitude: '经度',
      latitude: '纬度',
      altitude: '海拔',
      city: '城市',
      result: '结果',
      type: '类型',
      time_: '时刻',
      note: '备注',
    },
    pages: {
      'month-calendar':  '月历',
      'year-calendar':   '年历',
      'shuoqi':          '朔气',
      'rise-set':        '升中降',
      'bazi':            '八字',
      'tools':           '工具',
      'ephemeris':       '星历',
      'celestial':       '天象',
      'stars':           '星表',
      'constants':       '常数',
      'solar-eclipse':   '日月食',
      'local-eclipse':   '地方食',
      'eclipse-outline': '日食概略',
    },
    cityPicker: {
      region: '— 省／地区 —',
      city:   '— 城市 —',
    },
  },
};
