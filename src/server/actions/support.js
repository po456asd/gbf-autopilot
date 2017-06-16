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
        this.actions.click(selector, 1000)
          .then(resolve, () => {
            console.log(`Summon '${id}' not found`);
            clickSummon();
          });
      };
      clickSummon();
    });
  }
};
