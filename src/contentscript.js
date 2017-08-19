import {actions} from "./contentscript/actions";
import external from "./contentscript/external";
import shortid from "shortid";

const token = shortid.generate();
const pendingMessages = {};
const channel = new MessageChannel();
const port = channel.port1;
const requestExternal = (action, payload) => {
  return new Promise((resolve, reject) => {
    const id = shortid.generate();
    const message = {
      id, token, action, payload,
      type: "request"
    };
    pendingMessages[id] = {resolve, reject, message};
    port.postMessage(message);
  });
};
port.onmessage = (evt) => {
  if (evt.data.token !== token) return;
  if (!evt.data.id) return;
  const {id, action, payload, success} = evt.data;
  const pending = pendingMessages[id];
  if (!pending) {
    return;
  } else if (success) {
    pending.resolve({action, payload});
  } else {
    pending.reject({action, payload});
  }
  delete pendingMessages[id];
};

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
      // respond with null result anyway
      fail();
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
      fail();
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

const extensionPort = chrome.runtime.connect();
const requestExtension = (action, payload) => {
  return new Promise((resolve, reject) => {
    const id = shortid.generate();
    pendingMessages[id] = {resolve, reject};
    extensionPort.postMessage({
      id, action, payload,
      type: "request"
    });
  });
};
extensionPort.onMessage.addListener((msg) => {
  if (msg.type == "request") {
    handleRequest(msg, (response) => {
      extensionPort.postMessage(response);
    });
  } else {
    const pending = pendingMessages[msg.id];
    const {id, payload, success} = msg;
    if (!pending) {
      return;
    } else if (success) {
      pending.resolve(payload);
    } else {
      pending.reject(payload);
    }
    delete pendingMessages[id];
  }
});

injectScript(external, (token) => {
  window.postMessage({token}, "*", [channel.port2]);
});

window.addEventListener("load", () => {
  requestExtension("LOADED");
  setTimeout(() => {
    port.postMessage("uwu");
  }, 1500);
});
