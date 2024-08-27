const { Pawn, Hero1, Hero2 } = require('./characters');

class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.board = Array(5).fill().map(() => Array(5).fill(null));
        this.players = [];
        this.currentPlayer = null;
        this.characters = [];
        this.winner = null;
    }

    addPlayer(playerId) {
        if (this.players.length < 2) {
            this.players.push(playerId);
            if (this.players.length === 1) {
                this.currentPlayer = playerId;
            }
            return playerId;
        }
        return null;
    }
    
    getPlayerLabel(playerId) {
        return this.players.indexOf(playerId) === 0 ? 'A' : 'B';
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(id => id !== playerId);
        if (this.currentPlayer === playerId) {
            this.currentPlayer = this.players[0] || null;
        }
    }

    hasPlayer(playerId) {
        return this.players.includes(playerId);
    }

    isReady() {
        return this.players.length === 2;
    }

    initializeCharacters() {
        const characterTypes = ['P', 'P', 'H1', 'H2', 'P'];
        this.characters = [];

        for (let i = 0; i < 2; i++) {
            const player = this.players[i];
            const row = i === 0 ? 0 : 4;
            
            characterTypes.forEach((type, col) => {
                let CharacterClass;
                switch (type) {
                    case 'P':
                        CharacterClass = Pawn;
                        break;
                    case 'H1':
                        CharacterClass = Hero1;
                        break;
                    case 'H2':
                        CharacterClass = Hero2;
                        break;
                    default:
                        throw new Error(`Unknown character type: ${type}`);
                }
                
                const character = new CharacterClass(player, row, col);
                this.characters.push(character);
                this.board[row][col] = character;
            });
        }
    }

    getState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            players: this.players,
        };
    }

    isGameOver() {
        const playerCharacters = this.players.map(player => 
            this.characters.filter(char => char.player === player)
        );
        
        if (playerCharacters[0].length === 0) {
            this.winner = this.players[1];
            return true;
        } else if (playerCharacters[1].length === 0) {
            this.winner = this.players[0];
            return true;
        }
        
        return false;
    }
}

function processMove(gameState, characterId, move) {
    const character = gameState.characters.find(c => c.id === characterId);
    if (!character) {
        return { valid: false, message: "Character not found" };
    }

    if (character.player !== gameState.currentPlayer) {
        return { valid: false, message: "Not your turn" };
    }

    const newPosition = character.getNewPosition(move);
    if (!newPosition) {
        return { valid: false, message: "Invalid move" };
    }

    if (newPosition.row < 0 || newPosition.row > 4 || newPosition.col < 0 || newPosition.col > 4) {
        return { valid: false, message: "Move out of bounds" };
    }

    const targetCharacter = gameState.board[newPosition.row][newPosition.col];
    if (targetCharacter && targetCharacter.player === character.player) {
        return { valid: false, message: "Cannot move to a space occupied by your own character" };
    }

    // Perform the move
    gameState.board[character.row][character.col] = null;
    if (targetCharacter) {
        gameState.characters = gameState.characters.filter(c => c !== targetCharacter);
    }
    character.row = newPosition.row;
    character.col = newPosition.col;
    gameState.board[newPosition.row][newPosition.col] = character;

    // Switch turns
    gameState.currentPlayer = gameState.players.find(p => p !== gameState.currentPlayer);

    return { valid: true };
}

module.exports = { GameState, processMove };
