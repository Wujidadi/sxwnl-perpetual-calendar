// 分頁註冊表：每個分頁元件必須提供 { id, title, create() }。
// create() 回傳一個元件物件 { mount(container), unmount() }。

import { MonthCalendarPage } from './pages/month-calendar.js';
import { createStubPage } from './pages/stub.js';

export const PAGES = [
  { id: 'month-calendar',  title: '月曆', create: () => new MonthCalendarPage() },
  { id: 'year-calendar',   title: '年曆', create: () => createStubPage('年曆', '顯示一整年的農曆排月、節氣、月相。') },
  { id: 'solar-eclipse',   title: '日月食', create: () => createStubPage('日月食', '日食與月食預報，含貝塞爾元素與全球可見區域。') },
  { id: 'local-eclipse',   title: '地方食', create: () => createStubPage('地方食', '站心觀測：日食食甚、初虧、復圓時刻。') },
  { id: 'ephemeris',       title: '星曆', create: () => createStubPage('星曆', '行星與月亮的視坐標、距離、升降時刻。') },
  { id: 'celestial',       title: '天象', create: () => createStubPage('天象', '行星合月、合日、衝、大距等天象事件。') },
  { id: 'stars',           title: '恆星', create: () => createStubPage('恆星', '88 星座與恆星庫檢索；恆星視位置計算。') },
  { id: 'shuoqi',          title: '氣朔', create: () => createStubPage('氣朔', '節氣與合朔時刻表。') },
  { id: 'rise-set',        title: '升降', create: () => createStubPage('升降', '太陽與月亮升、中、降時刻；含晨昏蒙影。') },
  { id: 'eclipse-outline', title: '日食概略', create: () => createStubPage('日食概略', '全球日食路徑與南北界線。') },
  { id: 'bazi',            title: '八字', create: () => createStubPage('八字', '生辰八字（年柱／月柱／日柱／時柱）計算。') },
  { id: 'tools',           title: '工具', create: () => createStubPage('工具', '日期換算、圓周率計算等小工具。') },
  { id: 'constants',       title: '常數', create: () => createStubPage('常數', '物理與天文常數速查。') },
];

export function findPage(id) {
  return PAGES.find((p) => p.id === id) || PAGES[0];
}
