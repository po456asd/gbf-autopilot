import _ from "lodash";
import actionClick from "./actions/click";
import actionSupport from "./actions/support";
import actionBattle from "./actions/battle";
import actionScenario from "./actions/scenario";

const actions = _.assign({
  "check": function(selector) {
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
  "timeout": function(timeout) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout || 1);
    });
  }
}, actionScenario, actionClick, actionSupport, actionBattle);

export default class EventRun {
  constructor(config, sendAction) {
    this.config = config;
    this.sendAction = sendAction;
    this.port = Number(this.config.Server.ControllerPort);
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

  runScenario(initialScenario, nextRun) {
    if (!this.running) return;

    const next = () => {
      setTimeout(() => this.runScenario(initialScenario, true), 1);
    };

    if (!nextRun) {
      this.scenario(initialScenario);
    }

    var current = this.scenario().shift();
    if (!current) {
      this.scenario(initialScenario);
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
    this.running = true;
    this.runScenario(initialScenario);
    return this;
  }

  stop() {
    this.running = false;
    return this;
  }
}
