import {actions} from "./contentscript/actions";
import packer from "~/lib/messaging/packer";

chrome.runtime.sendMessage("LOADED", (resp) => {
  console.log(resp);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var rejected = false;
  const {action, payload, timeout} = request;
  const handler = actions[action];
  const done = (payload) => {
    sendResponse(packer(action, payload));
  };
  const fail = (payload) => {
    sendResponse(packer(action, payload, false));
  };
  const retry = (callback, timeout) => {
    if (!rejected) {
      setTimeout(callback, timeout || 1000 / 125);
    } else {
      // respond with null result anyway
      fail();
    }
  };

  var result;
  if (handler) {
    result = handler(payload, done, fail, retry);
  } else {
    fail(actions.error(action));
    return;
  }

  if (result !== undefined) {
    done(result);
  } else {
    setTimeout(() => {
      rejected = true;
      fail();
    }, timeout);
    return true;
  }
});
