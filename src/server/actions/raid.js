import _ from "lodash";

export default {
  "raid.backup": function() {
    const battle = _.values(arguments);
    const nextHandler = (next) => next();
    const raidQueue = this.server.extensions.raidQueue;
    const goToPending = ["merge", [
      ["location.change", "#quest/assist/unclaimed"], ["timeout", 1000],
    ]];
    const pending = ["check", ".btn-multi-raid.lis-raid", (next, actions, {selector}) => {
      actions.merge(
        ["click", selector],
        ["wait", ".btn-usual-ok,.btn-control"], ["timeout", 1000],
        ["click", ".btn-usual-ok,.btn-control"], ["timeout", 1000],
        goToPending, pending
      ).then(next);
    }, nextHandler];

    return new Promise((resolve, reject) => {
      raidQueue.pop(() => {
        return this.running;
      }).then((raidCode) => {
        return this.actions["viramate.backup"](raidCode);
      }, reject).then((result) => {
        if (result === "ok") return this.actions["merge.array"](battle);
        else throw result;
      }, reject).then(resolve, (result) => {
        console.log("Joining raid failed: " + result);
        result = result.toLowerCase();
        if (result.indexOf("provide backup") >= 0) {
          return this.actions.timeout(Number(this.config.Raid.BackupTimeout || 30000));
        } else if (result.indexOf("pending") >= 0) {
          return this.actions.merge(goToPending, pending);
        } else {
          return this.actions.timeout(3000);
        }
      }).then(resolve, reject);
    });
  }
};
