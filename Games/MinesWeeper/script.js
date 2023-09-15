const neighbors = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];
const boardHeightElement = document.getElementById(`boardHeightInput`);
const boardWidthElement = document.getElementById(`boardWidthInput`);
const numberOfMinesElement = document.getElementById(`numberOfMinesInput`);
const firstClickModesList = ["Standard", "Unlucky", "No Guesses"];
const firstClickModeElement = document.getElementById(`firstClickModeInput`); // "standard"; // "unlucky" = can hit bomb on first cell | "standard" = can't hit bomb | "noguess" = will always first click cell with no adjacent bombs
firstClickModesList.forEach((method) => {
    const option = document.createElement("option");
    option.value = method; // Set the option's value
    option.textContent = method; // Set the text content
    firstClickModeElement.appendChild(option); // Append the option to the select element
});

const boardHeightValue = document.getElementById(`boardHeight`);
const boardWidthValue = document.getElementById(`boardWidth`);
const numberOfMinesValue = document.getElementById(`numberOfMines`);
const firstClickModeValue = document.getElementById(`firstClickMode`);

function updateElements(Game) {
    boardHeightValue.innerHTML = Game.boardHeight;
    boardWidthValue.innerHTML = Game.boardWidth;
    numberOfMinesValue.innerHTML = Game.numberOfMines;
    firstClickModeValue.innerHTML = Game.firstClickMode;
}

function coordToID(coord, Game) {
    return coord[0] * Game.boardWidth + coord[1];
}

function IDToCoord(ID, Game) {
    const x = Math.floor(ID / Game.boardWidth);
    const y = ID - x * Game.boardWidth;
    return [x, y];
}

function initializeBoard(Game) {
    if (
        Game.boardHeight > 1 &&
        Game.boardWidth > 1 &&
        Game.numberOfMines <= Game.boardHeight * Game.boardWidth - 2 &&
        Game.numberOfMines > 1
    ) {
        updateElements(Game);

        Game.cleanMatrix = Array.from({ length: Game.boardHeight * Game.boardWidth }, (x, i) => [
            Math.floor(i / Game.boardWidth),
            i - Math.floor(i / Game.boardWidth) * Game.boardWidth,
        ]);

        document.getElementById("board").style.gridTemplateColumns = `repeat(${Game.boardWidth}, 0fr)`;
        for (let i = 0; i < Game.boardHeight; i++) {
            Game.board[i] = [];
            for (let j = 0; j < Game.boardWidth; j++) {
                let theID = i * Game.boardWidth + j; // i = Math.floor(theID / Game.boardWidth)    ,  j = theID - Math.floor(theID / Game.boardWidth) * Game.boardWidth
                Game.board[i][j] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    count: 0,
                    correctFlag: false,
                    id: theID,
                    coord: `${i}, ${j}`,
                };
            }
        }

        const boardContainer = document.querySelector(".board");
        boardContainer.innerHTML = "";

        for (let x = 0; x < Game.boardHeight; x++) {
            for (let y = 0; y < Game.boardWidth; y++) {
                const cell = document.createElement("div");
                cell.id = `${x}_${y}`;
                cell.classList.add("cell", "hidden");

                cell.addEventListener("click", () => {
                    if (Game.isFirstClick) {
                        placeMines([x, y], Game);
                        countAdjacentMinesForAllCells(Game);
                        Game.isFirstClick = false;
                        revealCell(x, y, Game);
                    } else if (!Game.board[x][y].revealed && !Game.board[x][y].flagged) {
                        revealCell(x, y, Game);
                    }
                });

                cell.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    if (!Game.isFirstClick && !Game.board[x][y].revealed) {
                        flagCell(x, y, Game);
                    }
                });

                boardContainer.appendChild(cell);
            }
        }
    } else {
        console.error(
            `Conditions are wrong ${Game.boardHeight} ${Game.boardWidth} ${Game.numberOfMines} ${Game.firstClickMode}`
        );
    }
}

function placeMines(clickCoord, Game) {
    Game.mines = [];
    if (Game.firstClickMode === "standard") {
        Game.cleanMatrix.splice(coordToID(clickCoord, Game), 1);
    }
    /*
    console.log(
        Game.cleanMatrix.findIndex((pair) => {
            return pair[0] === pairToRemove[0] && pair[1] === pairToRemove[1];
        })
    );
    */
    for (let minesPlaced = 0; minesPlaced < Game.numberOfMines; minesPlaced++) {
        const randIndex = Math.floor(Math.random() * Game.cleanMatrix.length);
        Game.mines = Game.mines.concat(Game.cleanMatrix.splice(randIndex, 1));
    }

    for (let mineCoord of Game.mines) {
        Game.board[mineCoord[0]][mineCoord[1]].mine = true;
    }
}

function countAdjacentMines(row, col, Game) {
    for (let i = 0; i < neighbors.length; i++) {
        const [dx, dy] = neighbors[i];
        const newRow = row + dx;
        const newCol = col + dy;

        if (
            newRow >= 0 &&
            newRow < Game.boardHeight &&
            newCol >= 0 &&
            newCol < Game.boardWidth &&
            Game.board[newRow][newCol].mine
        ) {
            Game.board[row][col].count++;
        }
    }
}

function countAdjacentMinesForAllCells(Game) {
    for (let i = 0; i < Game.boardHeight; i++) {
        for (let j = 0; j < Game.boardWidth; j++) {
            if (!Game.board[i][j].mine) {
                countAdjacentMines(i, j, Game);
            }
        }
    }
}

function revealCell(row, col, Game) {
    Game.board[row][col].revealed = true;
    const cellElement = document.getElementById(`${row}_${col}`);
    cellElement.classList.remove("hidden");
    if (Game.board[row][col].mine) {
        cellElement.classList.add("mistake");
        console.log("somehow Lost", row, col, Game);
        didYouWin(false, Game);
        return;
    } else {
        if (!Game.isGameOver) {
            Game.revealedCellCount += 1;
        }
        cellElement.innerText = Game.board[row][col].count === 0 ? " " : Game.board[row][col].count;

        if (Game.board[row][col].count === 0) {
            for (let i = 0; i < neighbors.length; i++) {
                const [dx, dy] = neighbors[i];
                const newRow = row + dx;
                const newCol = col + dy;

                if (
                    newRow >= 0 &&
                    newRow < Game.boardHeight &&
                    newCol >= 0 &&
                    newCol < Game.boardWidth &&
                    !Game.board[newRow][newCol].revealed
                ) {
                    revealCell(newRow, newCol, Game);
                }
            }
        }
    }

    if (Game.revealedCellCount >= Game.boardHeight * Game.boardWidth - Game.numberOfMines) {
        didYouWin(true, Game);
        Game.revealedCellCount = 0;
    }
}

function flagCell(row, col, Game) {
    const cellElement = document.getElementById(`${row}_${col}`);

    if (Game.board[row][col].flagged) {
        Game.board[row][col].flagged = false;
        if (Game.board[row][col].mine) {
            Game.board[row][col].correctFlag = false;
        }
        Game.flagsAsID.splice(Game.flagsAsID.indexOf(coordToID([row, col], Game)), 1);
        cellElement.classList.remove("flagged");
    } else {
        Game.board[row][col].flagged = true;
        if (Game.board[row][col].mine) {
            Game.board[row][col].correctFlag = true;
        }
        Game.flagsAsID.push(coordToID([row, col], Game));
        cellElement.classList.add("flagged");
    }
}

function didYouWin(win, Game) {
    if (!Game.isGameOver) {
        if (win) {
            for (let mineCoord of Game.mines) {
                if (!Game.board[mineCoord[0]][mineCoord[1]].flagged) {
                    const revealedMine = document.getElementById(`${mineCoord[0]}_${mineCoord[1]}`);
                    flagCell(mineCoord[0], mineCoord[1], Game);
                }
            }
            alert("WIN!");
        } else {
            for (let mineCoord of Game.mines) {
                if (!Game.board[mineCoord[0]][mineCoord[1]].flagged) {
                    const revealedMine = document.getElementById(`${mineCoord[0]}_${mineCoord[1]}`);
                    revealedMine.classList.remove("hidden");
                    revealedMine.classList.add("mine");
                }
            }
            for (let flag of Game.flagsAsID) {
                const coordOfFlag = IDToCoord(flag, Game);
                if (!Game.board[coordOfFlag[0]][coordOfFlag[1]].correctFlag) {
                    const falseFlag = document.getElementById(`${coordOfFlag[0]}_${coordOfFlag[1]}`);
                    falseFlag.classList.add("mistake");
                }
            }
            alert("Game Over!");
        }
        Game.isGameOver = true;
    }
}

document.getElementById("startGame").addEventListener("click", function () {
    const GameObject = {
        boardHeight: boardHeightElement.value,
        boardWidth: boardWidthElement.value,
        numberOfMines: numberOfMinesElement.value,
        firstClickMode: firstClickModeElement.value,
        board: [],
        cleanMatrix: [],
        mines: [],
        flagsAsID: [],
        revealedCellCount: 0,
        isFirstClick: true,
        isGameOver: false,
    };
    initializeBoard(GameObject);
    console.log("Started Game");
});

let FreshGame = {
    boardHeight: 10,
    boardWidth: 10,
    numberOfMines: 10,
    firstClickMode: "standard",
    board: [],
    cleanMatrix: [],
    mines: [],
    flagsAsID: [],
    revealedCellCount: 0,
    isFirstClick: true,
    isGameOver: false,
};
initializeBoard(FreshGame);
