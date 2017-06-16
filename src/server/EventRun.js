import _ from "lodash";
import actionClick from "./actions/click";
import actionSupport from "./actions/support";
import actionBattle from "./actions/battle";
import actionScenario from "./actions/scenario";

const actions = _.assign({
  "check": function(selector) {
    return this.sendAction("element", selector, 500);
  },
  "wait": function(selector, timeout) {
    return this.sendAction("element", selector, timeout);
  },
}, actionScenario, actionClick, actionSupport, actionBattle);

export default class EventRun {
  constructor(port, sendAction) {
    this.port = port;
    this.sendAction = sendAction;
    this.actions = _.reduce(actions, (result, action, name) => {
      result[name] = action.bind(this);
      return result;
    }, {});
    this._scenario = null;
    console.log(this.actions);
  }

  callAction(name, args) {
    if (arguments.length > 2) {
      args = _.values(arguments).slice(1);
    }
    if (!_.isArray(args)) {
      args = [args];
    }
    const handler = this.actions[name] || (() => this.sendAction(name, args));
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

  runScenario(initialScenario) {
    const next = () => {
      setTimeout(() => this.runScenario(initialScenario), 500);
    };

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
    const errorCallback = (err) => {
      if (error) handleCallback(error)(err);
      else console.error(err);
    };

    this.callAction(action, args).then(successCallback, errorCallback);
    return this;
  }

  start(initialScenario) {
    this.scenario(initialScenario);
    this.runScenario(initialScenario);
  }
}
