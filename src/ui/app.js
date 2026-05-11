// 應用根元件：標頭、分頁導覽、頁面區、頁尾。
// 維護當前分頁狀態與生命週期。

import { PAGES, findPage } from './pages.js';

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
          <h1 class="app-title">萬年曆</h1>
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
    this.renderNav();
    this.navigate(this.readActivePageId() || PAGES[0].id);
    this.bindHash();
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
