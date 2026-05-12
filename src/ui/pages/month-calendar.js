// 月曆主頁。
// 呈現指定公曆年月的三合曆（公曆／農曆／節氣／月相／節日）；含年月切換與今日標記。

import { LunarMonth } from '../../lunar/lunar-month.js';
import { t } from '../../i18n/index.js';

export class MonthCalendarPage {
  constructor() {
    this.year = null;
    this.month = null;
    this.lunar = null;
    this.container = null;
  }

  mount(container) {
    this.container = container;
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth() + 1;
    const mc = t('ui.monthCalendar');
    container.innerHTML = `
      <section class="page-month-calendar">
        <form class="form-row" id="cal-form">
          <label>${mc.yearLabel} <input type="number" id="cal-year" min="-4712" max="9999" step="1" value="${this.year}" /></label>
          <label>${mc.monthLabel} <input type="number" id="cal-month" min="1" max="12" step="1" value="${this.month}" /></label>
          <button class="btn btn-primary" type="submit">${mc.btnView}</button>
          <button class="btn" type="button" id="cal-today">${mc.btnToday}</button>
          <button class="btn" type="button" id="cal-prev">${mc.btnPrev}</button>
          <button class="btn" type="button" id="cal-next">${mc.btnNext}</button>
        </form>
        <div id="cal-output"></div>
      </section>
    `;
    container.querySelector('#cal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const y = Number(container.querySelector('#cal-year').value);
      const m = Number(container.querySelector('#cal-month').value);
      this.render(y, m);
    });
    container.querySelector('#cal-today').addEventListener('click', () => {
      const d = new Date();
      this.render(d.getFullYear(), d.getMonth() + 1);
    });
    container.querySelector('#cal-prev').addEventListener('click', () => this.shift(-1));
    container.querySelector('#cal-next').addEventListener('click', () => this.shift(+1));
    this.render(this.year, this.month);
  }

  unmount() {
    this.container = null;
    this.lunar = null;
  }

  shift(delta) {
    let y = this.year, m = this.month + delta;
    if (m < 1)  { m = 12; y -= 1; }
    if (m > 12) { m = 1;  y += 1; }
    this.render(y, m);
  }

  render(year, month) {
    this.year = year;
    this.month = month;
    this.lunar = new LunarMonth();
    this.lunar.calcMonth(year, month);

    // 更新表單同步
    this.container.querySelector('#cal-year').value  = String(year);
    this.container.querySelector('#cal-month').value = String(month);

    const output = this.container.querySelector('#cal-output');
    output.innerHTML = '';
    output.appendChild(this.renderHeader());
    output.appendChild(this.renderGrid());
    const events = this.renderEvents();
    if (events) output.appendChild(events);
  }

  renderHeader() {
    const wrap = document.createElement('div');
    wrap.className = 'calendar-header';
    const today = new Date();
    const isCurrent = today.getFullYear() === this.year && (today.getMonth() + 1) === this.month;
    const mc = t('ui.monthCalendar');
    const yLabel = t('ui.labels.year');
    const mLabel = t('ui.labels.month');
    wrap.innerHTML = `
      <div>
        <div class="calendar-title">${this.year} ${yLabel} ${this.month} ${mLabel}${isCurrent ? mc.currentMark : ''}</div>
        <div class="calendar-meta">
          ${mc.meta.replace('{ganZhi}', `<strong>${this.lunar.yearGanZhi}</strong>`).replace('{zodiac}', this.lunar.zodiacAnimal)}
          ${this.lunar.reignTitle ? '・' + escapeHtml(this.lunar.reignTitle) : ''}
        </div>
      </div>
    `;
    return wrap;
  }

  renderGrid() {
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    const weekdays = t('weekday.short');
    const weekPrefix = t('weekday.prefix');
    for (const w of weekdays) {
      const h = document.createElement('div');
      h.className = 'calendar-weekday';
      h.textContent = weekPrefix + w;
      grid.appendChild(h);
    }
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth() + 1;
    const todayD = today.getDate();

    // 月首前的空格
    for (let i = 0; i < this.lunar.firstWeekday; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell is-empty';
      grid.appendChild(cell);
    }
    for (let i = 0; i < this.lunar.monthLength; i++) {
      const day = this.lunar.days[i];
      grid.appendChild(this.renderCell(day, todayY, todayM, todayD));
    }
    // 月末後的空格，補滿一週
    const filled = this.lunar.firstWeekday + this.lunar.monthLength;
    const remainder = (7 - (filled % 7)) % 7;
    for (let i = 0; i < remainder; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell is-empty';
      grid.appendChild(cell);
    }
    return grid;
  }

  renderCell(day, todayY, todayM, todayD) {
    const cell = document.createElement('div');
    const classes = ['calendar-cell'];
    if (day.weekday === 0 || day.weekday === 6) classes.push('is-weekend');
    if (this.year === todayY && this.month === todayM && day.day === todayD) classes.push('is-today');
    cell.className = classes.join(' ');

    // 公曆日
    const num = document.createElement('div');
    num.className = 'calendar-day-num' + (day.isHoliday ? ' is-holiday' : '');
    num.textContent = day.day;
    cell.appendChild(num);

    // 農曆日（初一顯示月名，其餘顯示日名）
    const lun = document.createElement('div');
    if (day.lunarDayName === t('lunar.dayNames')[0]) {
      lun.className = 'calendar-lunar is-month';
      lun.textContent = (day.lunarLeap || '') + day.lunarMonthName + t('ui.labels.month');
    } else {
      lun.className = 'calendar-lunar';
      lun.textContent = day.lunarDayName;
    }
    cell.appendChild(lun);

    // 節氣 / 月相標記
    const markers = [];
    if (day.solarTermName) markers.push(`<span class="term">${day.solarTermName}</span>`);
    if (day.moonPhaseName) markers.push(`<span class="phase">${day.moonPhaseName}</span>`);
    if (markers.length) {
      const m = document.createElement('div');
      m.className = 'calendar-markers';
      m.innerHTML = markers.join('');
      cell.appendChild(m);
    }

    // 節日（取最重要的一個）
    const festival = pickFestival(day);
    if (festival) {
      const f = document.createElement('div');
      f.className = 'calendar-festival';
      f.textContent = festival;
      cell.appendChild(f);
    }

    cell.title = buildTooltip(day);
    return cell;
  }

  renderEvents() {
    const dayLabel = t('ui.monthCalendar.dayLabel');
    const phases = [];
    const terms = [];
    for (let i = 0; i < this.lunar.monthLength; i++) {
      const d = this.lunar.days[i];
      if (d.moonPhaseName) phases.push(`${pad2(d.day)} ${dayLabel} ${d.moonPhaseTimeStr} ${d.moonPhaseName}`);
      if (d.solarTermName) terms.push(`${pad2(d.day)} ${dayLabel} ${d.solarTermTimeStr} ${d.solarTermName}`);
    }
    if (!phases.length && !terms.length) return null;
    const mc = t('ui.monthCalendar');
    const box = document.createElement('div');
    box.className = 'calendar-events';
    box.innerHTML = `
      ${phases.length ? `<h3>${mc.moonPhasesTitle}</h3><ul>${phases.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}
      ${terms.length  ? `<h3>${mc.solarTermsTitle}</h3><ul>${terms.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}
    `;
    return box;
  }
}

function pickFestival(day) {
  if (day.holidayA) return trimFestival(day.holidayA);
  if (day.holidayB) return trimFestival(day.holidayB);
  return '';
}

function trimFestival(s) {
  s = String(s).trim();
  const parts = s.split(/\s+/);
  return parts[0] || '';
}

function buildTooltip(day) {
  const mc = t('ui.monthCalendar');
  const lines = [];
  lines.push(`${day.year}-${pad2(day.month)}-${pad2(day.day)}（${t('weekday.prefix')}${t('weekday.short')[day.weekday]}）`);
  lines.push(mc.tooltipLunar.replace('{leap}', day.lunarLeap || '').replace('{month}', day.lunarMonthName).replace('{day}', day.lunarDayName));
  lines.push(mc.tooltipGanzhi.replace('{y}', day.lunarYearGanZhi).replace('{m}', day.lunarMonthGanZhi).replace('{d}', day.lunarDayGanZhi).replace('{zod}', day.zodiacSign));
  if (day.hijriYear) lines.push(mc.tooltipHijri.replace('{y}', day.hijriYear).replace('{m}', pad2(day.hijriMonth)).replace('{d}', pad2(day.hijriDay)));
  if (day.solarTermName) lines.push(mc.tooltipTerm.replace('{name}', day.solarTermName).replace('{t}', day.solarTermTimeStr));
  if (day.moonPhaseName) lines.push(mc.tooltipPhase.replace('{name}', day.moonPhaseName).replace('{t}', day.moonPhaseTimeStr));
  const festival = (day.holidayA + day.holidayB + day.holidayC).trim();
  if (festival) lines.push(mc.tooltipFestival.replace('{s}', festival));
  return lines.join('\n');
}

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
