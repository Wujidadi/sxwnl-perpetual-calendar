// 分頁註冊表：每個分頁元件必須提供 { id, title, create() }
// create() 回傳一個元件物件 { mount(container), unmount() }

import { MonthCalendarPage } from './pages/month-calendar.js';
import { YearCalendarPage } from './pages/year-calendar.js';
import { BaziPage } from './pages/bazi.js';
import { RiseSetPage } from './pages/rise-set.js';
import { ShuoQiPage } from './pages/shuoqi.js';
import { ToolsPage } from './pages/tools.js';
import { ConstantsPage } from './pages/constants.js';
import { EphemerisPage } from './pages/ephemeris.js';
import { CelestialPage } from './pages/celestial.js';
import { StarsPage } from './pages/stars.js';
import { SolarEclipsePage } from './pages/solar-eclipse.js';
import { LocalEclipsePage } from './pages/local-eclipse.js';
import { EclipseOutlinePage } from './pages/eclipse-outline.js';

export const PAGES = [
  { id: 'month-calendar',  title: '月曆',     create: () => new MonthCalendarPage() },
  { id: 'year-calendar',   title: '年曆',     create: () => new YearCalendarPage() },
  { id: 'solar-eclipse',   title: '日月食',   create: () => new SolarEclipsePage() },
  { id: 'local-eclipse',   title: '地方食',   create: () => new LocalEclipsePage() },
  { id: 'ephemeris',       title: '星曆',     create: () => new EphemerisPage() },
  { id: 'celestial',       title: '天象',     create: () => new CelestialPage() },
  { id: 'stars',           title: '恆星',     create: () => new StarsPage() },
  { id: 'shuoqi',          title: '氣朔',     create: () => new ShuoQiPage() },
  { id: 'rise-set',        title: '升降',     create: () => new RiseSetPage() },
  { id: 'eclipse-outline', title: '日食概略', create: () => new EclipseOutlinePage() },
  { id: 'bazi',            title: '八字',     create: () => new BaziPage() },
  { id: 'tools',           title: '工具',     create: () => new ToolsPage() },
  { id: 'constants',       title: '常數',     create: () => new ConstantsPage() },
];

export function findPage(id) {
  return PAGES.find((p) => p.id === id) || PAGES[0];
}
