function ingameRequest(type, checker) {
  const selector = ".btn-check." + type;
  return ["check", checker, (next, actions) => {
    // if checked and is not active, click it
    actions.check(selector + "[active='0']").then(() => {
      actions.click(selector).then(next);
    }, next);
  }, (next, actions) => {
    // if unchecked and is active, click it
    actions.check(selector + "[active='1']").then(() => {
      actions.click(selector).then(next);
    }, next);
  }];
}

function nextHandler(next) {
  next();
}

export default function(options) {
  return this.actions.merge(
    ["click", ".btn-assist"], ["timeout", 1000],
    ["click", ".btn-twitter"], ["timeout", 1000],
    ["wait", ".txt-attention-comment"],
    ["element.text", ".txt-attention-comment", (next, actions, result) => {
      const message = result.match(/Battle ID: (.+) pic.twitter/)[1];
      actions.chatbot(message).then(next);
    }, nextHandler],
    ["check", () => options.twitter, (next, actions) => {
      actions.merge(
        ["click", ".btn-tweet-post"], ["timeout", 1000],
        ["click", ".btn-usual-ok"], ["timeout", 1000]
      ).then(next);
    }, (next, actions) => {
      actions.merge(
        ["click", ".btn-usual-cancel"], ["timeout", 1000]
      ).then(next);
    }],

    // request ingame
    ["click", ".btn-assist"], ["timeout", 1000],
    ingameRequest("all", () => options.all),
    ingameRequest("friend", () => options.friend),
    ingameRequest("guild", () => options.guild),
    ["click", ".btn-usual-text"], ["timeout", 1000],
    ["click", ".btn-usual-ok"], ["timeout", 1000]
  );
}
