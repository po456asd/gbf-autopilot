import _ from "lodash";
import shortid from "shortid";
import ViramateApi from "./background/ViramateApi";
import LiveReload from "./background/LiveReload";
import io from "socket.io-client";

const log = (message) => {
  console.log("bg>", message);
};

if (process.env.NODE_ENV !== "production") {
  log("Extension running in development mode");
  LiveReload();
}

var pagePort;
var running = false;
const viramateApi = new ViramateApi(document.querySelector("#viramate_api"));
const serverUrl = window.serverUrl || "http://localhost:49544/";
const handleRequest = (request, sender, sendResponse, callbacks) => {
  switch (request.action) {
  case "CHECK":
    sendResponse(running);
    break;
  case "START":
    (callbacks.onStart || _.noop)();
    break;
  case "STOP":
    (callbacks.onStop || _.noop)();
    break;
  case "LOADED":
    chrome.pageAction.show(sender.tab.id);
    (callbacks.onLoad || _.noop)();
    break;
  default:
    sendResponse("UNKNOWN", false);
    return;
  }
  sendResponse("OK");
};

const ports = [];
const pendingMessages = {};
const broadcast = (action, payload) => {
  const id = shortid.generate();
  _.each(ports, (port) => {
    port.postMessage({
      id, action, payload,
      type: "broadcast"
    });
  });
};

var subscriber;
var startOnConnect = true;
const socket = io(serverUrl);
const startSocket = () => {
  if (running) {
    throw new Error("Socket already running!");
  }
  running = true;
  broadcast("START");
  if (!socket.connected) {
    startOnConnect = true;
    socket.connect();
  } else {
    socket.emit("start");
  }
  log("Started socket");
};
const stopSocket = () => {
  if (!running) {
    throw new Error("Socket not running!");
  }
  running = false;
  broadcast("STOP");
  socket.emit("stop");
  log("Stopped socket");
};
socket.on("connect", () => {
  if (startOnConnect) {
    socket.emit("start");
    startOnConnect = false;
  }
  log("Socket connected.");
});
socket.on("disconnect", () => {
  log("Socket disconnected. Reconnecting in 5 seconds...");
  setTimeout(() => {
    socket.connect();
  }, 5000);
});
socket.on("stop", stopSocket);
socket.on("action", (message) => {
  subscriber ? subscriber(message) : log(message);
});

const startAutopilot = () => {
  if (running) return;

  const sendMessage = (action, payload, timeout) => {
    return new Promise((resolve, reject) => {
      const id = shortid.generate();
      const message = {
        id, action, payload, timeout,
        type: "request"
      };
      pendingMessages[id] = {message, resolve, reject};
      pagePort.postMessage(message);

      setTimeout(() => {
        delete pendingMessages[id];
      }, timeout);
    });
  };

  subscriber = (message) => {
    const {action, id, payload, timeout} = message;

    if (action == "viramate") {
      viramateApi.sendApiRequest(payload, id).then((result) => {
        socket.emit("action", {id, action, payload: result, type: "response"});
      }, (result) => {
        socket.emit("action.fail", {id, action, payload: result, type: "response"});
      });
      return;
    }

    sendMessage(action, payload, timeout).then((response) => {
      const {action, payload} = response;
      socket.emit("action", {id, action, payload, type: "response"});
    }, (response) => {
      const {action, payload} = response;
      socket.emit("action.fail", {id, action, payload, type: "response"});
    });
  };

  startSocket();
};

const stopAutopilot = () => {
  if (!running) return;
  stopSocket();
};

const loadAutopilot = (port) => {
  if (pagePort) {
    log("Disconnecting previous page port");
    pagePort.disconnect();
  }
  pagePort = port;
  _.each(pendingMessages, (pending) => {
    port.sendMessage(pending.message);
  });
};

chrome.runtime.onConnect.addListener((port) => {
  ports.push(port);
  const sender = port.sender;
  port.onMessage.addListener((msg) => {
    const {id, action, type} = msg;
    if (type == "request") {
      handleRequest(msg, sender, (response, success) => {
        port.postMessage({
          id, action,
          type: "response",
          payload: response,
          success: success !== false
        });
      }, {
        onStart: startAutopilot,
        onStop: stopAutopilot,
        onLoad: () => loadAutopilot(port)
      });
    } else {
      const pending = pendingMessages[id];
      if (!pending) return;
      const success = msg.success;
      if (success) {
        pending.resolve(msg);
      } else {
        pending.reject(msg);
      }
      delete pendingMessages[id];
    }
  });
  port.onDisconnect.addListener(() => {
    ports.splice(ports.indexOf(port), 1);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleRequest(request, sender, sendResponse, {
    onStart: startAutopilot,
    onStop: stopAutopilot,
    onLoad: () => {
      throw new Error("Load event can only be triggered from a long-lived connection");
    }
  });
});
