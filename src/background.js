import ViramateApi from "./background/ViramateApi";
import LiveReload from "./background/LiveReload";
import io from "socket.io-client";

if (process.env.NODE_ENV !== "production") {
  LiveReload();
}

const viramateApi = new ViramateApi(document.querySelector("#viramate_api"));
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
    if (action == "viramate") {
      viramateApi.sendApiRequest(payload, id).then((result) => {
        socket.emit("action", {id, action, payload: result});
      }, (result) => {
        socket.emit("action.fail", {id, action, payload: result});
      });
      return;
    }

    var rejected = false;
    function sendMessage() {
      if (rejected) return;
      chrome.tabs.sendMessage(tab.id, {action, payload, timeout}, (data) => {
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
      sendResponse(new Error("No tab loaded!"));
      return;
    }
    startIo(currentTab);
    break;
  case "STOP":
    if (!socket) {
      sendResponse(new Error("Socket not connected!"));
      return;
    }
    socket.disconnect();
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
