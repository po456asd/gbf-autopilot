import _ from "lodash";
import battleLogic from "./battle/logic";
import battleBackup from "./battle/backup";

const selectors = {
  "attack": ".btn-attack-start.display-on",
  "next": [
    ".btn-result",
    ".btn-usual-ok",
    ".btn-usual-cancel",
    ".btn-usual-close",
    "#cjs-lp-rankup"
  ].join(",")
};
const nextHandler = (next) => next();
const backHandler = [
  ["check", ".btn-command-back", (next, command, {selector}) => {
    command.click(selector).then(next);
  }, nextHandler]
];
const closeScenario = [
  "check", selectors.next, (next, command, {selector}) => {
    command.merge(
      ["click", selector],
      ["timeout", 1500],
      ["wait", selectors.next + ",.btn-control"],
      closeScenario
    ).then(next);
  }, nextHandler
];
const resultScenario = [
  ["wait", selectors.next + ",.btn-control"],
  closeScenario,
  ["click", ".btn-control"],
  ["timeout", 1500],
  ["check", ".pop-friend-request", (next, command) => {
    command.merge(
      ["click", ".btn-usual-cancel"],
      ["timeout", 1500]
    ).then(next);
  }, nextHandler],
  closeScenario
];

function checkBeforeClick(selector) {
  return ["merge", [
    ["move", selector],
    ["check", ".log-ability", (next, command) => {
      command["click.immediate"]().then(next);
    }, nextHandler],
    ["click.immediate"]
  ]];
}

class ChainBuilder {
  constructor(checkers) {
    this.checkers = checkers;
  }

  build() {
    const clone = this.checkers.slice();
    const recurseChecker = () => {
      const checker = clone.shift();
      if (!checker) return ["timeout", 10];
      return checker((next, command) => {
        command.merge(recurseChecker()).then(next);
      });
    };
    return recurseChecker();
  }
}

export default {
  "battle.attack": function(skipWaiting) {
    var check;
    const buttons = selectors.next + "," + 
      [selectors.attack, ".btn-result", ".btn-control"].join(",");
    const checkNextButton = (nextCheck) => {
      return ["check", ".btn-result", (next, command, {selector}) => {
        command.merge(
          ["click", selector],
          ["timeout", 1500],
          ["merge", check]
        ).then(next);
      }, nextCheck];
    };
    const checkOkButton = (nextCheck) => {
      return ["check", ".btn-usual-ok", (next, command, {selector}) => {
        command.merge(
          ["click", selector],
          ["timeout", 1500],
          ["wait", buttons],
          ["check", ".btn-result", (next, actions, {selector}) => {
            actions.merge(
              ["click", selector],
              ["merge", check]
            ).then(next);
          }, (next, actions) => {
            actions.check(selectors.attack).then(next, () => {
              actions["switch.array"](resultScenario).then(next);
            });
          }]
        ).then(next);
      }, nextCheck];
    };

    const chain = new ChainBuilder([checkNextButton, checkOkButton]);
    check = [
      ["wait", buttons],
      chain.build()
    ];

    return this.actions.merge(
      ["check", ".prt-advice", (next, command, result) => {
        command.click(result.selector).then(next);
      }, nextHandler],
      ["check", ".btn-result,.btn-usual-ok,.btn-usual-close", (next, actions) => {
        actions["merge.array"](check).then(next);
      }, (next, actions) => {
        actions.merge(
          ["click", selectors.attack],
          ["check", () => skipWaiting, nextHandler, (next, actions) => {
            actions["merge.array"](check).then(next);
          }]
        ).then(next);
      }]
    );
  },
  "battle.skill": function(skill) {
    if (arguments.length > 1) {
      skill = _.values(arguments);
    } else if (_.isString(skill)) {
      skill = skill.split(/[-,.]/gi);
    }

    const [chara, number] = skill;
    const checkOkButton = ["check", ".btn-usual-ok,.btn-usual-close", (next, actions, {selector}) => {
      actions.click(selector).then(next);
    }, nextHandler];
    const checkAttackButton = ["check", selectors.attack, nextHandler, (next, actions) => {
      actions["switch.array"](resultScenario).then(next);
    }];

    if (this.config.Viramate.QuickSkill) {
      return this.actions.merge(
        checkAttackButton, checkOkButton,
        ["check", `.ability-character-num-${chara}-${number}`, (next, actions, {selector}) => {
          actions.click(selector).then(next);
        }, nextHandler]
      );
    }

    const charaCommand = [
      ["merge", backHandler],
      checkBeforeClick(".btn-command-character.lis-character" + (chara-1))
    ];

    return this.actions.merge(
      checkAttackButton, checkOkButton,
      ["check", `.prt-command-chara.chara${chara}`, nextHandler, (next, command) => {
        command["merge.array"](charaCommand).then(next);
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
    return this.actions.merge(
      ["click", selectors.attack],
      ["click", ".btn-auto"],
      "battle.result"
    );
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
      const index = number ? number - 1 : 0;
      return this.actions.click(number ?
        `.quick-summon[index="${index}"]` :
        ".quick-summon.available");
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
  "battle.enemy": function(number) {
    return this.actions.click(".btn-targeting.enemy-" + number);
  },

  // Extras
  "battle.logic": battleLogic,
  "battle.backup": battleBackup
};
