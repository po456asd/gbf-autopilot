import _ from "lodash";
import battleLogic from "./battle/logic";

const nextHandler = (next) => next();
const backHandler = [
  ["check", ".btn-command-back", (next, command, {selector}) => {
    command.dblclick(selector).then(next);
  }, nextHandler]
];
const logHandler = [
  ["check", ".ability.log", (next, command, {selector}) => {
    command.dblclick(selector).then(next);
  }, nextHandler]
];
const resultScenario = [
  ["wait", ".btn-usual-ok"],
  ["click", ".btn-usual-ok"]
];
const selectors = {
  "attack": ".btn-attack-start.display-on"
};

function checkBeforeClick(selector) {
  return ["merge", [[
    ["move", selector],
    ["check", ".ability-log", (next, command) => {
      command["click.immediate"]().then(next);
    }, nextHandler],
    ["click.immediate"]
  ]]];
}

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
    if (this.config.Viramate.QuickSkill) {
      return this.actions.dblclick(`.ability-character-num-${chara}-${number}`);
    }

    const charaCommand = [
      ["merge", [backHandler]],
      ["dblclick", ".btn-command-character.lis-character" + (chara-1)],
    ];

    return this.actions.merge([
      ["check", `.prt-command-chara.chara${chara}`, nextHandler, (next, command) => {
        command.merge(charaCommand).then(next);
      }],
      checkBeforeClick(`.ability-character-num-${chara}-${number}`)
    ]);
  },
  "battle.attack": function() {
    const check = [
      ["wait", [[selectors.attack, ".btn-usual-ok", ".btn-result"]]],
      ["check", ".btn-result", (next, command, {selector}) => {
        command.merge([
          ["click", selector],
          ["merge", [check]]
        ]).then(next);
      }, nextHandler],
      ["check", ".btn-usual-ok", (next, command) => {
        command.switch(resultScenario).then(next);
      }, nextHandler],
    ];

    return this.actions.merge([
      ["check", ".prt-advice", (next, command, result) => {
        command.click(result.selector).then(next);
      }, nextHandler],
      ["click", selectors.attack],
      ["merge", [check]]
    ]);
  },
  "battle.ca": function(auto) {
    const selector = ".btn-lock." + (auto ? "lock1" : "lock0");
    return this.actions.merge([
      ["merge", [backHandler]],
      ["check", selector, function(next, actions, {selector}) {
        actions.click(selector).then(next);
      }, nextHandler]
    ]);
  },
  "battle.summon": function(number) {
    if (this.config.Viramate.QuickSummon) {
      return this.actions.dblclick(".quick-summon.available");
    }
    const selector = number ?
      `.lis-summon[pos="${number}"]` :
      ".btn-summon-available";
    return this.actions.merge([
      ["merge", [backHandler]],
      checkBeforeClick(".btn-command-summon"),
      checkBeforeClick(selector),
      ["check", ".btn-usual-ok", (next, command, {selector}) => {
        command.click(selector).then(next);
      }, nextHandler]
    ]);
  },
  "battle.logic": battleLogic
};
