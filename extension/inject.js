console.log("injected!");
window.addEventListener("battle.status", function(evt) {
  console.log(evt);
  window.postMessage({
    type: "battle.status",
    payload: window.stage
  }, "*");
});
