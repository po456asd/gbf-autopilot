const nextHandler = function(next) {
  next();
};

const support = [
  ["click", ".icon-supporter-type-1"],
  ["support", [
    2040185000, // shiva
    2040034000, // colossus
    2040021000, // athena
    2040171000, // sethlans
    2040094000 // agni
  ]],
  ["click", ".se-quest-start"],
  ["wait", ".btn-attack-start.display-on"],
];

module.exports = {nextHandler, support};
