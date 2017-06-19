import liveReload from "./background/liveReload";
import io from "socket.io-client";

liveReload();

const serverUrl = window.serverUrl || "http://localhost:49544/";

var socket;
function startIo(tab) {
  if (socket) {
    socket.disconnect();
  }
  socket = io(serverUrl);
  socket.on("action", ({action, id, payload, timeout}) => {
    var rejected = false;
    function sendMessage() {
      if (rejected) return;
      console.log("SEND", id, {action, payload});
      chrome.tabs.sendMessage(tab.id, {action, payload, timeout}, (data) => {
        console.log("RECV", id, data);
        if (data == undefined && socket) {
          setTimeout(sendMessage, 500);
          return;
        }
        const {action, payload, success} = data;
        if (success) {
          socket.emit("action", {id, action, payload});
        } else {
          socket.emit("action.fail", {id, action, payload});
        }
      });
    }
    sendMessage();
    setTimeout(() => {
      rejected = true;
    }, timeout);
  });
}

var currentTab;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request) {
  case "CHECK":
    sendResponse(!!socket);
    break;
  case "START":
    if (!currentTab) {
      throw new Error("No tab loaded!");
    }
    startIo(currentTab);
    console.log("Started socket");
    sendResponse("OK");
    break;
  case "STOP":
    if (!socket) {
      throw new Error("Socket not connected!");
    }
    socket.disconnect();
    socket = null;
    console.log("Stopped socket");
    sendResponse("OK");
    break;
  case "LOADED":
    chrome.pageAction.show(sender.tab.id);
    currentTab = sender.tab;
    break;
  default:
    sendResponse("UNKNOWN");
    return;
  }
  sendResponse("OK");
});
