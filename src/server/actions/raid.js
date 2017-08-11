export default {
  "raid.backup": function() {
    const raidQueue = this.server.extensions.raidQueue;
    return new Promise((resolve, reject) => {
      raidQueue.pop().then((raidCode) => {
        this.actions["viramate.backup"](raidCode).then(resolve, reject);
      });
    });
  }
};
