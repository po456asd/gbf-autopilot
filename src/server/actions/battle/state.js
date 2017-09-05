import _ from "lodash";

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
        const skills = _.values(skillState[chara]).sort((a, b) => b.skill - a.skill);
        state.party[Number(chara) - 1].skills = skills;
      });

      state.summons = _.values(battleState.summons).sort((a, b) => b.num - a.num);
      resolve(state);
    }, reject);
  });
}
