import $ from "jquery";
import {translateElement} from "./element";

export default {
  "support": function(ids, done, fail) {
    const supporters = $(".prt-supporter-attribute:not(.disableView) > .btn-supporter");

    var element, selectedName, max = 0;
    supporters.each((idx, el) => {
      const $el = $(el);

      // gather some data
      const id = Number($el.find(".prt-summon-image").attr("data-image"));
      const isMax = !!$el.find(".prt-summon-max").length;
      const title = $el.find(".prt-supporter-summon")
        .text().trim()
        .match(/^Lvl (\d+) (.+)/);
      
      const level = Number(title[1]);
      const name = title[2];

      const $skill = $el.find(".prt-summon-skill");
      const rank = $skill.find(".bless-rank2-style").length ? 2 :
        $skill.find(".bless-rank1-style").length ? 1 : 0;

      const $quality = $el.find(".prt-summon-quality");
      const plus = $quality.length ? Number($quality.text().trim().substr(1)) : 0;

      // start calculating score
      const index = ids.indexOf(id);
      const base = index >= 0 ? ids.length - index : 0;
      // calculate from variables with least priority
      const score = (5 * plus / 99) +   // 5: start from the plus mark
        (10 * Number(isMax)) +          // 10: maybe useless but check if it's fully uncapped
        (25 * level / 150) +            // 25: prioritize based on the level
        (50 * rank / 2) +               // 50: next prioritize between none, MLB, and FLB
        (200 * base / ids.length);      // 200: the summon itself has the top priority
      
      if (score > max) {
        element = $el.find(".prt-supporter-info")[0];
        selectedName = name;
        max = score;
      }
    });

    if (!element) {
      return fail(new Error("No support found!"));
    }

    console.log("Selected support: '" + selectedName + "' with score " + max, element);
    done(translateElement(element));
  }
};
