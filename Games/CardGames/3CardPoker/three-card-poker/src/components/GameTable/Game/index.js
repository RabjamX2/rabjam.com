import React, { useState, useEffect } from "react";
import "./index.css";
import { deckMaker } from "../../../modules/deckMaker";
import Player from "../Player";
import Back from "../../CardSVGs/fronts/default/back";

const Game = () => {
    // Use state to manage the deck of cards
    const myDeck = deckMaker(1, true, 0);
    const [deck, setDeck] = useState(myDeck);
    const [playerHand, setPlayerHand] = useState([]);

    const drawCard = () => {
        if (deck.length === 0) {
            // Handle when the deck is empty
            alert("The deck is empty!");
            return;
        }

        const updatedDeck = [...deck]; // Create a copy of the deck
        const drawnCard = updatedDeck.pop(); // Remove the last card from the copy
        setDeck(updatedDeck); // Update the deck state
        const newHand = [...playerHand];
        newHand.push(drawnCard);
        setPlayerHand(newHand);
    };

    return (
        <div className="game-container">
            <div className="game-table-container">
                <div className="table-container">
                    <div className="table"></div>
                </div>
                {playerHand.length > 0 && <Player cards={playerHand} />}
                <button onClick={drawCard}>Draw Card</button>
                <div className="deck">
                    <h3>Remaining Cards: {deck.length}</h3>
                    <ul>
                        {/* {deck.map((card, index) => (
                        <li key={index}>{`${card.rank} of ${card.suit}`}</li>
                    ))} */}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Game;
