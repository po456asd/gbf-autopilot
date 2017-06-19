function traverse(root, name) {
  const keys = name.split(".");
  var value = root;
  while (value && keys.length > 0) {
    const key = keys.shift();
    value = value[key];
  }
  return value;
}

export default {
  "battle.status": function(payload, done, fail) {
    const callback = (stage) => {
      const gs = stage.gGameStatus;
      const data = stage.pJsnData;
      if (!gs) {
        return fail("Game status not found!");
      }
      if (!data) {
        return fail("JSON data not found!");
      }

      return done({
        battle: data.battle,
        boss: gs.boss.param,
        player: gs.player.param
      });
    };
    console.log("dispatching...");
    window.dispatchEvent(new Event("battle.status"));
  }
};
