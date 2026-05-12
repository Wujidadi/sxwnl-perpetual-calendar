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
    if (typeof document === 'undefined') return;
    const d = new Date();
    d.setTime(d.getTime() + (t * 86400 * 1000));
    const expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires;
  },

  _getCookie(name) {
    if (typeof document === 'undefined') return null;
    const reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
    const arr = document.cookie.match(reg);
    if (arr) return arr[2];
    return null;
  },
};

// 表單欄位記憶：以 pageId 為 namespace，把表單欄位序列化存入 localStorage。
const FORM_STATE_PREFIX = 'pc.formState.';

export function saveFormState(pageId, fields) {
  if (!pageId || !fields) return;
  try {
    persistentStorage.setItem(FORM_STATE_PREFIX + pageId, JSON.stringify(fields), 365);
  } catch (e) {
    console.warn('saveFormState 失敗:', e);
  }
}

export function loadFormState(pageId) {
  if (!pageId) return null;
  try {
    const s = persistentStorage.getItem(FORM_STATE_PREFIX + pageId);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    console.warn('loadFormState 失敗:', e);
    return null;
  }
}
