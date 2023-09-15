document.addEventListener("DOMContentLoaded", function () {
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

    function coordToID(coord) {
        return `${coord.row}_${coord.col}`;
    }

    function IDToCoord(ID) {
        const coord = ID.split(`_`);
        const row = coord[0];
        const col = coord[1];
        return { row: row, col: col };
    }

    function initializeBoard(Game) {
        if (
            Game.boardHeight > 1 &&
            Game.boardWidth > 1 &&
            Game.numberOfMines <= Game.boardHeight * Game.boardWidth - 2 &&
            Game.numberOfMines > 1
        ) {
            updateElements(Game);

            const boardContainer = document.getElementById("board");
            boardContainer.style.gridTemplateColumns = `repeat(${Game.boardWidth}, 0fr)`;
            boardContainer.innerHTML = "";

            for (const cellName of Object.keys(Game.board)) {
                const cell = document.createElement("div");
                cell.id = cellName;
                Game.board[cellName].element = cell;
                boardContainer.appendChild(cell);
                // console.log(cell);
            }
        } else {
            console.error(
                `Conditions are wrong ${Game.boardHeight} ${Game.boardWidth} ${Game.numberOfMines} ${Game.firstClickMode}`
            );
        }
    }

    function createBoard(Parent) {
        const board = {};
        for (let index = 0; index < Parent.boardHeight * Parent.boardWidth; index++) {
            let temprow = Math.floor(index / Parent.boardWidth);
            let tempcol = index % Parent.boardWidth;
            board[`${temprow + 1}_${tempcol + 1}`] = {
                row: temprow + 1,
                col: tempcol + 1,
                _isAMine: false,
                _isRevealed: false,
                isFlagged: false,

                get isAMine() {
                    return this._isAMine;
                },
                set isAMine(value) {
                    this._isAMine = value;
                },

                get isRevealed() {
                    return this._isRevealed;
                },
                set isRevealed(value) {
                    this._isRevealed = value;
                },
                // Function to check if isRevealed and isAMine are both true
                revealABomb() {
                    if (this._isAMine) {
                        return true;
                    } else {
                        this._isRevealed = true;
                        return false;
                    }
                },

                // Function to calculate and set adjacentMineCount
                get adjacentMineCount() {
                    let mineCount = 0;

                    // Loop through the adjacent cells and count mines
                    for (const offset of Parent.offsets) {
                        const neighborRow = this.row + offset.dy;
                        const neighborCol = this.col + offset.dx;

                        // Check if the neighbor cell is in the dictionary and contains a mine
                        const neighborKey = `${neighborRow}_${neighborCol}`;
                        if (Parent.board[neighborKey] && Parent.board[neighborKey]._isAMine) {
                            mineCount++;
                        }
                    }
                    return mineCount;
                },
                get element() {
                    return this._element;
                },
                set element(theElement) {
                    this._element = theElement;
                    theElement.classList.add("cell", "hidden");
                    theElement.addEventListener("click", () => {
                        if (Parent.isFirstClick) {
                            Parent.isFirstClick = false;
                            this.placeMines({ row: this.row, col: this.col });
                            this.revealCell({ row: this.row, col: this.col }, true);
                        } else if (!this._isRevealed && !this.isFlagged) {
                            this.revealCell({ row: this.row, col: this.col }, true);
                        }
                    });
                    theElement.addEventListener("contextmenu", (e) => {
                        e.preventDefault();
                        if (!Parent.isFirstClick && !this._isRevealed) {
                            this.flagCell();
                        }
                    });
                },
                flagCell() {
                    if (this.isFlagged) {
                        this.isFlagged = false;
                        this._element.classList.remove("flagged");
                    } else {
                        this.isFlagged = true;
                        this._element.classList.add("flagged");
                    }
                },
                placeMines(clickCoord) {
                    const cellList = [];
                    for (const cellName of Object.keys(Parent.board)) {
                        if (Parent.firstClickMode === "standard") {
                            if (cellName === coordToID(clickCoord)) {
                                console.log("Removed ", cellName);
                                continue;
                            }
                        }
                        cellList.push(cellName);
                    }

                    for (let minesPlaced = 0; minesPlaced < Parent.numberOfMines; minesPlaced++) {
                        const randIndex = Math.floor(Math.random() * cellList.length);
                        const cellToMine = cellList.splice(randIndex, 1);
                        console.log(cellToMine[0]);
                        Parent.board[cellToMine[0]]._isAMine = true;
                    }
                },
                revealCell(cellCoord, clicked) {
                    Parent.board[coordToID(cellCoord)]._element.classList.remove("hidden");
                    Parent.board[coordToID(cellCoord)]._isRevealed = true;
                    if (Parent.board[coordToID(cellCoord)].revealABomb() && clicked) {
                        Parent.board[coordToID(cellCoord)]._element.classList.add("mistake");
                        Parent.didYouWin(false);
                        return;
                    } else {
                        const thisadjacentMineCount = Parent.board[coordToID(cellCoord)].adjacentMineCount;
                        Parent.board[coordToID(cellCoord)]._element.innerText =
                            thisadjacentMineCount === 0 ? " " : thisadjacentMineCount;

                        if (thisadjacentMineCount === 0) {
                            Parent.board[coordToID(cellCoord)]._element.innerText = " ";
                            for (const offset of Parent.offsets) {
                                const newCol = cellCoord.col + offset.dx;
                                const newRow = cellCoord.row + offset.dy;
                                // console.log("testing ", newRow, " ", newCol);
                                if (newCol < 1 || newRow < 1) continue;
                                // console.log("Passed 1 Test", Parent.boardWidth, " ", Parent.boardHeight);
                                if (newCol > Parent.boardWidth || newRow > Parent.boardHeight) continue;
                                if (
                                    Parent.board[`${newRow}_${newCol}`]._isRevealed ||
                                    Parent.board[`${newRow}_${newCol}`].isFlagged
                                )
                                    continue;
                                // console.log("revealing ", newRow, " ", newCol);
                                this.revealCell({ row: newRow, col: newCol }, false);
                            }
                        } else {
                            Parent.board[coordToID(cellCoord)]._element.innerText = thisadjacentMineCount;
                        }
                    }

                    if (Parent.revealedCellCount >= Parent.boardHeight * Parent.boardWidth - Parent.numberOfMines) {
                        Parent.didYouWin(true);
                    }
                },
            };
        }
        // console.log(board);
        return board;
    }

    const FreshGame = {
        boardHeight: 10,
        boardWidth: 10,
        numberOfMines: 10,
        firstClickMode: `standard`,
        offsets: [
            { dx: -1, dy: -1 },
            { dx: -1, dy: 0 },
            { dx: -1, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 1, dy: 1 },
        ],
        isFirstClick: true,
        get revealedCellCount() {
            let revealedCellCount = 0;
            for (const cell of Object.values(this.board)) {
                cell.isRevealed ? revealedCellCount++ : false;
            }
            return revealedCellCount;
        },
        get boardSize() {
            return this.boardHeight * this.boardWidth;
        },
        get board() {
            if (this._board === undefined) this._board = createBoard(this);
            return this._board;
        },
        didYouWin(win) {
            if (!this.isGameOver) {
                if (win) {
                    for (const cellName of Object.keys(this._board)) {
                        if (this._board[cellName]._isAMine && !this._board[cellName].isFlagged) {
                            this._board[cellName].flagCell();
                        }
                    }
                    alert("WIN!");
                } else {
                    for (const cellName of Object.keys(this._board)) {
                        if (!this._board[cellName].isFlagged && this._board[cellName]._isAMine) {
                            const revealedMine = document.getElementById(cellName);
                            revealedMine.classList.remove("hidden");
                            revealedMine.classList.add("mine");
                        }
                        if (this._board[cellName].isFlagged && !this._board[cellName]._isAMine) {
                            const falseFlag = document.getElementById(cellName);
                            falseFlag.classList.add("mistake");
                        }
                    }
                    alert("Game Over!");
                }
                this.isGameOver = true;
            }
        },
    };
    initializeBoard(FreshGame);

    document.getElementById("startGame").addEventListener("click", function () {
        const GameObject = {
            boardHeight: boardHeightElement.value,
            boardWidth: boardWidthElement.value,
            numberOfMines: numberOfMinesElement.value,
            firstClickMode: firstClickModeElement.value,
            offsets: [
                { dy: -1, dx: -1 },
                { dy: -1, dx: 0 },
                { dy: -1, dx: 1 },
                { dy: 0, dx: -1 },
                { dy: 0, dx: 1 },
                { dy: 1, dx: -1 },
                { dy: 1, dx: 0 },
                { dy: 1, dx: 1 },
            ],
            isFirstClick: true,
            isGameOver: false,
            boardSize: this.boardHeight * this.boardWidth,
            get revealedCellCount() {
                let revealedCellCount = 0;
                for (const cell of Object.values(this.board)) {
                    cell.isRevealed ? revealedCellCount++ : false;
                }
                return revealedCellCount;
            },
            get boardSize() {
                return this.boardHeight * this.boardWidth;
            },
            get board() {
                if (this._board === undefined) this._board = createBoard(this);
                return this._board;
            },
            didYouWin(win) {
                if (!this.isGameOver) {
                    if (win) {
                        for (const cellName of Object.keys(this._board)) {
                            if (this._board[cellName]._isAMine && !this._board[cellName].isFlagged) {
                                this._board[cellName].flagCell();
                            }
                        }
                        alert("WIN!");
                    } else {
                        for (const cellName of Object.keys(this._board)) {
                            if (!this._board[cellName].isFlagged && this._board[cellName]._isAMine) {
                                const revealedMine = document.getElementById(cellName);
                                revealedMine.classList.remove("hidden");
                                revealedMine.classList.add("mine");
                            }
                            if (this._board[cellName].isFlagged && !this._board[cellName]._isAMine) {
                                const falseFlag = document.getElementById(cellName);
                                falseFlag.classList.add("mistake");
                            }
                        }
                        alert("Game Over!");
                    }
                    this.isGameOver = true;
                }
            },
        };

        initializeBoard(GameObject);
        console.log("Started Game");
    });
});
