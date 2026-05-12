// 年曆分頁：列出該年所有農曆月與節氣（含精確時刻與干支兩種版式）。

import {
  renderYearCalendarHTML,
  renderYearCalendarV2HTML,
} from '../../lunar/year-calendar.js';
import { t } from '../../i18n/index.js';

export class YearCalendarPage {
  constructor() {
    this.variant = 'v1';
  }

  mount(container) {
    const y = new Date().getFullYear();
    const root = document.createElement('section');
    root.className = 'page-year-calendar';
    const yc = t('ui.yearCalendar');
    root.innerHTML = `
      <h2 style="margin-top:0">${yc.title}</h2>
      <p style="color:var(--color-text-soft);font-size:13px;margin-top:0">
        ${yc.hint}
      </p>
      <form class="page-card" id="yc-form">
        <div class="form-row">
          <label>${t('ui.labels.yearOnly')} <input type="number" id="yc-y" value="${y}" min="-4712" max="9999" step="1" /></label>
          <label>
            ${yc.variantLabel}
            <select id="yc-variant">
              <option value="v1">${yc.variantV1}</option>
              <option value="v2">${yc.variantV2}</option>
            </select>
          </label>
          <button class="btn btn-primary" type="submit">${t('ui.buttons.query')}</button>
        </div>
      </form>
      <div class="page-card" id="yc-output"></div>
    `;
    container.appendChild(root);
    this.el = root;
    root.querySelector('#yc-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.render();
    });
    this.render();
  }

  unmount() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  render() {
    const y = Number(this.el.querySelector('#yc-y').value);
    const variant = this.el.querySelector('#yc-variant').value;
    const out = this.el.querySelector('#yc-output');
    let html;
    if (variant === 'v2') {
      html = renderYearCalendarV2HTML(y);
    } else {
      // 用 '<br>' 作為段內分隔，使每個事件單獨成行
      html = renderYearCalendarHTML(y, '<br>');
    }
    out.innerHTML = `<div class="year-cal-output">${html}</div>`;
  }
}
