window.addEventListener("load", () => {
  const $ = function(selector) {
    const self = {};
    const el = document.querySelector(selector);
    self.on = function(eventName, listener) {
      el.addEventListener(eventName, listener);
    };
    return self;
  };
  $("#btn_start").on("click", () => {
    chrome.runtime.sendMessage("START");
  });
  $("#btn_stop").on("click", () => {
    chrome.runtime.sendMessage("STOP");
  });
});
