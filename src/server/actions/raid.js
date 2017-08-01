export default {
  "raid.backup": function() {
    return new Promise((resolve, reject) => {
      this.server.raidQueue.pop().then((raidCode) => {
        this.sendAction("viramate", {
          type: "tryJoinRaid", 
          raidCode
        }, 0).then(resolve, reject);
      });
    });
  }
};
