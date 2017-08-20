import http from "http";
import axios from "axios";
import shortid from "shortid";
import SocketIO from "socket.io";
import Express from "express";
import bodyParser from "body-parser";
import forEach from "lodash/forEach";
import assign from "lodash/assign";

import packer from "~/lib/messaging/packer";
import Worker from "./server/Worker";
import WorkerManager from "./server/WorkerManager";

import RaidQueue from "./server/extensions/RaidQueue";
import Chatbot from "./server/extensions/Chatbot";

export default class Server {
  constructor(initConfig, rootDir, configHandler, extensions) {
    this.config = initConfig;
    this.rootDir = rootDir;
    this.configHandler = () => {
      return new Promise((resolve, reject) => {
        configHandler.apply(this).then((result) => {
          this.refreshConfig(result.config);
          resolve(result);
        }, reject);
      });
    };
    this.port = process.env.PORT || Number(initConfig.Server.ListenerPort);
    this.refreshConfig(initConfig);

    this.extensions = assign(extensions || {}, {
      raidQueue: new RaidQueue(),
      chatbot: new Chatbot()
    });
    this.listeners = {
      "start": ::this.onSocketStart,
      "stop": ::this.onSocketStop,
      "action": ::this.onActionSuccess,
      "action.fail": ::this.onActionFail,
      "disconnect": ::this.onDisconnect
    };
    this.sockets = {};

    this.running = false;
    this.app = Express();
    this.server = http.Server(this.app);
    this.io = SocketIO(this.server);
    this.doSetup();
  }

  doSetup() {
    this.setupExpress(this.app);
    this.setupSocket(this.io);
    forEach(this.extensions, (extension) => {
      extension.onSetup(this);
    });
  }

  setupExpress(app) {
    app.use(bodyParser.text());
    app.post("/stop", (req, res) => {
      this.stop();
      res.end();
    });
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

  refreshConfig(config) {
    this.config = config;
    this.controllerPort = Number(config.Server.ControllerPort);
    this.timeout = Number(config.Server.ActionTimeoutInMs);
  }

  onConnect(socket) {
    console.log(`Client '${socket.id}' connected!`);
  }

  getAction(socket, id) {
    socket = this.sockets[socket.id];
    return socket ? socket.actions[id] : null;
  }

  onSocketStart(socket) {
    if (!this.running) this.running = true;

    const errorHandler = (err) => {
      console.error(err);
      socket.disconnect();
    };

    this.configHandler().then(({config, scenario}) => {
      this.refreshConfig(config);

      const botTimeout = Number(config.Server.BotTimeoutInMins);
      const manager = new WorkerManager(this, socket);
      const worker = new Worker(this, config, (action, payload, timeout) => {
        return this.sendAction(socket, action, payload, timeout);
      }, manager);
      const timer = setTimeout(() => {
        if (!this.sockets[socket.id]) return;
        console.log("Bot reaches maximum time. Disconnecting...");
        this.stopSocket(socket.id);
      }, botTimeout * 60 * 1000);

      this.sockets[socket.id] = {
        socket, worker, timer,
        actions: {}
      };
      this.makeRequest("start").then(() => {
        worker.start(scenario);
      }, errorHandler);
    }, errorHandler);
  }

  onSocketStop(socket) {
    this.stopSocket(socket.id);
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
    if (this.running) this.running = false;

    console.log(`Client '${socket.id}' disconnected!`);
    this.makeRequest("stop").then(() => {
      if (this.sockets[socket.id]) {
        this.stopSocket(socket.id);
      }
    }, (err) => {
      console.error(err);
    });
  }

  sendAction(realSocket, actionName, payload, timeout) {
    timeout = timeout || this.timeout;
    return new Promise((resolve, reject) => {
      var resolved = false;
      const id = shortid.generate();
      const json = JSON.stringify(payload);
      const expression = `${actionName}(${json})`;
      const socket = this.sockets[realSocket.id];
      if (!socket) {
        reject(new Error("Socket not found!"));
        return;
      }

      const actions = socket.actions;
      const done = () => {
        resolved = true;
        clearTimeout(actions[id].timer);
        delete actions[id];
      };

      actions[id] = {
        success: (payload) => {
          resolve(payload);
          done();
        },
        fail: (payload) => {
          reject(payload);
          done();
        },
        timer: timeout > 0 ? setTimeout(() => {
          if (!resolved) {
            reject(new Error(`Action ${expression} timed out!`));
          }
          done();
        }, timeout) : 0
      };

      const data = packer(actionName, payload);
      data.id = id;
      data.timeout = timeout;
      data.type = "request";

      console.log(`Socket: ${expression}`);
      realSocket.emit("action", data);
    });
  }

  stopSocket(id) {
    if (!this.sockets[id]) return;
    const {socket, worker, timer, actions} = this.sockets[id];
    delete this.sockets[id];
    forEach(actions, ({timer}) => {
      clearTimeout(timer);
    });
    clearTimeout(timer);
    socket.emit("stop");
    worker.stop();
    return this;
  }

  listen() {
    this.server.listen(this.port, "localhost", () => {
      console.log("Started listening on localhost:" + this.port);
    });
    return this;
  }

  stop() {
    if (!this.running) return;
    console.log("Stopping...");
    forEach(this.sockets, (socket, id) => {
      this.stopSocket(id);
    });
    this.running = false;
    this.sockets = {};
    return this;
  }
}
