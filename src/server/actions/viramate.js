export default {
  "viramate": function(options) {
    return this.sendAction("viramate", options);
  },
  "viramate.backup": function(raidCode) {
    return this.actions.viramate({
      type: "tryJoinRaid", 
      raidCode
    });
  },
  "viramate.combat": function() {
    return this.actions.viramate({
      type: "getCombatState"
    });
  }
};
