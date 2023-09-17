import "./App.css";
import Game from "./components/GameTable/Game";
import Header from "./components/Header";

export default function MyApp() {
    return (
        <>
            <div className="wrapper">
                <div className="game-ui">
                    <Game />
                </div>
            </div>
        </>
    );
}
