module.exports = [
  ["click", ".btn-ex-raid2"],
  ["click", "[data-quest-id='719441']"], // Very Hard
  ["support.element", ["light", [
    2040056000, // Lucifer
    2040023000, // Apollo
    2040047000, // Luminiera Omega
    2040080000, // Zeus
  ]]],

  // turn 1
  ["battle.ca", false],
  // DF w/ DB, Seruel, Uzuki, Albert
  ["battle.skills", [
    "2.2", "3.2", "4.3", // buffs
    "1.2", "1.3", "1.4", // MC debuffs
  ]],
  "battle.summon",
  ["battle.skills", [
    "3.1", "2.1", "2.3", // skill dmg
  ]],
  "battle.attack",

  // turn 2
  ["battle.skills", ["4.1", "4.2"]],
  "battle.attack",

  // turn 3
  ["battle.skill", "1.1"],
  "battle.attack",

  // turn 4
  ["battle.skill", "2.1"],
  "battle.attack",

  // turn 5
  ["battle.skill", "1.4"],
  "battle.attack",

  // turn 6
  ["battle.skills", ["3.2", "4.1"]],
  "battle.attack",

  // turn 7 (ougi)
  ["battle.ca", true],
  ["battle.skills", ["1.1", "2.1", "2.3", "3.1", "3.3"]],
  "battle.summon",
  "battle.attack",

  // turn 8
  "battle.cycle.attack"
];
