// Replaces Google's `google.script.run` so the same UI code talks to our Express server.
(function () {
  function runner() {
    var ok = function () {}, bad = function () {};
    var r = {
      withSuccessHandler: function (f) { ok = f; return r; },
      withFailureHandler: function (f) { bad = f; return r; },
      api: function (a, p, t) {
        fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: a, p: p, t: t }) })
          .then(function (x) { return x.json(); }).then(ok, bad);
      }
    };
    return r;
  }
  window.google = { script: { get run() { return runner(); } } };
})();
