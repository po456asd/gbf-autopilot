import _ from "lodash";

const nextHandler = (next) => next();
const backHandler = [
  ["check", ".btn-command-back", (next, command, {selector}) => {
    command.click(selector).then(next);
  }, nextHandler]
];
const resultScenario = [
  ["wait", ".btn-usual-ok"],
  ["click", ".btn-usual-ok"]
];
const selectors = {
  "attack": ".btn-attack-start.display-on"
};

export default {
  "battle.cycle.attack": function() {
    const cycleAttack = [
      ["battle.attack"],
      ["run", function() {
        this.actions.merge(cycleAttack);
      }]
    ];
    return this.actions.merge(cycleAttack);
  },
  "battle.auto": function() {
    return this.actions.click(".btn-auto");
  },
  "battle.result": function() {
    return this.actions.merge(resultScenario);
  },
  "battle.skill": function(skill) {
    if (arguments.length > 1) {
      skill = _.values(arguments);
    } else if (_.isString(skill)) {
      skill = skill.split(/[-,.]/gi);
    }
    const [chara, number] = skill;
    if (this.config.viramate) {
      return this.actions.click(`.ability-character-num-${chara}-${number}`);
    }

    const charaCommand = [
      ["check", ".btn-command-back", (next, command, {selector}) => {
        command.click(selector).then(next);
      }, nextHandler],
      ["click", ".btn-command-character.lis-character" + (chara-1)],
    ];

    return this.actions.merge([
      ["check", `.prt-command-chara.chara${chara}`, nextHandler, (next, command) => {
        command.merge(charaCommand).then(next);
      }],
      ["click", `.ability-character-num-${chara}-${number}`]
    ]);
  },
  "battle.attack": function() {
    return this.actions.merge([
      ["check", ".prt-advice", (next, command, result) => {
        command.click(result.selector).then(next);
      }, nextHandler],
      ["click", selectors.attack],
      ["wait", [selectors.attack, ".btn-usual-ok", ".btn-result"].join(",")],
      ["check", ".btn-result", (next, command, {selector}) => {
        command.merge([
          ["click", selector],
          ["battle.attack"]
        ]).then(next);
      }, nextHandler],
      ["check", ".btn-usual-ok", (next, command) => {
        command.switch(resultScenario).then(next);
      }, nextHandler],
    ]);
  },
  "battle.ca": function(auto) {
    const selector = ".btn-lock." + (auto ? "lock1" : "lock0");
    return this.actions.merge([
      ["merge", [backHandler]],
      ["check", selector, function(next, actions, result) {
        actions.click(result.selector).then(next);
      }, nextHandler]
    ]);
  },
  "battle.summon": function(number) {
    if (this.config.viramate) {
      return this.actions.click(".quick-summon.available");
    }
    const selector = number ?
      `.lis-summon[pos="${number}"]` :
      ".btn-summon-available";
    return this.actions.merge([
      ["merge", [backHandler]],
      ["click", ".btn-command-summon"],
      ["click", selector],
      ["click", ".btn-summon-use"]
    ]);
  }
};
