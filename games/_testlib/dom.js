/* 超軽量 DOM シム — ブラウザ無しでゲームの UI 配線をスモークテストするための最小実装。
 * 完全な DOM ではなく「例外を出さずに動くか」「ハンドラ配線が正しいか」を確認する用途。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeStyle() {
  const s = {};
  Object.defineProperty(s, 'setProperty', { value: function (k, v) { s[k] = v; }, enumerable: false });
  Object.defineProperty(s, 'getPropertyValue', { value: function (k) { return s[k]; }, enumerable: false });
  return s;
}

function ctx2d() {
  return new Proxy({}, {
    get(t, p) { if (p in t) return t[p]; return () => {}; },
    set(t, p, v) { t[p] = v; return true; },
  });
}

class El {
  constructor(doc, tag) {
    this._doc = doc; this.tagName = (tag || 'div').toUpperCase();
    this.children = []; this.style = makeStyle();
    this._cls = new Set(); this._text = ''; this._html = '';
    this.onclick = null; this.dataset = {}; this.parentNode = null;
    this.width = 0; this.height = 0; this.value = '';
  }
  get classList() {
    const s = this._cls;
    return {
      add: (...c) => c.forEach(x => x && s.add(x)),
      remove: (...c) => c.forEach(x => s.delete(x)),
      contains: c => s.has(c),
      toggle: c => { s.has(c) ? s.delete(c) : s.add(c); },
    };
  }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  set id(v) { this._id = v; if (this._doc) this._doc._reg[v] = this; }
  get id() { return this._id; }
  set textContent(v) { this._text = v == null ? '' : String(v); this.children = []; }
  get textContent() { return this._text; }
  set innerHTML(v) { this._html = v == null ? '' : String(v); this.children = []; }
  get innerHTML() { return this._html; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  insertBefore(c) { this.children.unshift(c); return c; }
  querySelector() { return new El(this._doc, 'div'); }
  querySelectorAll() { return []; }
  getContext() { return ctx2d(); }
  getBoundingClientRect() { return { width: 320, height: 480, left: 0, top: 0, right: 320, bottom: 480 }; }
  get offsetWidth() { return 0; }
  get offsetHeight() { return 0; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k]; }
  focus() {}
  click() { if (typeof this.onclick === 'function') this.onclick({ preventDefault() {}, stopPropagation() {} }); }
}

function makeDocument() {
  const doc = { _reg: {} };
  doc.createElement = tag => new El(doc, tag);
  doc.createElementNS = (ns, tag) => new El(doc, tag);
  doc.getElementById = id => {
    if (!doc._reg[id]) { const e = new El(doc); e._id = id; doc._reg[id] = e; }
    return doc._reg[id];
  };
  doc.querySelector = () => new El(doc, 'div');
  doc.querySelectorAll = () => [];
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  doc.body = new El(doc, 'body');
  doc.documentElement = new El(doc, 'html');
  return doc;
}

function makeContext() {
  const intervals = [];
  const timeouts = [];
  const sandbox = {};
  sandbox.console = console;
  sandbox.Math = Math; sandbox.JSON = JSON; sandbox.Date = Date;
  sandbox.parseInt = parseInt; sandbox.parseFloat = parseFloat;
  sandbox.isNaN = isNaN; sandbox.Object = Object; sandbox.Array = Array; sandbox.String = String;
  sandbox.Number = Number; sandbox.Boolean = Boolean; sandbox.Set = Set; sandbox.Map = Map;
  sandbox.document = makeDocument();
  const store = {};
  sandbox.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
  sandbox.navigator = { vibrate: () => {}, userAgent: 'node-test' };
  sandbox.requestAnimationFrame = () => 0;
  sandbox.cancelAnimationFrame = () => {};
  sandbox.devicePixelRatio = 1; sandbox.innerWidth = 375; sandbox.innerHeight = 667;
  sandbox.AudioContext = function () { return ctx2d(); };
  sandbox.webkitAudioContext = sandbox.AudioContext;
  sandbox.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  sandbox.alert = () => {}; sandbox.confirm = () => true;
  sandbox.addEventListener = () => {}; sandbox.removeEventListener = () => {};
  sandbox.setInterval = (fn) => { intervals.push(fn); return 1000 + intervals.length - 1; };
  sandbox.clearInterval = id => { const i = id - 1000; if (intervals[i]) intervals[i] = null; };
  sandbox.setTimeout = (fn) => { timeouts.push(fn); return 5000 + timeouts.length - 1; };
  sandbox.clearTimeout = id => { const i = id - 5000; if (timeouts[i]) timeouts[i] = null; };
  vm.createContext(sandbox);
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return {
    ctx: sandbox,
    run: code => vm.runInContext(code, sandbox),
    eval: expr => vm.runInContext(expr, sandbox),
    fireIntervals: (n) => { for (let k = 0; k < (n || 1); k++) intervals.forEach(fn => { if (fn) fn(); }); },
    fireTimeouts: () => { const t = timeouts.splice(0); t.forEach(fn => { if (fn) fn(); }); },
  };
}

// HTML を読み、<script src> と インライン <script> を順に context で実行
function loadHtml(htmlPath) {
  const harness = makeContext();
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dir = path.dirname(htmlPath);
  const re = /<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) {
      const code = fs.readFileSync(path.join(dir, m[1]), 'utf8');
      harness.run(code);
    } else if (m[2].trim()) {
      harness.run(m[2]);
    }
  }
  return harness;
}

module.exports = { makeContext, loadHtml, El };
