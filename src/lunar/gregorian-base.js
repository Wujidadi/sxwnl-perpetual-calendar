// 公曆基礎：固定節日表、按週節日表、節日查詢、回曆（伊斯蘭曆）換算。
// 節日字串內容（中文名稱）屬 i18n 範疇，於 Phase 4 處理。

// 月內第 N 個星期 W 的節日表。
// 格式：MMNQ<type><節日名>，其中 MM=月份(2 位)、N=第幾個(0=最後、1-5=順位)、
// Q=星期(0-6)、type=#放假 / I 重要 / . 其他
export const WEEKDAY_FESTIVALS = new Array(
  '0150I世界麻风日', // 一月的最後一個星期日（月倒數第一個星期日）
  '0520.国际母亲节',
  '0530I全国助残日',
  '0630.父亲节',
  '0730.被奴役国家周',
  '0932I国际和平日',
  '0940.国际聋人节 世界儿童日',
  '0950I世界海事日',
  '1011.国际住房日',
  '1013I国际减轻自然灾害日(减灾日)',
  '1144I感恩节',
);

// 陽曆固定日期節日（依月份，| 分隔）。
// 格式：DD<type><年限範圍?>節日名, ...
// type=# 放假 / I 重要 / . 其他；年限範圍為「-YYYY」字串（如「1989-9999」）。
const SOLAR_DATE_FESTIVALS_RAW =
   '01#元旦|' // 1 月
  +'02I世界湿地日,10.国际气象节,14I情人节|' // 2 月
  +'01.国际海豹日,03.全国爱耳日,05.1963-9999学雷锋纪念日,08I妇女节,12I植树节,12.1925-9999孙中山逝世纪念日,14.国际警察日,'
  +'15I1983-9999消费者权益日,17.中国国医节,17.国际航海日,21.世界森林日,21.消除种族歧视国际日,21.世界儿歌日,22I世界水日,'
  +'23I世界气象日,24.1982-9999世界防治结核病日,25.全国中小学生安全教育日,30.巴勒斯坦国土日|'
  +'01I1564-9999愚人节,01.全国爱国卫生运动月(四月),01.税收宣传月(四月),07I世界卫生日,22I世界地球日,23.世界图书和版权日,24.亚非新闻工作者日|'
  +'01#1889-9999劳动节,04I青年节,05.碘缺乏病防治日,08.世界红十字日,12I国际护士节,15I国际家庭日,17.国际电信日,18.国际博物馆日,'
  +'20.全国学生营养日,23.国际牛奶日,31I世界无烟日|'
  +'01I1925-9999国际儿童节,05.世界环境保护日,06.全国爱眼日,17.防治荒漠化和干旱日,23.国际奥林匹克日,25.全国土地日,26I国际禁毒日|'
  +'01I1997-9999香港回归纪念日,01I1921-9999中共诞辰,01.世界建筑日,02.国际体育记者日,07I1937-9999抗日战争纪念日,11I世界人口日,30.非洲妇女日|'
  +'01I1927-9999建军节,08.中国男子节(爸爸节)|'
  +'03I1945-9999抗日战争胜利纪念,08.1966-9999国际扫盲日,08.国际新闻工作者日,09.毛泽东逝世纪念,10I中国教师节,14.世界清洁地球日,'
  +'16.国际臭氧层保护日,18I九·一八事变纪念日,20.国际爱牙日,27.世界旅游日,28I孔子诞辰|'
  +'01#1949-9999国庆节,01.世界音乐日,01.国际老人节,02#1949-9999国庆节假日,02.国际和平与民主自由斗争日,03#1949-9999国庆节假日,'
  +'04.世界动物日,06.老人节,08.全国高血压日,08.世界视觉日,09.世界邮政日,09.万国邮联日,10I辛亥革命纪念日,10.世界精神卫生日,'
  +'13.世界保健日,13.国际教师节,14.世界标准日,15.国际盲人节(白手杖节),16.世界粮食日,17.世界消除贫困日,22.世界传统医药日,24.联合国日,31.世界勤俭日|'
  +'07.1917-9999十月社会主义革命纪念日,08.中国记者日,09.全国消防安全宣传教育日,10.世界青年节,11.国际科学与和平周(本日所属的一周),12.孙中山诞辰纪念日,'
  +'14.世界糖尿病日,17.国际大学生节,17.世界学生节,20.彝族年,21.彝族年,21.世界问候日,21.世界电视日,22.彝族年,29.国际声援巴勒斯坦人民国际日|'
  +'01I1988-9999世界艾滋病日,03.世界残疾人日,05.国际经济和社会发展志愿人员日,08.国际儿童电视日,09.世界足球日,10.世界人权日,'
  +'12I西安事变纪念日,13I南京大屠杀(1937年)纪念日,20.澳门回归纪念,21.国际篮球日,24I平安夜,25I圣诞节,26.毛泽东诞辰纪念';

export const SOLAR_DATE_FESTIVALS = SOLAR_DATE_FESTIVALS_RAW.split('|').map((s) => s.split(','));

// 取某日節日（公曆）。
//   u 為日物件，必須含 year / month / day / weekday / weekIndex / firstWeekday / weekCount。
//   r 為輸出物件，會追加 holidayA / holidayB / holidayC 字串、isHoliday 旗標。
export function getDayName(u, r) {
  const m0 = (u.month < 10 ? '0' : '') + u.month;
  const d0 = (u.day   < 10 ? '0' : '') + u.day;

  if (u.weekday === 0 || u.weekday === 6) r.isHoliday = 1;

  // 按公曆日期查找
  const monthFtv = SOLAR_DATE_FESTIVALS[u.month - 1];
  for (let i = 0; i < monthFtv.length; i++) {
    let s = monthFtv[i];
    if (s.substr(0, 2) !== d0) continue;
    s = s.substr(2, s.length - 2);
    const type = s.substr(0, 1);
    if (s.substr(5, 1) === '-') {
      if (u.year < (s.substr(1, 4) - 0) || u.year > (s.substr(6, 4) - 0)) continue;
      s = s.substr(10, s.length - 10);
    } else {
      if (u.year < 1850) continue;
      s = s.substr(1, s.length - 1);
    }
    if (type === '#') { r.holidayA += s + ' '; r.isHoliday = 1; }
    if (type === 'I')   r.holidayB += s + ' ';
    if (type === '.')   r.holidayC += s + ' ';
  }

  // 按週查找：本月的第 N 個星期 W
  let w = u.weekIndex; if (u.weekday >= u.firstWeekday) w += 1;
  let w2 = w;          if (u.weekIndex === u.weekCount - 1) w2 = 5;
  const wKey  = m0 + w  + u.weekday;
  const w2Key = m0 + w2 + u.weekday;

  for (let i = 0; i < WEEKDAY_FESTIVALS.length; i++) {
    let s = WEEKDAY_FESTIVALS[i];
    const s2 = s.substr(0, 4);
    if (s2 !== wKey && s2 !== w2Key) continue;
    const type = s.substr(4, 1);
    s = s.substr(5, s.length - 5);
    if (type === '#') { r.holidayA += s + ' '; r.isHoliday = 1; }
    if (type === 'I')   r.holidayB += s + ' ';
    if (type === '.')   r.holidayC += s + ' ';
  }
}

// 回曆（伊斯蘭曆）換算。d0 為 J2000 起算的儒略日（北京中午 12 時）。
// 結果寫入 r.hijriYear / r.hijriMonth / r.hijriDay。
export function getHijriDate(d0, r) {
  let d = d0 + 503105;
  const z = Math.floor(d / 10631); // 10631 為一週期（30 年）
  d -= z * 10631;
  const y = Math.floor((d + 0.5) / 354.366); // +0.5 保證閏年正確
  d -= Math.floor(y * 354.366 + 0.5);
  const m = Math.floor((d + 0.11) / 29.51); // +0.11 / +0.01 使第 354–355 天保持為 12 月
  d -= Math.floor(m * 29.5 + 0.5);
  r.hijriYear  = z * 30 + y + 1;
  r.hijriMonth = m + 1;
  r.hijriDay   = d + 1;
}
