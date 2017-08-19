export default {
  poker: function(modelName, done, fail) {
    this.requestExternal("poker", modelName).then((result) => {
      done(result);
    }, (err) => {
      fail(err);
    });
  }
};
