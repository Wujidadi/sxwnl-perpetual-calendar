// 應用根元件：標頭、分頁導覽、頁面區、頁尾。
// 維護當前分頁狀態與生命週期；含語系切換器。

import { PAGES, findPage } from './pages.js';
import { t, getLocale, setLocale, getSupported, onLocaleChange } from '../i18n/index.js';

const STORAGE_KEY = 'pc.activePageId';

export class App {
  constructor() {
    this.root = null;
    this.currentPage = null;
    this.currentComponent = null;
    this.nav = null;
    this.pageContainer = null;
  }

  mount(root) {
    this.root = root;
    root.removeAttribute('data-loading');
    root.innerHTML = `
      <div class="app-shell">
        <header class="app-header">
          <h1 class="app-title" id="app-title"></h1>
          <div class="app-locale-switch">
            <label for="app-locale-select" id="app-locale-label"></label>
            <select id="app-locale-select"></select>
          </div>
        </header>
        <nav class="app-nav" aria-label="主導覽"></nav>
        <main class="app-main" id="page-container"></main>
        <footer class="app-footer">
          演算法承自壽星萬年曆作者許劍偉。
        </footer>
      </div>
    `;
    this.nav = root.querySelector('.app-nav');
    this.pageContainer = root.querySelector('#page-container');
    this.renderTitle();
    this.renderLocaleSwitch();
    this.renderNav();
    this.navigate(this.readActivePageId() || PAGES[0].id);
    this.bindHash();
    onLocaleChange(() => this.onLocaleChanged());
  }

  renderTitle() {
    this.root.querySelector('#app-title').textContent = t('ui.appTitle');
    this.root.querySelector('#app-locale-label').textContent = t('ui.locale') + '：';
  }

  renderLocaleSwitch() {
    const sel = this.root.querySelector('#app-locale-select');
    sel.innerHTML = getSupported()
      .map((s) => `<option value="${s.code}">${s.name}</option>`)
      .join('');
    sel.value = getLocale();
    sel.addEventListener('change', () => setLocale(sel.value));
  }

  onLocaleChanged() {
    this.renderTitle();
    this.renderNav();
    if (this.currentPage) this.navigate(this.currentPage.id);
  }

  renderNav() {
    this.nav.innerHTML = '';
    for (const page of PAGES) {
      const btn = document.createElement('button');
      btn.className = 'app-nav-item';
      btn.type = 'button';
      btn.textContent = page.title;
      btn.dataset.pageId = page.id;
      btn.addEventListener('click', () => this.navigate(page.id));
      this.nav.appendChild(btn);
    }
  }

  navigate(pageId) {
    const target = findPage(pageId);
    if (this.currentComponent && this.currentComponent.unmount) {
      this.currentComponent.unmount();
    }
    this.pageContainer.innerHTML = '';
    this.currentPage = target;
    this.currentComponent = target.create();
    if (this.currentComponent && this.currentComponent.mount) {
      this.currentComponent.mount(this.pageContainer);
    }
    // 更新導覽 aria-current
    for (const btn of this.nav.querySelectorAll('.app-nav-item')) {
      if (btn.dataset.pageId === target.id) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    }
    this.writeActivePageId(target.id);
    if (window.location.hash !== '#' + target.id) {
      history.replaceState(null, '', '#' + target.id);
    }
  }

  bindHash() {
    window.addEventListener('hashchange', () => {
      const id = window.location.hash.replace(/^#/, '');
      if (id && id !== this.currentPage.id) this.navigate(id);
    });
    const initial = window.location.hash.replace(/^#/, '');
    if (initial) this.navigate(initial);
  }

  readActivePageId() {
    try { return window.localStorage.getItem(STORAGE_KEY); }
    catch { return null; }
  }
  writeActivePageId(id) {
    try { window.localStorage.setItem(STORAGE_KEY, id); }
    catch { /* 忽略 */ }
  }
}
