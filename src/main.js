// 應用程式入口。掛載根元件至 #app。

import { App } from './ui/app.js';

const root = document.getElementById('app');
if (root) {
  const app = new App();
  app.mount(root);
}
