// 應用根元件：標頭、分頁導覽、頁面區、頁尾。
// 維護當前分頁狀態與生命週期；含語系切換器。

import { PAGES, findPage } from './pages.js';
import { t, getLocale, setLocale, getSupported, onLocaleChange } from '../i18n/index.js';
import { persistentStorage } from '../utils/storage.js';

const STORAGE_KEY      = 'pc.activePageId';
const THEME_KEY        = 'pc.theme';
const LOCALE_TOAST_KEY = 'pc.localeAutoToastSeen';
const I18N_LOCALE_KEY  = 'perpetual-calendar.locale';

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
            <button type="button" class="app-theme-toggle" id="app-theme-toggle" aria-label="theme"></button>
          </div>
        </header>
        <nav class="app-nav" aria-label="主導覽"></nav>
        <div class="app-kbd-hint" id="app-kbd-hint"></div>
        <main class="app-main" id="page-container"></main>
        <footer class="app-footer" id="app-footer"></footer>
        <div class="app-toast" id="app-toast" hidden></div>
      </div>
    `;
    this.nav = root.querySelector('.app-nav');
    this.pageContainer = root.querySelector('#page-container');
    this.applyInitialTheme();
    this.renderTitle();
    this.renderLocaleSwitch();
    this.renderThemeToggle();
    this.renderNav();
    this.navigate(this.readActivePageId() || PAGES[0].id);
    this.bindHash();
    this.bindKeyboard();
    onLocaleChange(() => this.onLocaleChanged());
    this.maybeShowLocaleAutoToast();
  }

  applyInitialTheme() {
    let theme;
    try { theme = persistentStorage.getItem(THEME_KEY); } catch (_) {}
    if (!theme) {
      const prefersDark = typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
  }

  renderThemeToggle() {
    const btn = this.root.querySelector('#app-theme-toggle');
    const refresh = () => {
      const cur = document.documentElement.dataset.theme || 'light';
      btn.textContent = cur === 'dark' ? t('ui.themeLight') : t('ui.themeDark');
      btn.title = t('ui.themeTooltip');
    };
    refresh();
    btn.addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme || 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { persistentStorage.setItem(THEME_KEY, next, 365); } catch (_) {}
      refresh();
    });
    this._refreshThemeToggle = refresh;
  }

  // 首次進入且使用者尚未手動設定 locale → 顯示短暫 toast。
  maybeShowLocaleAutoToast() {
    let stored, seen;
    try {
      stored = persistentStorage.getItem(I18N_LOCALE_KEY);
      seen   = persistentStorage.getItem(LOCALE_TOAST_KEY);
    } catch (_) {}
    if (stored || seen) return;
    this.showToast(t('ui.localeAutoToast'));
    try { persistentStorage.setItem(LOCALE_TOAST_KEY, '1', 365); } catch (_) {}
  }

  showToast(text, ms = 4000) {
    const el = this.root.querySelector('#app-toast');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    el.classList.add('is-visible');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => { el.hidden = true; }, 300);
    }, ms);
  }

  // ←／→ 切換上／下一個分頁；忽略在 input／textarea／select／contentEditable 中觸發。
  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.target.isContentEditable) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const idx = PAGES.findIndex((p) => p.id === (this.currentPage && this.currentPage.id));
      if (idx < 0) return;
      const next = e.key === 'ArrowLeft' ? (idx - 1 + PAGES.length) % PAGES.length : (idx + 1) % PAGES.length;
      this.navigate(PAGES[next].id);
      e.preventDefault();
    });
  }

  renderTitle() {
    this.root.querySelector('#app-title').textContent = t('ui.appTitle');
    this.root.querySelector('#app-locale-label').textContent = t('ui.locale') + '：';
    this.root.querySelector('#app-footer').textContent = t('ui.footer');
    this.root.querySelector('#app-kbd-hint').textContent = t('ui.kbdHint');
    document.title = t('ui.appTitle');
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
    if (this._refreshThemeToggle) this._refreshThemeToggle();
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
