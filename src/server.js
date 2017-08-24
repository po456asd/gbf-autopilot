import http from "http";
import axios from "axios";
import shortid from "shortid";
import SocketIO from "socket.io";
import Express from "express";
import bodyParser from "body-parser";
import forEach from "lodash/forEach";
import assign from "lodash/assign";

import Worker from "./server/Worker";
import WorkerManager from "./server/WorkerManager";

import RaidQueue from "./server/extensions/RaidQueue";
import Chatbot from "./server/extensions/Chatbot";
import Logger from "./lib/Logger";

export default class Server {
  constructor(initConfig, rootDir, configHandler, extensions) {
    this.config = initConfig;
    this.rootDir = rootDir;
    this.logger = Logger(initConfig);
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
    this.logger.debug(`Client '${socket.id}' connected!`);
  }

  getAction(socket, id) {
    socket = this.sockets[socket.id];
    return socket ? socket.actions[id] : null;
  }

  onSocketStart(socket) {
    if (this.running) return;

    this.logger.debug("Socket '" + socket.id + "' started");
    const errorHandler = (err) => {
      this.logger.error(err);
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
        this.logger.debug("Bot reaches maximum time. Disconnecting...");
        this.stopSocket(socket.id);
      }, botTimeout * 60 * 1000);

      this.sockets[socket.id] = {
        socket, worker, timer,
        actions: {}
      };
      this.makeRequest("start").then(() => {
        this.running = true;
        worker.start(scenario);
      }, errorHandler);
    }, errorHandler);
  }

  onSocketStop() {
    this.stop();
  }

  onAction(socket, data, callback) {
    const action = this.getAction(socket, data.id);
    // silently fail
    if (!action) return;
    if (this.config.Log.DebugSocket) {
      this.logger.debug("Socket: RECV", data);
    }
    callback(action, data.payload);
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
    this.logger.debug(`Client '${socket.id}' disconnected!`);
    this.makeRequest("stop").then(::this.stop, (err) => {
      this.logger.error(err);
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

      const data = {
        id, payload, timeout,
        action: actionName, 
        type: "request"
      };

      if (this.config.Log.DebugSocket) {
        this.logger.debug("Socket: SEND", data);
      }
      realSocket.emit("action", data);
    });
  }

  stopSocket(id) {
    if (!this.sockets[id]) return;
    this.logger.debug("Stopping socket '" + id + "'");
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
      this.logger.info("Started listening on localhost:" + this.port);
    });
    return this;
  }

  stop() {
    if (!this.running) return;
    forEach(this.sockets, (socket, id) => {
      this.stopSocket(id);
    });
    this.running = false;
    this.sockets = {};
    return this;
  }
}
