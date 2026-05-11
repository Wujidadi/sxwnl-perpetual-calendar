// 占位分頁元件。實際實作將於後續迭代補上。

export function createStubPage(title, description) {
  return {
    mount(container) {
      const el = document.createElement('section');
      el.className = 'page-stub';
      el.innerHTML = `
        <h2>${title}</h2>
        <p>${description}</p>
        <p><small>本分頁尚未實作；後續迭代逐步補上。</small></p>
      `;
      container.appendChild(el);
      this.el = el;
    },
    unmount() {
      if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    },
  };
}
