import _ from "lodash";

const nextHandler = (next) => next();

const result = [
  ["wait", ".btn-usual-ok"],
  ["click", ".btn-usual-ok"]
];

export default {
  "battle.skill": function(skill) {
    if (arguments.length > 1) {
      skill = _.values(arguments);
    } else if (_.isString(skill)) {
      skill = skill.split(/[-,.]/gi);
    }
    const [row, number] = skill;
    return this.actions.click(`.ability-character-num-${row}-${number}`);
  },
  "battle.attack": function() {
    return this.actions.merge([
      ["check", ".prt-advice", function(next, command) {
        command.click(".prt-advice").then(next);
      }, nextHandler],
      ["click", ".btn-attack-start"],
      ["wait", ".btn-attack-start, .btn-usual-ok"],
      ["check", ".btn-usual-ok", function(next, command) {
        command.switch(result).then(next);
      }, nextHandler]
    ]);
  },
  "battle.ca": function(auto) {
    const selector = ".btn-lock." + (auto ? "lock1" : "lock0");
    return this.actions.merge([
      ["check", selector, function(next, actions) {
        actions.click(".btn-lock").then(next);
      }, nextHandler]
    ]);
  },
  "battle.summon": function() {
    return this.actions.merge([
      ["click", ".quick-summon.available"],
    ]);
  }
};
