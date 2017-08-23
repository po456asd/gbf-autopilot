const assert = require("assert");
const poker = require("../server/dist/server/actions/poker");
const winningHands = poker.winningHands;
const parseCards = poker.parseCards;

const cardPatterns = {
  royalStraightFlush: parseCards(["1_10", "1_11", "1_12", "1_13", "1_14"]),
  fiveOfAKind: parseCards(["1_2", "2_2", "3_2", "4_2", "99_99"]),
  straightFlush: parseCards(["1_2", "1_3", "1_4", "1_5", "1_6"]),
  fourOfAKind: parseCards(["1_2", "2_2", "3_2", "4_2", "1_3"]),
  fullHouse: parseCards(["1_2", "2_2", "3_2", "4_3", "1_3"]),
  flush: parseCards(["1_3", "1_4", "1_10", "1_11", "1_5"]),
  straight: parseCards(["1_3", "2_4", "3_5", "2_6", "4_7"]),
  threeOfAKind: parseCards(["1_3", "2_3", "3_3", "2_6", "4_7"]),
  twoPair: parseCards(["1_3", "2_3", "3_5", "2_6", "4_6"]),
  onePair: parseCards(["1_3", "2_3", "4_5", "2_1", "4_2"])
};

describe("Test poker algorithms", function() {
  Object.keys(cardPatterns).forEach(function(key) {
    it("should be a " + key, function() {
      const cards = cardPatterns[key];
      assert.notEqual(winningHands[key](cards), false);
    });
  });
});
