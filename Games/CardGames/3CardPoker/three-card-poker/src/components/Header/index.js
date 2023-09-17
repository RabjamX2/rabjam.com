import "./index.css";

function Header() {
    return (
        <div className="header">
            <ul>
                <li>
                    <div>Home</div>
                </li>
                <li className="dropdown">
                    <div>Games</div>
                    <div className="dropdown-content-container">
                        <a className="dropdown-content" href="Games/MinesWeeper/MinesWeeper.html">
                            MinesWeeper
                        </a>
                        <a className="dropdown-content" href="Games/CardGames/TexasHoldEm.html">
                            Texas Hold'Em
                        </a>
                        <a className="dropdown-content" href="Games/CardGames/3CardPoker.html">
                            3 Card Poker
                        </a>
                        <h3 className="dropdown-header">Riddles</h3>
                        <a className="dropdown-content" href="Games/Riddles/catRiddle.html">
                            Cat-in-a-box
                        </a>
                    </div>
                </li>
                <li>
                    <div>Gadgets</div>
                </li>
                <li className="dropdown">
                    <a href="./">Sandbox</a>
                    <div className="dropdown-content-container">
                        <a className="dropdown-content" href="/Sandbox/hexGen.html">
                            Spiral Hexagon
                        </a>
                    </div>
                </li>
                <li>
                    <a href="./">About</a>
                </li>
            </ul>

            <button id="dark-mode-toggle">Dark Mode</button>
        </div>
    );
}

export default Header;
