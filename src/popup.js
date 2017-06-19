window.addEventListener("load", () => {
  const $ = function(selector) {
    const self = {};
    const el = document.querySelector(selector);
    self.on = (eventName, listener) => {
      el.addEventListener(eventName, listener);
    };
    self.css = (prop, value) => {
      el.style[prop] = value;
    };
    return self;
  };
  $("#btn_start").on("click", () => {
    chrome.runtime.sendMessage("START");
    $("#btn_start").css("display", "none");
    $("#btn_stop").css("display", "inline");
    window.close();
  });
  $("#btn_stop").on("click", () => {
    chrome.runtime.sendMessage("STOP");
    $("#btn_start").css("display", "inline");
    $("#btn_stop").css("display", "none");
  });
  chrome.runtime.sendMessage("CHECK", (running) => {
    if (running) {
      $("#btn_start").css("display", "none");
    } else {
      $("#btn_stop").css("display", "none");
    }
  });
});

chrome.runtime.onMessage.addListener((request) => {
  console.log(request);
});
