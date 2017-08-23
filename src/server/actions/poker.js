import _ from "lodash";
import {request as requestClick} from "./click";

const pokerVars = {
  winningRounds: 0,
  winningChips: 0,
  availableCards: {},
};

export function parseCard(card) {
  const [suit, rank] = card.split("_");
  const result = {
    suit: Number(suit),
    rank: Number(rank)
  };
  // in case of Ace, put it higher than others
  if (result.rank == 1) result.rank = 14;
  return result;
}

export function parseCards(cards) {
  return _.map(cards, parseCard);
}

function initPokerVars() {
  pokerVars.winningChips = 0;
  pokerVars.winningRounds = 0;
}

function resetAvailableCards() {
  _.range(2, 15).forEach((rank) => {
    pokerVars.availableCards[rank] = 4;
  });
}

function rememberCard(card) {
  card = parseCard(card);
  if (pokerVars.availableCards[card.rank] > 0) {
    pokerVars.availableCards[card.rank]--;
  }
}

function findMatchingCards(cards, matchJoker) {
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
      // skip joker cards
      if (initialCard[type] >= 99) return;
      addMatch(type, initialCard, initialIndex);
      _.each(cards, (card, index) => {
        if (index == initialIndex) return;
        if (card[type] == initialCard[type]) {
          addMatch(type, card, index);
        } else if (matchJoker && card[type] >= 99) { // check for joker cards
          addMatch(type, initialCard, index);
        }
      });
    });
  });

  return matches;
}

function someOfAKind(cards, min, matchJoker) {
  const matches = findMatchingCards(cards, matchJoker);
  var result = false;
  _.each(matches.rank, (indexes) => {
    if (indexes.length == min) {
      result = indexes;
      return false;
    }
  });
  return result;
}

export const winningHands = {
  royalStraightFlush(cards) {
    if (!this.straightFlush(cards)) return false;
    var result = [0, 1, 2, 3, 4];
    _.each(cards, (card) => {
      if (card.rank < 10 || card.rank > 14) {
        result = false;
        return false;
      } 
    });
    return result;
  },
  fiveOfAKind(cards) {
    return someOfAKind(cards, 5, true);
  },
  straightFlush(cards) {
    const straight = this.straight(cards);
    const flush = this.flush(cards);
    return straight !== false &&
      flush !== false;
  },
  fourOfAKind(cards) {
    return someOfAKind(cards, 4, true);
  },
  fullHouse(cards) {
    const matches = findMatchingCards(cards, true);
    const numberOfRanks = _.keys(matches.rank).length;
    if (numberOfRanks != 2) return false;
    return [0, 1, 2, 3, 4];
  },
  flush(cards) {
    const matches = findMatchingCards(cards, true);
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
    var wasJoker = false;
    _.each(ranks, (rank) => {
      if (rank >= 99) {
        wasJoker = true;
        return;
      }
      if (lastRank == -1) {
        lastRank = rank;
        return;
      }
      if (wasJoker) {
        wasJoker = false;
      } else if (rank - lastRank != 1) {
        result = false;
        return false;
      }
      lastRank = rank;
    });

    return result;
  },
  threeOfAKind(cards) {
    return someOfAKind(cards, 3, true);
  },
  twoPair(cards) {
    const matches = findMatchingCards(cards, true);
    const pairs = [];
    _.each(matches.rank, (indexes) => {
      if (indexes.length == 2) pairs.push(indexes);
      if (pairs.length >= 2) return false;
    });

    if (pairs.length < 2) return false;

    var result = [];
    _.each(pairs, (pair) => {
      _.each(pair, (index) => {
        result.push(index);
      });
    });
    result = _.uniq(result);

    return result.length == 4 ? result : false;
  },
  onePair(cards) {
    const matches = findMatchingCards(cards, false);
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

const cardRect = {
  left: 170, // 201
  top: 294, // 294
  width: 77, // 77
  height: 109, // 109
  margin: 6 // 6
};

function keepSuggestion(cards) {
  resetAvailableCards();
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
  console.log(cards);

  var indexes = [];
  _.each(checkers, (checker) => {
    const result = checker(cards);
    if (result !== false) {
      result.indexes = _.uniq(result.indexes);
      indexes = result.indexes;
      console.log(result);
      return false;
    }
  });

  _.each(indexes, (index) => {
    scenario.push(["run", (done, fail) => {
      clickCard(index, done, fail);
    }]);
    const rank = cards[index].rank;
    if (pokerVars.availableCards[rank]) {
      pokerVars.availableCards[rank]--;
    }
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
  const initialRank = parseCard(card).rank;
  var high = 0, low = 0, total = 0;

  _.each(pokerVars.availableCards, (count, rank) => {
    // if our card is higher than this card, count as low
    if (initialRank > rank) {
      low += count;
    } else if (initialRank < rank) {
      high += count;
    } else {
      return;
    }
    total += count;
  });

  return {
    low: low / total,
    high: high / total
  };
}

export default {
  poker: function() {
    return new Promise((resolve, reject) => {
      const processCards = (payload) => {
        const scenario = keepSuggestion.call(this, _.values(payload.card_list));
        this.actions["merge.array"](scenario).then(resolve, reject);
      };

      this.sendAction("poker", "deal").then((payload) => {
        if (!payload.card_list) {
          this.sendAction("poker", "initialize").then((payload) => {
            console.log("From initialize model");
            processCards(payload);
          }, reject);
        } else {
          console.log("From deal model");
          processCards(payload);
        }
      }, reject);
    });
  },
  "poker.double": function() {
    initPokerVars();
    return this.actions["poker.double.loop"]();
  },
  "poker.double.loop": function() {
    const winningCaps = {
      round: Number(this.config.Poker.WinningRoundCap),
      chips: Number(this.config.Poker.WinningChipsCap)
    };
    const winningRates = {
      base: Number(this.config.Poker.WinningRateBase),
      modifier: Number(this.config.Poker.WinningRateModifier)
    };
    const doubleUpLoop = (resolve, reject) => {
      this.sendAction("poker", "doubleStart").then((payload) => {
        const prediction = predictDouble(payload.card_first);
        var select = "high";
        if (prediction.high < prediction.low) {
          select = "low";
        } else if (prediction.high == prediction.low) { // in case of 50:50, just randomize
          select = Math.random() < 0.5 ? "low" : "high";
        }

        const currentRate = select == "high" ? prediction.high : prediction.low;
        console.log("-------- DOUBLE UP PREDICTION --------");
        console.log("Winning rate: " + currentRate + " " + select);

        this.actions.merge(
          ["click", ".prt-double-select[select='" + select + "']"],
          ["wait", ".prt-start,.prt-yes"],
          ["check", ".prt-yes", (next, actions, {selector}) => {
            this.sendAction("poker", "doubleResult").then((payload) => {
              if (payload.result == "win") {
                pokerVars.winningRounds++;
                pokerVars.winningChips = payload.pay_medal;
              }

              rememberCard(payload.card_first);
              const nextPredict = predictDouble(payload.card_second);
              const highestRate = nextPredict.high > nextPredict.low ?
                nextPredict.high : nextPredict.low;

              const maximumRate = 1.0;
              var minimumRate = 0;
              if (pokerVars.winningChips >= winningCaps.chips) {
                // multiplier is calculated from how many chips are won that have passed the cap
                const rateMultiplier = (pokerVars.winningChips / winningCaps.chips);
                minimumRate = winningRates.base + (winningRates.modifier * rateMultiplier);
              } else if (pokerVars.winningRounds >= winningCaps.round) {
                // multiplier is calculated from how many winning rounds have passed the cap
                const rateMultiplier = (pokerVars.winningRounds - winningCaps.round);
                minimumRate = winningRates.base + (winningRates.modifier * rateMultiplier);
              }

              minimumRate = minimumRate > maximumRate ? maximumRate : minimumRate;
              const shouldStop = highestRate < minimumRate ;
              console.log("-------- DOUBLE UP RESULT --------");
              console.log("Chips won: " + pokerVars.winningChips);
              console.log("Rounds won: " + pokerVars.winningRounds);
              console.log("Next round winning rate is: " + highestRate);
              console.log("Next round minimum winning rate: " + minimumRate);
              console.log(shouldStop ? "Exiting double up" : "Continuing double up");

              // the minimum winning rate is taken from the base cap modified by multiplied modifier
              // finally, decide if the bot should stop depending on the next predicted winning rate
              if (shouldStop) {
                actions.merge(
                  ["click", ".prt-no"],
                  ["wait", ".prt-start"],
                  ["timeout", 1000],
                  ["click", ".prt-start:not(.disable)"]
                ).then(next);
              } else {
                actions.merge(
                  ["click", selector],
                  "poker.double.loop"
                ).then(next);
              }
            });
          }, (next, actions) => {
            actions.click(".prt-start").then(next);
          }]
        ).then(resolve, reject);
      }, reject);
    };
    return new Promise((resolve, reject) => {
      this.actions.wait(".prt-double-select:not(.disable)").then(() => {
        doubleUpLoop(resolve, reject);
      }, reject);
    });
  }
};
