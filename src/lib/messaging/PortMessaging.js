import _ from "lodash";
import shortid from "shortid";

export default class PortMessaging {
  constructor() {
    this.connected = false;
    this.messageQueue = [];
    this.unsentMessages = [];
    this.pendingMessages = {};
    this.onRequest = _.noop;
    this.middlewares = {
      receive: [],
      send: []
    };
    this.listeners = {
      onMessage: ::this.onMessage,
      onDisconnect: ::this.onDisconnect
    };
  }

  isConnected() {
    return this.connected && this.port;
  }

  setup(port, setupListeners) {
    this.port = port;
    this.connected = true;
    setupListeners(port, this.listeners);
    this.resendMessages();
  }

  changePort(newPort, setupListeners, doDisconnect, removeListeners) {
    doDisconnect(this.port);
    (removeListeners || _.noop)(this.port, this.listeners);
    this.setup(newPort, setupListeners);
  }

  middleware(type, middleware) {
    if (_.isArray(middleware)) {
      _.each(middleware, ::this.middleware);
      return;
    }
    this.middlewares[type].push(middleware);
  }

  runMiddlewares(type, message) {
    return new Promise((resolve, reject) => {
      // go through the middlewares
      const next = (nextMessage, index) => {
        if (index >= this.middlewares[type].length) {
          resolve(nextMessage);
          return;
        }
        this.middlewares[type][index](nextMessage, (anotherMessage) => {
          next(anotherMessage, ++index);
        }, reject);
      };
      next(message, 0);
    });
  }

  onMessage(originalMessage) {
    this.runMiddlewares("receive", originalMessage).then((message) => {
      if (!message.id) return;
      if (message.type == "request") {
        this.onRequest.call(this, message, (response, success) => {
          this.sendResponse(message.id, message.action, response, success);
        });
      } else if (message.type == "response") {
        this.dequeueMessage(message.id, message.payload, message.success);
      }
    }, ::console.error);
  }

  onDisconnect() {
    this.connected = false;
  }

  queueMessage(message, timeout) {
    return new Promise((resolve, reject) => {
      const id = shortid.generate();
      message.id = id;
      this.messageQueue.push(id);
      this.pendingMessages[id] = {message, resolve, reject};
      this.sendMessage(message);

      if (_.isNumber(timeout) && timeout > 0) {
        setTimeout(() => {
          this.dequeueMessage(id, new Error("Timed out!"), false);
        }, timeout);
      }
    });
  }

  dequeueMessage(id, result, success) {
    const pending = this.pendingMessages[id];
    if (!pending) return;
    const index = this.messageQueue.indexOf(pending);
    if (index >= 0) {
      this.messageQueue.splice(index, 1);
    }
    delete this.pendingMessages[id];
    if (success) {
      pending.resolve(result);
    } else {
      pending.reject(result);
    }
  }

  resendMessages() {
    _.each(this.messageQueue, (id) => {
      const pending = this.pendingMessages[id];
      if (!pending) return;
      this.sendMessage(pending.message);
    });
    while (this.unsentMessages.length > 0) {
      const message = this.unsentMessages.pop();
      this.sendMessage(message);
    }
  }

  sendRequest(action, payload, timeout) {
    const message = {action, payload, type: "request", timeout};
    return this.queueMessage(message, timeout);
  }

  sendResponse(id, action, payload, success) {
    this.sendMessage({
      id, action, payload,
      type: "response",
      success: success !== false
    });
  }

  sendMessage(originalMessage) {
    if (!this.isConnected()) {
      this.unsentMessages.push(originalMessage);
      return;
    }
    this.runMiddlewares("send", originalMessage).then((message) => {
      this.port.postMessage(message);
    }, ::console.error);
  }
}
