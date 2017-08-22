import {actions} from "./contentscript/actions";
import external from "./contentscript/external";
import PortMessaging from "./lib/messaging/PortMessaging";
import shortid from "shortid";

const token = shortid.generate();
const channel = new MessageChannel();
const port = new PortMessaging();
port.middleware("receive", (evt, next, fail) => {
  const message = evt.data;
  if (message.token !== token) {
    fail(new Error("Invalid token!"));
  } else {
    next(message);
  }
});
port.middleware("send", (message, next) => {
  message.token = token;
  next(message);
});
port.setup(channel.port1, (port, listeners) => {
  port.onmessage = listeners.onMessage;
});
const requestExternal = ::port.sendRequest;

const handleRequest = (request, sendResponse) => {
  var rejected = false;
  const {id, action, payload, timeout} = request;
  const handler = actions[action];
  const done = (payload) => {
    sendResponse({id, type: "response", action, payload, success: true});
  };
  const fail = (payload) => {
    sendResponse({id, type: "response", action, payload, success: false});
  };
  const retry = (callback, timeout) => {
    if (!rejected) {
      setTimeout(callback, timeout || 1000 / 125);
    } else {
      fail("Rejected!");
    }
  };

  var result;
  if (handler) {
    result = handler.call({
      actions, requestExternal
    }, payload, done, fail, retry);
  } else {
    fail(actions.error(action));
    return;
  }

  if (result !== undefined) {
    done(result);
  } else {
    setTimeout(() => {
      rejected = true;
      fail("Timed out!");
    }, timeout);
  }
};

const injectScript = (constructor, callback) => {
  const parent = (document.head || document.documentElement);
  const js = "(" + constructor.toString() + ")(this, " + JSON.stringify(token) + ")";
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.innerHTML = js;
  parent.appendChild(script);
  callback(token);

  if (process.env.NODE_ENV === "production") {
    window.setTimeout(() => {
      parent.removeChild(script);
    }, 1);
  }
};

const extensionPort = new PortMessaging();
extensionPort.setup(chrome.runtime.connect(), (port, listeners) => {
  port.onMessage.addListener(listeners.onMessage);
  port.onDisconnect.addListener(listeners.onDisconnect);
});
const requestExtension = ::extensionPort.sendRequest;
extensionPort.onRequest = (request) => {
  handleRequest(request, (response) => {
    extensionPort.sendMessage(response);
  });
};

injectScript(external, (token) => {
  window.postMessage({token}, "*", [channel.port2]);
});

const portSetup = () => {
  requestExtension("LOADED").then(() => {
    console.log("Connected to extension");
  }, ::console.error);
  window.removeEventListener("load", portSetup);
};

window.addEventListener("load", portSetup);
