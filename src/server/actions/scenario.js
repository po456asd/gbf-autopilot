import _ from "lodash";

function handleScenario(self, args, callback) {
  var scenario = _.values(args);
  if (scenario.length <= 1) {
    scenario = scenario[0];
  }
  return new Promise((resolve, reject) => {
    if (scenario) {
      callback(scenario);
      resolve(self.scenario());
    } else {
      reject(new Error("No scenario set!"));
    }
  });
}

export default {
  "switch": function() {
    return handleScenario(this, arguments, (scenario) => {
      this.scenario(scenario);
    });
  },
  "merge": function() {
    return handleScenario(this, arguments, (scenario) => {
      const splice = Array.prototype.splice;
      splice.apply(this.scenario(), [0, 0].concat(scenario));
    });
  }
};
