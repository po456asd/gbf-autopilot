import _ from "lodash";
import {executeClick} from "./click";

const nextHandler = (next) => next();

export const elementIds = {
  "fire": 1,
  "water": 2,
  "earth": 3,
  "wind": 4,
  "light": 5,
  "dark": 6,
  "misc": 7,
  // optional, for Viramate's favorite
  "fav": 8
};

export const waitBattleScreen = [
  ["timeout", 3000],
  ["wait", ".btn-attack-start.display-on,.btn-usual-ok", (next, actions) => {
    actions.check(".btn-usual-ok").then(() => {
      actions.merge(
        ["click", ".btn-usual-ok"],
        ["merge", waitBattleScreen]
      ).then(next);
    }, next);
  }, nextHandler]
];

export default {
  "support": function(ids) {
    // check if the ids is a list of array
    // if it's not, use arguments
    if (!_.isArray(ids)) {
      ids = _.values(arguments);
    }

    // most of the logic goes to the contentscript now
    return new Promise((resolve, reject) => {
      this.sendAction("support", ids).then((data) => {
        executeClick(this, data).then(resolve, reject);
      }, reject);
    });
  },
  "support.element": function(element, summonIds) {
    const elementId = elementIds[element];
    return this.actions.merge(
      ["wait", ".pop-stamina,.prt-supporter-list", (next, actions) => {
        actions.check(".pop-stamina").then(() => {
          actions.merge(
            ["timeout", 1000],
            ["click", ".btn-use-full.index-1"],
            ["click", ".btn-usual-ok"]
          ).then(next);
        }, next);
      }, nextHandler],
      ["click", ".icon-supporter-type-" + elementId],
      ["support", summonIds],
      ["click", ".se-quest-start"],
      ["merge", waitBattleScreen]
    );
  }
};
