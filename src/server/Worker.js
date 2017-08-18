import _ from "lodash";
import actionClick from "./actions/click";
import actionSupport from "./actions/support";
import actionBattle from "./actions/battle";
import actionScenario from "./actions/scenario";
import actionRaid from "./actions/raid";
import actionChatbot from "./actions/chatbot";
import actionViramate from "./actions/viramate";

/* 
 * Every single action must return a Promise.
 * These promises will be handled by the scenario runner. 
 */
const actions = _.assign({
  "execute": function(action, payload) {
    return this.sendAction(action, payload);
  },
  "check": function(selector) {
    if (_.isFunction(selector)) {
      const callback = selector;
      return new Promise((resolve, reject) => {
        callback() ? resolve() : reject();
      });
    }
    return this.sendAction("element", selector);
  },
  "wait": function(selector, timeout) {
    return this.sendAction("element", {
      selector,
      retry: true
    }, timeout);
  },
  "run": function(callback) {
    return new Promise((resolve, reject) => {
      const result = callback.apply(this);
      if (result === false) {
        reject();
      } else {
        resolve(result);
      }
    });
  },
  "finish": function() {
    return new Promise((resolve) => {
      this.stop();
      resolve();
    });
  },
  "timeout": function(timeout) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout || 1);
    });
  },
}, 
actionScenario, actionClick,
actionSupport, actionBattle, actionRaid,
actionChatbot, actionViramate);

export default class Worker {
  constructor(server, config, sendAction, manager) {
    this.server = server;
    this.config = config;
    this.sendAction = sendAction;
    this.manager = manager;
    this.port = Number(config.Server.ControllerPort);
    this.actions = _.reduce(actions, (result, action, name) => {
      result[name] = action.bind(this);
      return result;
    }, {});
    this._scenario = null;
    this.running = false;
  }

  callAction(name, args) {
    if (arguments.length > 2) {
      args = _.values(arguments).slice(1);
    }
    if (!_.isArray(args)) {
      args = [args];
    }
    const handler = this.actions[name] || (() => {
      return this.sendAction.apply(this, [name].concat(args));
    });
    console.log("Action: " + name + "(" + args.map((val) => JSON.stringify(val)).join(", ") + ")");
    return handler.apply(this, args);
  }

  scenario(scenario) {
    if (scenario !== undefined) {
      this._scenario = scenario.slice();
      return this;
    } else {
      return this._scenario;
    }
  }

  runScenario(nextRun) {
    if (!this.running) return;

    const next = () => {
      setTimeout(() => this.runScenario(true), 1);
    };

    if (!nextRun) {
      this.scenario(this.initialScenario);
    }

    var current = this.scenario().shift();
    if (!current) {
      this.scenario(this.initialScenario);
      return next();
    }

    if (_.isString(current)) {
      current = [current];
    }
    var [action, args, success, error] = current;
    if (!_.isArray(args)) {
      args = [args];
    }

    const handleCallback = (callback) => {
      return (result) => {
        const cb = callback || (() => next());
        cb(next, this.actions, result);
      };
    };

    const successCallback = handleCallback(success);
    const errorCallback = handleCallback(error || ((next, actions, err) => {
      console.error(err);
    }));

    if (this.running) {
      this.callAction(action, args).then(successCallback, errorCallback);
    }
    return this;
  }

  start(initialScenario) {
    if (this.running) return;
    this.running = true;
    this.initialScenario = initialScenario;
    this.runScenario();
    return this;
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.manager.stop();
    return this;
  }
}
