import liveReload from "./background/liveReload";
import io from "socket.io-client";

liveReload();

const serverUrl = window.serverUrl || "http://localhost:49544/";
const subscribers = [];
const broadcast = (payload) => {
  subscribers.forEach((tabId) => {
    chrome.tabs.sendMessage(tabId, payload);
  });
};

var socket;
var running = false;
function startIo(tab) {
  if (running) {
    throw new Error("Socket already running!");
  }
  socket = io(serverUrl);
  socket.on("connect", () => {
    running = true;
    broadcast("START");
    console.log("Started socket");
  });
  socket.on("disconnect", () => {
    running = false;
    socket = null;
    broadcast("STOP");
    console.log("Stopped socket");
  });
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
    sendResponse(running);
    break;
  case "SUBSCRIBE":
    subscribers.push(sender.tab.id);
    break;
  case "UNSUBSCRIBE":
    subscribers.splice(subscribers.indexOf(sender.tab.id), 1);
    break;
  case "START":
    if (!currentTab) {
      throw new Error("No tab loaded!");
    }
    startIo(currentTab);
    sendResponse("OK");
    break;
  case "STOP":
    if (!socket) {
      throw new Error("Socket not connected!");
    }
    socket.disconnect();
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
