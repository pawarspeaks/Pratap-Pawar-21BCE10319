const socket = io();
const gameBoard = document.getElementById('game-board');
const controls = document.getElementById('controls');
const statusDisplay = document.getElementById('status');
const moveOptions = document.getElementById('move-options');

let currentGameState = null;
let selectedCharacter = null;
let playerId = null;

function initializeBoard() {
    gameBoard.innerHTML = '';
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${row}-${col}`;
            cell.addEventListener('click', () => handleCellClick(row, col));
            gameBoard.appendChild(cell);
        }
    }
}

function updateBoard(gameState) {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.getElementById(`cell-${row}-${col}`);
            const character = gameState.board[row][col];
            if (character) {
                const playerLabel = gameState.players.indexOf(character.player) === 0 ? 'A' : 'B';
                cell.textContent = `${playerLabel}-${character.type}`;
            } else {
                cell.textContent = '';
            }
            cell.className = 'cell' + (character ? ` player-${character.player === playerId ? 'A' : 'B'}` : '');
        }
    }
}

function updateControls(gameState) {
    controls.innerHTML = '';
    if (gameState.currentPlayer === playerId) {
        const selectButton = document.createElement('button');
        selectButton.textContent = 'Select Character';
        selectButton.addEventListener('click', selectCharacter);
        controls.appendChild(selectButton);
    }
}

function updateStatus(gameState) {
    const playerLabel = gameState.players.indexOf(playerId) === 0 ? 'A' : 'B';
    statusDisplay.textContent = `You are Player ${playerLabel}. Current Turn: ${gameState.currentPlayer === playerId ? 'You' : 'Opponent'}`;
}

function selectCharacter() {
    const characters = currentGameState.board.flat().filter(c => c && c.player === playerId);
    moveOptions.innerHTML = '';
    characters.forEach(character => {
        const button = document.createElement('button');
        button.textContent = `${character.type} at (${character.row}, ${character.col})`;
        button.addEventListener('click', () => showMoveOptions(character));
        moveOptions.appendChild(button);
    });
}

function showMoveOptions(character) {
    selectedCharacter = character;
    moveOptions.innerHTML = '';
    const moves = getValidMoves(character);
    moves.forEach(move => {
        const button = document.createElement('button');
        button.textContent = move;
        button.addEventListener('click', () => makeMove(character, move));
        moveOptions.appendChild(button);
    });
}

function getValidMoves(character) {
    const moves = [];
    const { row, col } = character;

    switch (character.type) {
        case 'P':
            if (row > 0) moves.push('F');
            if (row < 4) moves.push('B');
            if (col > 0) moves.push('L');
            if (col < 4) moves.push('R');
            break;
        case 'H1':
            if (row > 1) moves.push('F');
            if (row < 3) moves.push('B');
            if (col > 1) moves.push('L');
            if (col < 3) moves.push('R');
            break;
        case 'H2':
            if (row > 1 && col > 1) moves.push('FL');
            if (row > 1 && col < 3) moves.push('FR');
            if (row < 3 && col > 1) moves.push('BL');
            if (row < 3 && col < 3) moves.push('BR');
            break;
    }

    return moves;
}

function makeMove(character, move) {
    socket.emit('move', {
        gameId: 'game1', // Handle multiple games if needed
        characterId: character.id,
        move: move
    });
}

function handleCellClick(row, col) {
    if (selectedCharacter) {
        const move = getMoveFromClick(selectedCharacter, row, col);
        if (move) {
            makeMove(selectedCharacter, move);
            selectedCharacter = null;
            moveOptions.innerHTML = '';
        }
    }
}

function getMoveFromClick(character, targetRow, targetCol) {
    const rowDiff = targetRow - character.row;
    const colDiff = targetCol - character.col;

    switch (character.type) {
        case 'P':
            if (Math.abs(rowDiff) + Math.abs(colDiff) !== 1) return null;
            if (rowDiff === -1) return 'F';
            if (rowDiff === 1) return 'B';
            if (colDiff === -1) return 'L';
            if (colDiff === 1) return 'R';
            break;
        case 'H1':
            if (Math.abs(rowDiff) + Math.abs(colDiff) !== 2) return null;
            if (rowDiff === -2) return 'F';
            if (rowDiff === 2) return 'B';
            if (colDiff === -2) return 'L';
            if (colDiff === 2) return 'R';
            break;
        case 'H2':
            if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return null;
            if (rowDiff === -2 && colDiff === -2) return 'FL';
            if (rowDiff === -2 && colDiff === 2) return 'FR';
            if (rowDiff === 2 && colDiff === -2) return 'BL';
            if (rowDiff === 2 && colDiff === 2) return 'BR';
            break;
    }
    return null;
}

socket.on('gameStateUpdate', (gameState) => {
    currentGameState = gameState;
    updateBoard(gameState);
    updateControls(gameState);
    updateStatus(gameState);
});

socket.on('gameStart', (gameState) => {
    playerId = socket.id;
    currentGameState = gameState;
    initializeBoard();
    updateBoard(gameState);
    updateControls(gameState);
    updateStatus(gameState);
});

socket.on('invalidMove', (message) => {
    alert(`Invalid move: ${message}`);
});

socket.on('gameOver', (winner) => {
    alert(`Game Over! Winner: ${winner === playerId ? 'You' : 'Opponent'}`);
    announceWinner(winner);
    showPlayAgainButton();
    currentGameState = null;
    selectedCharacter = null;
    moveOptions.innerHTML = '';
});

function announceWinner(winner) {
    const winnerAnnouncement = document.createElement('div');
    winnerAnnouncement.id = 'winner-announcement';
    winnerAnnouncement.innerHTML = `
        <h2>Game Over:</h2>
        <h1>${winner === playerId ? 'You win' : 'Opponent wins'}🎉</h1>
    `;
    document.body.insertBefore(winnerAnnouncement, document.body.firstChild);
}

socket.on('gameRestart', (gameState) => {
    hidePlayAgainButton();
    currentGameState = gameState;
    initializeBoard();
    updateBoard(gameState);
    updateControls(gameState);
    updateStatus(gameState);
    const winnerAnnouncement = document.getElementById('winner-announcement');
    if (winnerAnnouncement) {
        winnerAnnouncement.remove();
    }
});

socket.on('playerDisconnected', (disconnectedPlayerId) => {
    alert(`Player ${disconnectedPlayerId === playerId ? 'Opponent' : 'You'} disconnected. Game ended.`);
    currentGameState = null;
    selectedCharacter = null;
    moveOptions.innerHTML = '';
});

function showPlayAgainButton() {
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.addEventListener('click', () => {
        window.location.reload(); 
    });
    document.body.appendChild(playAgainButton);
}

function hidePlayAgainButton() {
    const playAgainButton = document.querySelector('button');
    if (playAgainButton) {
        playAgainButton.remove();
    }
}

initializeBoard();

socket.emit('joinGame', 'game1');
