// localStorage 持久化 wrapper，含 cookie 後援與 Safari 無痕模式防護。

export const persistentStorage = {
  isAvailable() {
    return typeof window !== 'undefined'
      && window.Storage
      && window.localStorage
      && window.localStorage instanceof Storage;
  },

  setItem(name, value, t) {
    if (!this.isAvailable()) {
      this._setCookie(name, value, t);
      return;
    }
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.error('localStorage.setItem 錯誤,', e.message);
    }
  },

  getItem(name) {
    if (!this.isAvailable()) return this._getCookie(name);
    let value;
    try {
      value = localStorage.getItem(name);
    } catch (e) {
      console.error('localStorage.getItem 錯誤,', e.message);
    }
    return value;
  },

  _setCookie(name, value, t) {
    const d = new Date();
    d.setTime(d.getTime() + (t * 86400 * 1000));
    const expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires;
  },

  _getCookie(name) {
    const reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
    const arr = document.cookie.match(reg);
    if (arr) return arr[2];
    return null;
  },
};
