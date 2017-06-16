import actionClick from "./click";
import packer from "~/lib/messaging/packer";
import assign from "lodash/assign";

export const actions = assign({
  "hello": function() {
    console.log("Received hello");
  }
}, actionClick);

export class ActionWrapper {
  constructor(tab) {
    this.tab = tab;
  }

  sendAction(action, payload) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(this.tab.id, packer(action, payload), (resp) => {
        resolve(resp ? resp.payload : null);
      });
    });
  }
}

export default actions;
