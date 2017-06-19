console.log("wut");
window.postMessage({
  type: "battle.status",
  payload: window.stage
}, "*");
