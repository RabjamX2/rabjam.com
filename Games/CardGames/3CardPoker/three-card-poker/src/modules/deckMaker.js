function deckMaker(numberOfDecks = 1, shuffled = false, jokerPerDeck = 0) {
    const suits = ["spades", "hearts", "diamonds", "clubs"];
    const faceCardsDict = { 1: "ace", 11: "jack", 12: "queen", 13: "king" };
    const numberWordsDict = {
        1: "one",
        2: "two",
        3: "three",
        4: "four",
        5: "five",
        6: "six",
        7: "seven",
        8: "eight",
        9: "nine",
        10: "ten",
        11: "eleven",
        12: "twelve",
        13: "thirteen",
    };
    const jokerColors = [`red`, `black`];
    class CardGenerator {
        constructor(rank, suit, deckId) {
            this.rank = rank;
            this.suit = suit;
            this.deckId = deckId;
            if (rank in faceCardsDict) {
                this.rankName = faceCardsDict[rank];
                this.blackjackValue = rank === 1 ? 11 : 10;
                this.type = rank !== 1 ? "face" : "ace";
                this.imageName = `${this.rankName[0].toUpperCase()}${this.suit[0].toUpperCase()}`;
            } else if (Number.isInteger(rank)) {
                this.blackjackValue = rank;
                this.type = "number";
                this.rankName = numberWordsDict[rank];
                this.imageName = `${this.rankName}`;
                this.imageName = `${rank === 10 ? `T` : rank}${this.suit[0].toUpperCase()}`;
            } else {
                this.blackjackValue = rank;
                this.type = "joker";
                this.rankName = rank;
            }
        }

        toString() {
            return `${faceCardsDict[this.rank]?.capitalize() || this.rank} of ${this.suit.capitalize()}s`;
        }
    }

    const unshuffledDeck = [];
    for (let deckId = 0; deckId < numberOfDecks; deckId++) {
        for (const suit of suits) {
            for (let rank = 1; rank <= 13; rank++) {
                unshuffledDeck.push(new CardGenerator(rank, suit, deckId));
            }
        }
        if (jokerPerDeck) {
            for (let jokerCount = 0; jokerCount < jokerPerDeck; jokerCount++) {
                unshuffledDeck.push(new CardGenerator(jokerColors[jokerCount], `joker`, deckId));
            }
        }
    }

    if (shuffled) {
        return deckShuffler(unshuffledDeck);
    } else {
        return unshuffledDeck;
    }
}

function deckShuffler(deck) {
    const shuffledDeck = [];
    while (deck.length > 0) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        const pickedCard = deck.splice(randomIndex, 1)[0];
        shuffledDeck.push(pickedCard);
    }
    return shuffledDeck;
}

export { deckMaker };
