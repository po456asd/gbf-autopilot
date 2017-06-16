import http from "http";
import shortid from "shortid";
import SocketIO from "socket.io";
import forEach from "lodash/forEach";

import packer from "~/lib/messaging/packer";
import EventRun from "./server/EventRun";

export default class Server {
  constructor(config, scenario) {
    this.config = config.server;
    this.scenario = scenario;
    this.port = process.env.PORT || Number(this.config.listener_port);
    this.controllerPort = Number(this.config.controller_port);
    this.timeout = Number(this.config.action_timeout_in_ms);
    this.listeners = {
      "action": ::this.onAction,
      "disconnect": ::this.onDisconnect
    };
    this.callbacks = {};

    this.server = http.createServer();
    this.io = SocketIO(this.server);
    this.io.on("connection", (socket) => {
      this.onConnect(socket);
      this.attachListeners(socket);
    });
  }

  attachListeners(socket) {
    forEach(this.listeners, (listener, name) => {
      socket.on(name, (msg) => listener(socket, msg));
    });
  }

  onConnect(socket) {
    console.log(`Client '${socket.id}' connected!`);
    new EventRun(this.controllerPort, (action, payload, timeout) => {
      return this.sendAction(socket, action, payload, timeout);
    }).start(this.scenario);
  }

  onAction(socket, {id, payload}) {
    const callback = this.callbacks[id];
    if (!callback) {
      // silently fail
      return;
    }
    delete this.callbacks[id];
    callback(payload);
  }

  onDisconnect(socket) {
    console.log(`Client '${socket.id}' disconnected!`);
  }

  sendAction(socket, action, payload, timeout) {
    timeout = timeout || this.timeout;
    return new Promise((resolve, reject) => {
      const id = shortid.generate();
      const expression = `'${id}' ${action}(${payload})`;
      const shorted = socket.id.substr(0, 5);

      var resolved = false;
      this.callbacks[id] = (payload) => {
        resolved = true;
        resolve(payload);
      };
      console.log(`${shorted}: ${expression} (${timeout}ms)`);

      const data = packer(action, payload);
      data.id = id;
      data.timeout = timeout;
      socket.emit("action", data);

      setTimeout(() => {
        if (resolved) return;
        delete this.callbacks[id];
        reject(new Error(`Action ${expression} timed out!`));
      }, timeout);
    });
  }

  listen() {
    this.server.listen(this.port, "localhost", () => {
      console.log("Started listening on localhost:" + this.port);
    });
    return this;
  }
}
