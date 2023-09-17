import React from "react";
import * as Cards from "../CardSVGs/fronts/defaultImporter";
import JR from "../CardSVGs/fronts/default/joker_red";
import JB from "../CardSVGs/fronts/default/joker_black";

import Back from "../CardSVGs/fronts/default/back";

// console.log(svgs);
const Card = ({ rank, suit, name }) => {
    let TheCard;
    if (suit === `back`) {
        TheCard = Back;
    } else if (suit === `joker`) {
        TheCard = rank === "red" ? JR : JB;
    } else {
        TheCard = Cards[`_${name}`];
    }
    return (
        <div className="card front">
            <TheCard />
        </div>
    );
};

export default Card;
