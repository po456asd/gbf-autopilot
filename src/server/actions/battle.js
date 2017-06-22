import _ from "lodash";
import battleLogic from "./battle/logic";

const nextHandler = (next) => next();
const backHandler = [
  ["check", ".btn-command-back", (next, command, {selector}) => {
    command.click(selector).then(next);
  }, nextHandler]
];
const closeScenario = [
  "check", 
  ".btn-usual-ok,.btn-usual-cancel,.btn-usual-close", 
  (next, command, {selector}) => {
    command.merge(
      ["click", selector],
      ["timeout", 3000],
      closeScenario
    ).then(next);
  },
  nextHandler
];
const resultScenario = [
  ["wait", ".btn-usual-ok"],
  closeScenario,
  ["timeout", 3000],
  ["click", ".btn-control"],
  ["timeout", 1000],
  ["check", ".pop-friend-request", (next, command) => {
    command.merge(
      ["click", ".btn-usual-cancel"],
      ["timeout", 3000]
    ).then(next);
  }, nextHandler],
  closeScenario
];
const selectors = {
  "attack": ".btn-attack-start.display-on"
};

function checkBeforeClick(selector) {
  return ["merge", [
    ["move", selector],
    ["check", ".log-ability", (next, command) => {
      command["click.immediate"]().then(next);
    }, nextHandler],
    ["click.immediate"]
  ]];
}

export default {
  "battle.attack": function() {
    const check = [
      ["wait", [[selectors.attack, ".btn-usual-ok", ".btn-result"]]],
      ["check", ".btn-result", (next, command, {selector}) => {
        command.merge(
          ["click", selector],
          ["timeout", 3000],
          ["merge", check]
        ).then(next);
      }, nextHandler],
      ["check", ".btn-usual-ok", (next, command) => {
        command["switch.array"](resultScenario).then(next);
      }, nextHandler],
    ];

    return this.actions.merge(
      ["check", ".prt-advice", (next, command, result) => {
        command.click(result.selector).then(next);
      }, nextHandler],
      ["click", selectors.attack],
      ["merge", check]
    );
  },
  "battle.skill": function(skill) {
    if (arguments.length > 1) {
      skill = _.values(arguments);
    } else if (_.isString(skill)) {
      skill = skill.split(/[-,.]/gi);
    }
    const [chara, number] = skill;
    if (this.config.Viramate.QuickSkill) {
      return this.actions.click(`.ability-character-num-${chara}-${number}`);
    }

    const charaCommand = [
      ["merge", backHandler],
      checkBeforeClick(".btn-command-character.lis-character" + (chara-1))
    ];

    return this.actions.merge(
      ["check", `.prt-command-chara.chara${chara}`, nextHandler, (next, command) => {
        command.merge(charaCommand).then(next);
      }],
      checkBeforeClick(`.ability-character-num-${chara}-${number}`)
    );
  },
  "battle.skills": function() {
    var skills = _.values(arguments);
    return this.actions["merge.array"](skills.map((skill) => {
      return ["battle.skill", skill];
    }));
  },
  "battle.skills.array": function(skills) {
    return this.actions["battle.skills"].apply(this, skills);
  },
  "battle.auto": function() {
    return this.actions.click(".btn-auto");
  },
  "battle.result": function() {
    return this.actions["merge.array"](resultScenario);
  },
  "battle.ca": function(auto) {
    const selector = ".btn-lock." + (auto ? "lock1" : "lock0");
    return this.actions.merge(
      ["merge", backHandler],
      ["check", selector, function(next, actions, {selector}) {
        actions.click(selector).then(next);
      }, nextHandler]
    );
  },
  "battle.cycle.attack": function() {
    const cycleAttack = [
      ["battle.attack"],
      ["run", function() {
        this.actions["merge.array"](cycleAttack);
      }]
    ];
    return this.actions["merge.array"](cycleAttack);
  },
  "battle.summon": function(number) {
    if (this.config.Viramate.QuickSummon) {
      return this.actions.click(".quick-summon.available");
    }
    const selector = number ?
      `.lis-summon[pos="${number}"]` :
      ".btn-summon-available";
    return this.actions.merge(
      ["merge", backHandler],
      checkBeforeClick(".btn-command-summon"),
      ["timeout", 1000],
      checkBeforeClick(selector),
      ["check", ".btn-usual-ok", (next, command, {selector}) => {
        command.click(selector).then(next);
      }, nextHandler]
    );
  },
  "battle.logic": battleLogic
};
