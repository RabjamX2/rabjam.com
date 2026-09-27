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
let boardHeight = 10;
let boardWidth = 10;
let numberOfMines = 5;
let board = [];
//let cleanArray = [];
let cleanMatrix = [];
let mines = [];
let flagsAsID = [];
let revealedCellCount = 0;
let isGameOver = false;
let firstClickMode = "standard"; // "unlucky" = can hit bomb on first cell | "standard" = can't hit bomb | "noguess" = will always first click cell with no adjacent bombs

function coordToID(coord) {
    return coord[0] * boardWidth + coord[1];
}

function IDToCoord(ID) {
    // only useful if cleanArray is used instead of cleanMatrix
    const x = Math.floor(ID / boardWidth);
    const y = ID - x * boardWidth;
    return [x, y];
}

function initializeBoard() {
    if (boardHeight > 1 && boardWidth > 1 && numberOfMines <= boardHeight * boardWidth - 2 && numberOfMines > 1) {
        let isFirstClick = true;
        isGameOver = false;
        revealedCellCount = 0;
        flagsAsID = [];

        //cleanArray = Array.from({ length: boardHeight * boardWidth }, (x, i) => i);
        cleanMatrix = Array.from({ length: boardHeight * boardWidth }, (x, i) => [
            Math.floor(i / boardWidth),
            i - Math.floor(i / boardWidth) * boardWidth,
        ]);

        document.getElementById("board").style.gridTemplateColumns = `repeat(${boardWidth}, 0fr)`;
        for (let i = 0; i < boardHeight; i++) {
            board[i] = [];
            for (let j = 0; j < boardWidth; j++) {
                let theID = i * boardWidth + j; // i = Math.floor(theID / boardWidth)    ,  j = theID - Math.floor(theID / boardWidth) * boardWidth
                board[i][j] = {
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

        for (let x = 0; x < boardHeight; x++) {
            for (let y = 0; y < boardWidth; y++) {
                const cell = document.createElement("div");
                cell.id = `${x}_${y}`;
                cell.classList.add("cell", "hidden");

                cell.addEventListener("click", () => {
                    if (isFirstClick) {
                        placeMines([x, y]);
                        countAdjacentMinesForAllCells();
                        isFirstClick = false;
                        revealCell(x, y);
                    } else if (!board[x][y].revealed && !board[x][y].flagged) {
                        revealCell(x, y);
                    }
                });

                cell.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    if (!isFirstClick && !board[x][y].revealed) {
                        flagCell(x, y);
                    }
                });

                boardContainer.appendChild(cell);
            }
        }
    } else {
        console.error("Conditions are wrong");
    }
}

function placeMines(firstClick) {
    mines = [];
    if (firstClickMode === "standard") {
        cleanMatrix.splice(coordToID(firstClick), 1);
    }
    /*
    console.log(
        cleanMatrix.findIndex((pair) => {
            return pair[0] === pairToRemove[0] && pair[1] === pairToRemove[1];
        })
    );
    */
    for (let minesPlaced = 0; minesPlaced < numberOfMines; minesPlaced++) {
        const randIndex = Math.floor(Math.random() * cleanMatrix.length);
        mines = mines.concat(cleanMatrix.splice(randIndex, 1));
    }

    for (let mineCoord of mines) {
        board[mineCoord[0]][mineCoord[1]].mine = true;
    }
}

function countAdjacentMines(row, col) {
    for (let i = 0; i < neighbors.length; i++) {
        const [dx, dy] = neighbors[i];
        const newRow = row + dx;
        const newCol = col + dy;

        if (newRow >= 0 && newRow < boardHeight && newCol >= 0 && newCol < boardWidth && board[newRow][newCol].mine) {
            board[row][col].count++;
        }
    }
}

function countAdjacentMinesForAllCells() {
    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            if (!board[i][j].mine) {
                countAdjacentMines(i, j);
            }
        }
    }
}

function revealCell(row, col) {
    board[row][col].revealed = true;
    const cellElement = document.getElementById(`${row}_${col}`);
    cellElement.classList.remove("hidden");
    if (board[row][col].mine) {
        cellElement.classList.add("mistake");
        didYouWin(false);
        return;
    } else {
        if (!isGameOver) {
            revealedCellCount += 1;
        }
        cellElement.innerText = board[row][col].count === 0 ? " " : board[row][col].count;

        if (board[row][col].count === 0) {
            for (let i = 0; i < neighbors.length; i++) {
                const [dx, dy] = neighbors[i];
                const newRow = row + dx;
                const newCol = col + dy;

                if (
                    newRow >= 0 &&
                    newRow < boardHeight &&
                    newCol >= 0 &&
                    newCol < boardWidth &&
                    !board[newRow][newCol].revealed
                ) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }

    if (revealedCellCount >= boardHeight * boardWidth - numberOfMines) {
        didYouWin(true);
        revealedCellCount = 0;
    }
}

function flagCell(row, col) {
    const cellElement = document.getElementById(`${row}_${col}`);

    if (board[row][col].flagged) {
        board[row][col].flagged = false;
        if (board[row][col].mine) {
            board[row][col].correctFlag = false;
        }
        flagsAsID.splice(flagsAsID.indexOf(coordToID([row, col])), 1);
        cellElement.classList.remove("flagged");
    } else {
        board[row][col].flagged = true;
        if (board[row][col].mine) {
            board[row][col].correctFlag = true;
        }
        flagsAsID.push(coordToID([row, col]));
        cellElement.classList.add("flagged");
    }
}

function didYouWin(win) {
    if (!isGameOver) {
        if (win) {
            for (let mineCoord of mines) {
                if (!board[mineCoord[0]][mineCoord[1]].flagged) {
                    const revealedMine = document.getElementById(`${mineCoord[0]}_${mineCoord[1]}`);
                    flagCell(mineCoord[0], mineCoord[1]);
                }
            }
            alert("WIN!");
        } else {
            for (let mineCoord of mines) {
                if (!board[mineCoord[0]][mineCoord[1]].flagged) {
                    const revealedMine = document.getElementById(`${mineCoord[0]}_${mineCoord[1]}`);
                    revealedMine.classList.remove("hidden");
                    revealedMine.classList.add("mine");
                }
            }
            for (let flag of flagsAsID) {
                const coordOfFlag = IDToCoord(flag);
                if (!board[coordOfFlag[0]][coordOfFlag[1]].correctFlag) {
                    const falseFlag = document.getElementById(`${coordOfFlag[0]}_${coordOfFlag[1]}`);
                    falseFlag.classList.add("mistake");
                }
            }
            alert("Game Over!");
        }
        isGameOver = true;
    }
}

document.getElementById("startGame").addEventListener("click", function () {
    initializeBoard();
    console.log("Started Game");
});

initializeBoard();
