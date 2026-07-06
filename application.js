System.register([], function (_export, _context) {
  "use strict";

  var cc, Application;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  function syncShellAndCanvas() {
    if (typeof window.__syncGameViewportShell === 'function') {
      window.__syncGameViewportShell();
    }
    if (typeof window.__syncPortraitHint === 'function') {
      window.__syncPortraitHint();
    }
    var canvas = document.getElementById('GameCanvas');
    if (!canvas) {
      return;
    }
    var frame = typeof window.__resolveGameFrameSize === 'function'
      ? window.__resolveGameFrameSize()
      : { width: canvas.clientWidth, height: canvas.clientHeight };
    if (frame.width > 0 && frame.height > 0) {
      canvas.width = frame.width;
      canvas.height = frame.height;
    }
  }

  return {
    setters: [],
    execute: function () {
      _export("Application", Application = /*#__PURE__*/function () {
        function Application() {
          _classCallCheck(this, Application);

          var buildTag = typeof window !== 'undefined' && window.__CLIENT_BUILD__
            ? window.__CLIENT_BUILD__
            : String(Date.now());
          this.settingsPath = 'src/settings.json?v=' + (typeof window !== 'undefined' && window.__CLIENT_BUILD__ ? window.__CLIENT_BUILD__ : String(Date.now()));
          this.showFPS = false;
        }

        _createClass(Application, [{
          key: "init",
          value: function init(engine) {
            cc = engine;
            cc.game.onPostBaseInitDelegate.add(this.onPostInitBase.bind(this));
            cc.game.onPostSubsystemInitDelegate.add(this.onPostSystemInit.bind(this));
          }
        }, {
          key: "onPostInitBase",
          value: function onPostInitBase() {
            syncShellAndCanvas();
            cc.view.resizeWithBrowserSize(true);
            cc.view.setDesignResolutionSize(
              1280,
              720,
              cc.ResolutionPolicy.FIXED_HEIGHT,
            );
          }
        }, {
          key: "onPostSystemInit",
          value: function onPostSystemInit() {
            syncShellAndCanvas();
            cc.view.resizeWithBrowserSize(true);
          }
        }, {
          key: "start",
          value: function start() {
            return cc.game.init({
              debugMode: false ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
              settingsPath: this.settingsPath,
              overrideSettings: {
                profiling: {
                  showFPS: this.showFPS
                }
              }
            }).then(function () {
              return cc.game.run();
            });
          }
        }]);

        return Application;
      }());
    }
  };
});
