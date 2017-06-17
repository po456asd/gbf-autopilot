import _ from "lodash";

function handleScenario(self, scenario, callback) {
  return new Promise((resolve, reject) => {
    if (scenario) {
      callback();
      resolve(self.scenario());
    } else {
      reject(new Error("No scenario set!"));
    }
  });
}

export default {
  "switch": function(scenario) {
    return handleScenario(this, scenario, () => {
      this.scenario(scenario);
    });
  },
  "merge": function(scenario) {
    return handleScenario(this, scenario, () => {
      const splice = Array.prototype.splice;
      splice.apply(this.scenario(), [0, 0].concat(scenario));
    });
  }
};
