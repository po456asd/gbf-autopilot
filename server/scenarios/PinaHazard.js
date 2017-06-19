const helpers = require("./helpers");
const support = helpers.support;
const nextHandler = helpers.nextHandler;

const battle = [
  // set CA to hold
  ["battle.ca", false],

  // battle 1
  // turn 1
  ["battle.skill", "4-3"],
  ["battle.skill", "3-3"],
  ["battle.skill", "1-3"],
  ["battle.skill", "1-1"],
  "battle.attack",

  // turn 2
  ["battle.skill", "4-1"],
  "battle.attack",

  // battle 2
  // turn 1
  "battle.attack",

  // turn 2
  ["battle.skill", "4-1"],
  "battle.summon",
  "battle.attack",

  // battle 3
  // turn 1
  ["battle.skill", "1-2"],
  ["battle.skill", "1-4"],
  ["battle.skill", "3-2"],
  ["battle.skill", "2-1"],
  ["battle.skill", "3-1"],
  ["battle.skill", "2-2"],
  "battle.attack",

  // turn 2
  "battle.attack",

  // turn 3
  ["battle.skill", "4-2"],
  ["battle.skill", "4-1"],
  "battle.attack",

  // turn 4, ougi
  ["battle.skill", "2-3"],
  ["battle.ca", true],
  "battle.attack",

  // expect result screen
  "battle.result"
];

const nmBattle = [
  ["battle.ca", false],

  // turn 1
  // buffs
  ["battle.skill", "4-3"],
  ["battle.skill", "3-3"],
  ["battle.skill", "1-3"],
  ["battle.skill", "1-1"],

  // debuffs
  ["battle.skill", "1-2"],
  ["battle.skill", "3-2"],
  ["battle.skill", "1-4"],

  // dmg skills
  ["battle.skill", "2-1"],
  ["battle.skill", "3-1"],
  ["battle.skill", "4-1"],
  ["battle.skill", "2-2"],
  "battle.attack",

  // turn 2
  "battle.attack",

  // turn 3
  ["battle.skill", "4-1"],
  "battle.attack",

  // turn 4
  "battle.attack",

  // turn 5, ougi
  ["battle.skill", "4-1"],
  ["battle.skill", "4-2"],
  ["battle.skill", "2-3"],
  "battle.summon",
  ["battle.ca", true],
  "battle.attack",

  // turn 6
  ["battle.ca", false],
  ["battle.skill", "3-1"],
  "battle.attack",

  // turn 7
  ["battle.skill", "1-3"],
  ["battle.skill", "2-2"],
  ["battle.skill", "3-2"],
  ["battle.skill", "4-1"],
  "battle.summon",
  "battle.attack",

  // turn 8
  ["battle.skill", "1-1"],
  ["battle.skill", "2-1"],
  "battle.attack",

  // turn 9
  ["battle.skill", "4-1"],
  ["battle.skill", "4-3"],
  ["battle.skill", "3-3"],
  "battle.attack",

  // turn 10, ougi and cycle the remaining attacks
  ["battle.ca", true],
  "battle.cycle.attack"
];

const nightmare = [
  ["click", ".btn-stage-detail.ex-hell"],
  ["click", ".btn-set-quest[data-quest-id='719301']"],
  ["merge", [support]],
  ["switch", [nmBattle]]
];

const preBattle = [
  ["location.change", "#quest/extra/event"],
  ["wait", ".btn-stage-detail"],
  ["check", ".btn-stage-detail.ex-hell", function(next, actions) {
    actions.switch(nightmare).then(next);
  }, nextHandler],
  ["click", ".btn-stage-detail[data-key='6015_2']"],
  ["click", ".btn-set-quest[data-quest-id='719281']"],
  ["merge", [support]],
  ["switch", [battle]]
];

module.exports = preBattle;
