import _ from "lodash";
import {executeClick} from "./click";

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
      ["click", ".icon-supporter-type-" + elementId],
      ["support", summonIds],
      ["click", ".se-quest-start"],
      ["wait", ".btn-attack-start.display-on"],
    );
  }
};
