import _ from "lodash";

export default {
  "support": function() {
    var ids = _.values(arguments);
    return new Promise((resolve, reject) => {
      var flag = false;
      const clickSummon = () => {
        var selector = ".prt-summon-image";
        const id = ids.shift();
        if (id) {
          selector += `[data-image="${id}"]`;
        } else {
          if (!flag) {
            flag = true;
          } else {
            reject(new Error("No summon found!"));
            return;
          }
        }
        this.actions.check(selector).then(() => {
          this.actions.click(selector).then(resolve, reject);
        }, () => {
          clickSummon();
        });
      };
      clickSummon();
    });
  }
};
