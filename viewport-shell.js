/**
 * 在 Cocos index.js 读取 GameCanvas 尺寸之前铺满视口。
 * 微信内置浏览器横屏时常报告错误的 innerWidth/innerHeight，导致 canvas 只有中间一小块。
 */
(function (global) {
  'use strict';

  var ORIENTATION_RETRY_MS = [0, 80, 200, 400, 800];
  var orientationTimers = [];

  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent || '');
  }

  function readOrientationAngle() {
    var screen = global.screen;
    if (screen && screen.orientation && typeof screen.orientation.angle === 'number') {
      return screen.orientation.angle;
    }
    if (typeof global.orientation === 'number') {
      return global.orientation;
    }
    return 0;
  }

  function isLandscapeAngle(angle) {
    return angle === 90 || angle === -90 || angle === 270;
  }

  function isMobileDevice() {
    var ua = navigator.userAgent || '';
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return true;
    }
    if (/iPad/i.test(ua)) {
      return true;
    }
    return navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua);
  }

  /** 设备物理方向，不用 resolveFrameSize 的微信横屏修正结果 */
  function isPortraitOrientation() {
    var screenObj = global.screen;
    if (screenObj && screenObj.orientation && screenObj.orientation.type) {
      return screenObj.orientation.type.indexOf('portrait') === 0;
    }

    var angle = readOrientationAngle();
    if (angle === 0 || angle === 180) {
      return true;
    }
    if (isLandscapeAngle(angle)) {
      return false;
    }

    var w = global.innerWidth || document.documentElement.clientWidth || 0;
    var h = global.innerHeight || document.documentElement.clientHeight || 0;
    return h >= w;
  }

  function syncPortraitHint() {
    var overlay = document.getElementById('PortraitHint');
    if (!overlay) {
      return;
    }

    var show = isMobileDevice() && isPortraitOrientation();
    overlay.hidden = !show;

    var gameDiv = document.getElementById('GameDiv');
    if (gameDiv) {
      gameDiv.style.visibility = show ? 'hidden' : 'visible';
    }
  }

  /** 综合 document / window / screen，修正微信横屏宽高颠倒 */
  function resolveFrameSize() {
    var doc = document.documentElement;
    var vv = global.visualViewport;

    var values = [];
    function push(n) {
      if (typeof n === 'number' && n > 0 && isFinite(n)) {
        values.push(n);
      }
    }

    push(vv && vv.width);
    push(vv && vv.height);
    push(doc.clientWidth);
    push(doc.clientHeight);
    push(global.innerWidth);
    push(global.innerHeight);
    if (global.screen) {
      push(global.screen.width);
      push(global.screen.height);
    }

    if (values.length === 0) {
      return { width: 1280, height: 720 };
    }

    var maxDim = Math.max.apply(null, values);
    var minDim = Math.min.apply(null, values);
    var width = doc.clientWidth || global.innerWidth || maxDim;
    var height = doc.clientHeight || global.innerHeight || minDim;

    var angle = readOrientationAngle();
    var landscape = isLandscapeAngle(angle) || maxDim > minDim * 1.15;

    if (landscape && width < height) {
      width = maxDim;
      height = minDim;
    } else if (!landscape && width > height) {
      width = minDim;
      height = maxDim;
    }

    if (isWeChat()) {
      var docW = doc.clientWidth;
      var docH = doc.clientHeight;
      if (docW > 0 && docH > 0) {
        if (landscape && docW < docH) {
          width = Math.max(docW, docH);
          height = Math.min(docW, docH);
        } else if (!landscape && docW > docH) {
          width = Math.min(docW, docH);
          height = Math.max(docW, docH);
        } else {
          width = docW;
          height = docH;
        }
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  function setImportant(el, prop, value) {
    el.style.setProperty(prop, value, 'important');
  }

  function syncGameViewportShell() {
    var size = resolveFrameSize();
    var html = document.documentElement;
    var body = document.body;
    if (!body) {
      return size;
    }

    html.style.width = '100%';
    html.style.height = '100%';
    setImportant(html, 'width', '100%');
    setImportant(html, 'height', '100%');

    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.display = 'block';
    setImportant(body, 'width', '100%');
    setImportant(body, 'height', '100%');

    var ids = ['GameDiv', 'Cocos3dGameContainer', 'GameCanvas'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) {
        continue;
      }
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.margin = '0';
      el.style.padding = '0';
      setImportant(el, 'width', size.width + 'px');
      setImportant(el, 'height', size.height + 'px');
      if (ids[i] === 'GameCanvas') {
        el.style.display = 'block';
      }
    }

    syncPortraitHint();
    return size;
  }

  function clearOrientationTimers() {
    for (var i = 0; i < orientationTimers.length; i++) {
      clearTimeout(orientationTimers[i]);
    }
    orientationTimers = [];
  }

  function scheduleOrientationRetries() {
    clearOrientationTimers();
    syncPortraitHint();
    for (var i = 0; i < ORIENTATION_RETRY_MS.length; i++) {
      orientationTimers.push(setTimeout(syncGameViewportShell, ORIENTATION_RETRY_MS[i]));
    }
  }

  function bindEvents() {
    global.addEventListener('orientationchange', scheduleOrientationRetries);
    global.addEventListener('resize', syncGameViewportShell);
    global.addEventListener('pageshow', scheduleOrientationRetries);
    if (global.visualViewport) {
      global.visualViewport.addEventListener('resize', syncGameViewportShell);
      global.visualViewport.addEventListener('scroll', syncGameViewportShell);
    }
    document.addEventListener('WeixinJSBridgeReady', scheduleOrientationRetries, false);
    document.addEventListener(
      'touchmove',
      function (ev) {
        var t = ev.target;
        if (t === document.body || t === document.documentElement) {
          ev.preventDefault();
        }
      },
      { passive: false },
    );
  }

  /** iPhone 横屏刘海 / Home 条：读取 CSS env(safe-area-inset-*) */
  function resolveSafeAreaInsets() {
    var doc = document.documentElement;
    var style = global.getComputedStyle(doc);
    function readCssVar(name) {
      var raw = style.getPropertyValue(name).trim();
      var v = parseFloat(raw);
      return isFinite(v) && v > 0 ? v : 0;
    }

    var top = readCssVar('--safe-top');
    var right = readCssVar('--safe-right');
    var bottom = readCssVar('--safe-bottom');
    var left = readCssVar('--safe-left');

    var vv = global.visualViewport;
    if (vv) {
      if (left <= 0 && vv.offsetLeft > 0) {
        left = vv.offsetLeft;
      }
      if (top <= 0 && vv.offsetTop > 0) {
        top = vv.offsetTop;
      }
      if (right <= 0 && vv.width > 0 && doc.clientWidth > vv.width + vv.offsetLeft) {
        right = doc.clientWidth - vv.width - vv.offsetLeft;
      }
      if (bottom <= 0 && vv.height > 0 && doc.clientHeight > vv.height + vv.offsetTop) {
        bottom = doc.clientHeight - vv.height - vv.offsetTop;
      }
    }

    return {
      top: Math.round(top),
      right: Math.round(right),
      bottom: Math.round(bottom),
      left: Math.round(left),
    };
  }

  global.__syncGameViewportShell = syncGameViewportShell;
  global.__resolveGameFrameSize = resolveFrameSize;
  global.__resolveGameSafeAreaInsets = resolveSafeAreaInsets;
  global.__syncPortraitHint = syncPortraitHint;

  syncGameViewportShell();
  syncPortraitHint();
  bindEvents();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncGameViewportShell);
  }
})(window);
