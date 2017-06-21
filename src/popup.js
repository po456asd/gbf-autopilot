function $(selector) {
  const self = {};
  const el = document.querySelector(selector);
  self.on = (eventName, listener) => {
    el.addEventListener(eventName, listener);
  };
  self.css = (prop, value) => {
    el.style[prop] = value;
  };
  return self;
}

const state = {
  start() {
    $("#btn_start").css("display", "none");
    $("#btn_stop").css("display", "inline");
  },
  stop() {
    $("#btn_start").css("display", "inline");
    $("#btn_stop").css("display", "none");
  }
};

window.addEventListener("load", () => {
  $("#btn_start").on("click", () => {
    chrome.runtime.sendMessage("START");
    state.start();
    window.close();
  });
  $("#btn_stop").on("click", () => {
    chrome.runtime.sendMessage("STOP");
    state.stop();
  });
  chrome.runtime.sendMessage("CHECK", (running) => {
    running ? state.start() : state.stop();
  });
});

/*
chrome.runtime.onMessage.addListener((request) => {
  switch (request) {
  case "START":
    state.start();
    break;
  case "STOP":
    state.stop();
    break;
  default:
    console.log(request);
    break;
  }
});
*/
