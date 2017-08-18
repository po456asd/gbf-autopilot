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

const battleSelector = [
  ".btn-attack-start.display-on",
  ".txt-popup-body",
  ".btn-usual-ok",
  ".btn-result"
];

export const waitBattleScreen = [
  ["timeout", 3000],
  ["wait", battleSelector.join(","), (next, actions) => {
    const checkButton = ["check", ".btn-usual-ok", (next, actions) => {
      actions.merge(
        ["click", ".btn-usual-ok"],
        ["merge", waitBattleScreen]
      ).then(next);
    }, nextHandler];

    const checkPopup = ["check", ".txt-popup-body", (next, actions) => {
      actions.execute("element.text", ".txt-popup-body").then((text) => {
        text = text.trim().toLowerCase();
        if (text.indexOf("end") >= 0) {
          actions.reset().then(next);
        } else {
          actions.merge(checkButton).then(next);
        }
      });
    }, nextHandler];

    actions.merge(checkPopup).then(next);
  }, nextHandler]
];

export const supportScreenSelector = ".pop-stamina,.prt-supporter-list";

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
  "support.element": function(element, summonIds, party) {
    element = element.toLowerCase().trim();
    const elementId = elementIds[element];
    return this.actions.merge(
      ["wait", supportScreenSelector, (next, actions) => {
        actions.check(".pop-stamina").then(() => {
          if (!this.config.Scenario.RefillAP) {
            actions.finish().then(next);
            return;
          }
          actions.merge(
            ["timeout", 1000],
            ["click", ".btn-use-full.index-1"],
            ["click", ".btn-usual-ok"]
          ).then(next);
        }, next);
      }, nextHandler],
      ["click", ".icon-supporter-type-" + elementId],
      ["support", summonIds],
      ["wait", ".se-quest-start"],
      ["check", () => !!party, (next, actions) => {
        const [group, slot] = party.trim().split(".");
        actions.merge(
          ["check", ".btn-select-group.id-" + group + ".selected", nextHandler, (next, actions) => {
            actions.merge(
              ["click", ".btn-select-group.id-" + group],
              ["timeout", 1000]
            ).then(next);
          }],
          ["check", ".prt-deck-slider ol > li:nth-child(" + slot + ") > a.flex-active", nextHandler, (next, actions) => {
            actions.merge(
              ["click", ".prt-deck-slider ol > li:nth-child(" + slot + ")"],
              ["timeout", 1000]
            ).then(next);
          }]
        ).then(next);
      }, nextHandler],
      ["click", ".se-quest-start"],
      ["merge", waitBattleScreen]
    );
  },
  "support.quest": function() {
    if (arguments.length < 1) {
      var selector = arguments[0];
    } else {
      selector = Array.from(arguments);
    }
    if (_.isString(selector)) {
      selector = [selector];
    }

    var index = 0;
    const checker = ["check", supportScreenSelector, nextHandler, function(next, actions) {
      // check current and next selectors
      // if next selector exists, iterate the checker to the next selector
      // else, click the current selector and check again
      const selectorCurrent = selector[index];
      const selectorNext = index + 1 < selector.length ? selector[index + 1] : supportScreenSelector;
      actions.check(selectorNext).then(() => {
        actions.merge(
          ["timeout", 1000],
          checker
        ).then(() => {
          index++;
          next();
        }); 
      }, () => {
        actions.check(selectorCurrent).then(() => {
          actions.merge(
            ["click", selectorCurrent],
            ["timeout", 1000],
            checker
          ).then(next);
        }, next);
      });
    }];
    return this.actions.merge(checker);
  }
};
