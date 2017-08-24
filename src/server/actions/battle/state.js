export default function() {
  return new Promise((resolve, reject) => {
    var state = {};
    this.callAction("battle.count").then((count) => {
      state.battle = count;
      return this.callAction("viramate.combat");
    }, reject).then((combatState) => {
      Object.assign(state, combatState);
      return this.sendAction("battle.state"); 
    }, reject).then((battleState) => {
      const skillState = battleState.party;
      Object.keys(skillState).forEach((chara) => {
        state.party[Number(chara) - 1].skills = skillState[chara];
      });

      state.summons = battleState.summons;
      resolve(state);
    }, reject);
  });
}
