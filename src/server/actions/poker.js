import _ from "lodash";
import {request as requestClick} from "./click";

function nextHandler(next) {
  next();
}

function findMatchingCards(cards) {
  const matches = {
    rank: {},
    suit: {}
  };
  const hasMatch = (type, card) => {
    return _.has(matches[type], card[type]);
  };
  const addMatch = (type, card, index) => {
    if (_.has(matches[type], card[type])) matches[type][card[type]].push(index);
    else matches[type][card[type]] = [index];
  };

  _.each(["rank", "suit"], (type) => {
    _.each(cards, (initialCard, initialIndex) => {
      // no need to check existing rank/suit
      if (hasMatch(type, initialCard)) return;
      addMatch(type, initialCard, initialIndex);
      _.each(cards, (card, index) => {
        if (index == initialIndex) return;
        if (card[type] == initialCard[type]) {
          addMatch(type, card, index);
        }
      });
    });
  });

  return matches;
}

function someOfAKind(cards, min) {
  const matches = findMatchingCards(cards);
  var result = false;
  _.each(matches.rank, (indexes) => {
    if (indexes.length >= min) {
      result = indexes;
      return false;
    }
  });
  return result;
}

const winningHands = {
  royalStraightFlush(cards) {
    if (this.straightFlush(cards) === false) return false;
    var result = [0, 1, 2, 3, 4];
    _.each(cards, (card) => {
      if (card.rank < 10) {
        result = false;
        return false;
      }
    });
    return result;
  },
  fiveOfAKind(cards) {
    return someOfAKind(cards, 5);
  },
  straightFlush(cards) {
    const straight = this.straight(cards);
    const flush = this.flush(cards);
    return straight !== false &&
      flush !== false;
  },
  fourOfAKind(cards) {
    return someOfAKind(cards, 4);
  },
  fullHouse(cards) {
    const matches = findMatchingCards(cards);
    const numberOfRanks = _.keys(matches.ranks).length;
    if (numberOfRanks != 2) return false;
    return [0, 1, 2, 3, 4];
  },
  flush(cards) {
    const matches = findMatchingCards(cards);
    var result = false;
    _.each(matches.suit, (indexes) => {
      if (indexes.length >= 5) {
        result = indexes;
        return false;
      }
    });
    return result;
  },
  straight(cards) {
    const ranks = _.map(cards, (card) => card.rank).sort((a, b) => {
      return a - b;
    });
    var lastRank = -1;
    var result = [0, 1, 2, 3, 4];
    _.each(ranks, (rank) => {
      if (lastRank == -1) {
        lastRank = rank;
        return;
      }
      if (rank - lastRank != -1) {
        result = false;
        return false;
      }
      lastRank = rank;
    });

    return result;
  },
  threeOfAKind(cards) {
    return someOfAKind(cards, 3);
  },
  twoPair(cards) {
    const matches = findMatchingCards(cards);
    const pairs = [];
    _.each(matches.rank, (indexes) => {
      if (indexes.length >= 2) pairs.push(indexes);
    });

    if (pairs.length < 2) return false;

    const result = [];
    _.each(pairs, (pair) => {
      _.each(pair, (index) => {
        result.push(index);
      });
    });
    return result;
  },
  onePair(cards) {
    const matches = findMatchingCards(cards);
    var result = false;
    _.each(matches.rank, (indexes) => {
      if (indexes.length >= 2) {
        result = indexes;
        return false;
      }
    });
    return result;
  }
};
const winningHandsPriority = [
  ::winningHands.royalStraightFlush,
  ::winningHands.fiveOfAKind,
  ::winningHands.straightFlush,
  ::winningHands.fourOfAKind,
  ::winningHands.fullHouse,
  ::winningHands.flush,
  ::winningHands.straight,
  ::winningHands.threeOfAKind,
  ::winningHands.twoPair
];

function checkWinning(cards) {
  var result = false;
  _.each(winningHandsPriority, (checker) => {
    result = checker(cards);
    if (result !== false) {
      result = {
        name: checker.name,
        indexes: result
      };
      return false;
    }
  });
  return result;
}

function checkSuit(cards) {
  const matches = findMatchingCards(cards);
  var result = false;
  _.each(matches.suit, (indexes) => {
    if (indexes.length >= 4) {
      result = {
        name: "checkSuit",
        indexes
      };
      return false;
    }
  });
  return result;
}

function checkOrder() {
  return false;
}

function checkPair(cards) {
  const result = winningHands.onePair(cards);
  if (result === false) return false;
  return {
    name: "checkPair",
    indexes: result
  };
}

function checkJoker(cards) {
  var result = false;
  _.each(cards, ({rank}, index) => {
    if (rank >= 99) {
      result = {
        name: "checkJoker",
        indexes: [index]
      };
      return false;
    }
  });
  return result;
}

const checkers = [
  checkWinning,
  checkSuit,
  checkOrder,
  checkPair,
  checkJoker
];

function parseCard(card) {
  const [suit, rank] = card.split("_");
  const result = {
    suit: Number(suit),
    rank: Number(rank)
  };
  // in case of Ace
  if (result.rank == 1) result.rank = 14;
  return result;
}

function parseCards(cards) {
  return _.map(cards, parseCard);
}

const cardRect = {
  left: 170, // 201
  top: 294, // 294
  width: 77, // 77
  height: 109, // 109
  margin: 6 // 6
};

function keepSuggestion(cards) {
  var scenario = [
    ["wait", ".prt-ok:not(.disable)"]
  ];
  const clickCard = (index, resolve, reject) => {
    this.sendAction("element", "#canv").then((result) => {
      const mult = index - 2;
      result.scale = 1.5;
      result.x += cardRect.left + (mult * (cardRect.width + cardRect.margin));
      result.y += cardRect.top;
      result.width = cardRect.width;
      result.height = cardRect.height;
      requestClick(this, result).then(resolve, reject);
    }, reject);
  };

  cards = parseCards(cards);
  var indexes = [];
  _.each(checkers, (checker) => {
    const result = checker(cards);
    if (result !== false) {
      indexes = result.indexes;
      console.log(result);
      return false;
    }
  });

  _.each(indexes, (index) => {
    scenario.push(["run", (done, fail) => {
      clickCard(index, done, fail);
    }]);
  });
  scenario = scenario.concat([
    ["click", ".prt-ok:not(.disable)"],
    ["wait", ".prt-start,.prt-yes,.prt-no"],
    ["check", ".prt-yes", (next, actions, {selector}) => {
      actions.merge(
        ["click", selector],
        "poker.double"
      ).then(next);
    }, (next, actions) => {
      actions.click(".prt-start").then(next);
    }]
  ]);

  return scenario;
}

function predictDouble(card) {
  const rank = parseCard(card).rank;
  const lowChance = (rank - 2) / 12; // eg. A -> (14 - 2) / 12 = 1
  return {
    low: lowChance,
    high: 1.0 - lowChance
  };
}

export default {
  poker: function() {
    return new Promise((resolve, reject) => {
      const processCards = (payload) => {
        const scenario = keepSuggestion.call(this, _.values(payload.card_list));
        this.actions["merge.array"](scenario).then(resolve, reject);
      };

      this.sendAction("poker", "deal").then(({payload}) => {
        if (!payload.card_list) {
          this.sendAction("poker", "initialize").then(({payload}) => {
            console.log("From initialize model");
            processCards(payload);
          });
        } else {
          console.log("From deal model");
          processCards(payload);
        }
      }, reject);
    });
  },
  "poker.double": function() {
    return new Promise((resolve, reject) => {
      this.sendAction("poker", "doubleStart").then(({payload}) => {
        const prediction = predictDouble(payload.card_first);
        var select = "high";
        if (prediction.high < prediction.low) {
          select = "low";
        }
        this.actions.merge(
          ["click", ".prt-double-select[select='" + select + "']"],
          ["wait", ".prt-start,.prt-yes"],
          ["check", ".prt-yes", (next, actions, {selector}) => {
            this.sendAction("poker", "doubleResult").then(({payload}) => {
              // quit after 5 turns
              if (payload.turn >= 5) {
                actions.click(".prt-no").then(next);
              } else {
                actions.merge(
                  ["click", selector],
                  "poker.double"
                ).then(next);
              }
            });
          }, (next, actions) => {
            actions.click(".prt-start").then(next);
          }]
        ).then(resolve, reject);
      }, reject);
    });
  }
};
