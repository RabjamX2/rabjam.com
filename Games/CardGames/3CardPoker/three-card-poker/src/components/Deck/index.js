import React, { useState, useEffect } from "react";
import Card from "../Card";
import { deckMaker } from "../../modules/deckMaker";

const Deck = () => {
    // Use state to manage the deck of cards
    const myDeck = deckMaker(1, false, 0);
    console.log(myDeck);
    const [deck, setDeck] = useState(myDeck);

    // Function to shuffle the deck using Fisher-Yates algorithm
    const shuffleDeck = () => {
        const shuffledDeck = [...deck];
        for (let i = shuffledDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
        }
        setDeck(shuffledDeck);
    };

    // // useEffect to shuffle the deck when the component mounts
    // useEffect(() => {
    //     shuffleDeck();
    // }, []);

    return (
        <div className="deck">
            {/* Render the shuffled deck */}
            {deck.map((card, index) => (
                <Card suit={card.suit} rank={card.rank} name={card.imageName} />
            ))}
            {/* Button to shuffle the deck */}
            <button onClick={shuffleDeck}>Shuffle Deck</button>
        </div>
    );
};

export default Deck;
