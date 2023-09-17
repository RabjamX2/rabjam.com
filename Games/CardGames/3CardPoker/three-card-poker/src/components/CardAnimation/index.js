import React, { useState } from "react";
import "./index.css"; // Import your CSS file
import Card from "../Card";

const CardAnimation = () => {
    const [isFlipped, setIsFlipped] = useState(false);

    const flipCard = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className={`card-container ${isFlipped ? "flipped" : ""}`}>
            <div className="card" onClick={flipCard} />
        </div>
    );
};

export default CardAnimation;
