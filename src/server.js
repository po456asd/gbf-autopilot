import http from "http";
import axios from "axios";
import shortid from "shortid";
import SocketIO from "socket.io";
import Express from "express";
import forEach from "lodash/forEach";

import packer from "~/lib/messaging/packer";
import EventRun from "./server/EventRun";

export default class Server {
  constructor(config, scenario) {
    this.config = config;
    this.scenario = scenario;
    this.port = process.env.PORT || Number(config.Server.ListenerPort);
    this.controllerPort = Number(config.Server.ControllerPort);
    this.timeout = Number(config.Server.ActionTimeoutInMs);
    this.botTimeout = Number(config.Server.BotTimeoutInMins);

    this.listeners = {
      "action": ::this.onActionSuccess,
      "action.fail": ::this.onActionFail,
      "disconnect": ::this.onDisconnect
    };
    this.sockets = {};

    this.app = Express();
    this.server = http.Server(this.app);
    this.io = SocketIO(this.server);
    this.setupExpress(this.app);
    this.setupSocket(this.io);
  }

  setupExpress(app) {
    app.post("/stop", ::this.stop);
  }

  setupSocket(io) {
    io.on("connection", (socket) => {
      forEach(this.listeners, (listener, name) => {
        socket.on(name, (msg) => listener(socket, msg));
      });
      this.onConnect(socket);
    });
  }

  makeRequest(path) {
    return axios.post(`http://localhost:${this.controllerPort}/${path}`);
  }

  onConnect(socket) {
    console.log(`Client '${socket.id}' connected!`);
    const runner = new EventRun(this.config, (action, payload, timeout) => {
      return this.sendAction(socket, action, payload, timeout);
    });
    const timer = setTimeout(() => {
      console.log("Bot reaches maximum time. Disconnecting...");
      this.stopSocket(socket.id);
    }, this.botTimeout * 60 * 1000);
    this.sockets[socket.id] = {
      socket, runner, timer,
      actions: {}
    };
    this.makeRequest("start").then(() => {
      runner.start(this.scenario);
    }, (err) => {
      console.error(err);
    });
  }

  getAction(socket, id) {
    return this.sockets[socket.id].actions[id];
  }

  onAction(socket, {id, payload}, callback) {
    const action = this.getAction(socket, id);
    // silently fail
    if (!action) return;
    callback(action, payload);
    clearTimeout(action.timer);
  }

  onActionSuccess(socket, data) {
    this.onAction(socket, data, (action, payload) => {
      action.success(payload);
    });
  }

  onActionFail(socket, data) {
    this.onAction(socket, data, (action, payload) => {
      action.fail(payload);
    });
  }

  onDisconnect(socket) {
    console.log(`Client '${socket.id}' disconnected!`);
    this.makeRequest("stop").then(() => {
      this.stopSocket(socket.id);
    }, (err) => {
      console.error(err);
    });
  }

  sendAction(socket, actionName, payload, timeout) {
    timeout = timeout || this.timeout;
    return new Promise((resolve, reject) => {
      const id = shortid.generate();
      const json = JSON.stringify(payload);
      const expression = `${actionName}(${json})`;
      const actions = this.sockets[socket.id].actions;
      const done = () => {
        delete actions[id];
      };

      var resolved = false;
      actions[id] = {
        success: (payload) => {
          resolved = true;
          resolve(payload);
          done();
        },
        fail: (payload) => {
          resolved = true;
          reject(payload);
          done();
        },
        timer: setTimeout(() => {
          if (!resolved) {
            reject(new Error(`Action ${expression} timed out!`));
          }
          done();
        }, timeout)
      };

      const data = packer(actionName, payload);
      data.id = id;
      data.timeout = timeout;

      console.log(`Socket: ${expression}`);
      socket.emit("action", data);
    });
  }

  stopSocket(id) {
    if (!this.sockets[id]) {
      throw new Error("Socket ID not found!");
    }
    const {socket, runner, timer, actions} = this.sockets[id];
    forEach(actions, ({timer}) => {
      clearTimeout(timer);
    });
    clearTimeout(timer);
    socket.disconnect();
    runner.stop();
    delete this.sockets[id];
    return this;
  }

  listen() {
    this.server.listen(this.port, "localhost", () => {
      console.log("Started listening on localhost:" + this.port);
    });
    return this;
  }

  stop() {
    console.log("Stopping...");
    Object.keys(this.sockets).forEach((key) => {
      this.stopSocket(key);
    });
    this.sockets = {};
    return this;
  }
}
