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
import { t } from '../i18n/index.js';

// 各分頁以 id + factory 定義；title 由 i18n 字典依當前語系即時提供。
export const PAGES = [
  { id: 'month-calendar',  create: () => new MonthCalendarPage() },
  { id: 'year-calendar',   create: () => new YearCalendarPage() },
  { id: 'solar-eclipse',   create: () => new SolarEclipsePage() },
  { id: 'local-eclipse',   create: () => new LocalEclipsePage() },
  { id: 'ephemeris',       create: () => new EphemerisPage() },
  { id: 'celestial',       create: () => new CelestialPage() },
  { id: 'stars',           create: () => new StarsPage() },
  { id: 'shuoqi',          create: () => new ShuoQiPage() },
  { id: 'rise-set',        create: () => new RiseSetPage() },
  { id: 'eclipse-outline', create: () => new EclipseOutlinePage() },
  { id: 'bazi',            create: () => new BaziPage() },
  { id: 'tools',           create: () => new ToolsPage() },
  { id: 'constants',       create: () => new ConstantsPage() },
].map((def) => Object.defineProperty(def, 'title', {
  enumerable: true,
  get() { return t(`ui.pages.${this.id}`); },
}));

export function findPage(id) {
  return PAGES.find((p) => p.id === id) || PAGES[0];
}
