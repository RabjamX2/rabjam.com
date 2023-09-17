import React from "react";
import "./index.css";
import Card from "../../Card";

const Player = ({ cards }, name, playerIndex) => {
    console.log(name);
    return (
        <div className={`player player_${playerIndex}`} style={{ left: "50%", top: "50%" }}>
            <h2>Player {playerIndex}</h2>
            <div className="cards">
                {cards.length > 0 ? (
                    cards.map((card, index) => (
                        <Card key={index} suit={card.suit} rank={card.rank} name={card.imageName} />
                    ))
                ) : (
                    <p>No cards</p>
                )}
            </div>
        </div>
    );
};

export default Player;
