// characters.js

class Character {
    static nextId = 1;

    constructor(type, player, row, col) {
        this.id = Character.nextId++;
        this.type = type;
        this.player = player;
        this.row = row;
        this.col = col;
    }

    getNewPosition(move) {
        throw new Error("getNewPosition() must be implemented in subclasses");
    }

    getPossibleMoves() {
        throw new Error("getPossibleMoves() must be implemented in subclasses");
    }
}

class Pawn extends Character {
    constructor(player, row, col) {
        super('P', player, row, col);
    }

    getNewPosition(move) {
        switch (move) {
            case 'F': return { row: this.row - 1, col: this.col };
            case 'B': return { row: this.row + 1, col: this.col };
            case 'L': return { row: this.row, col: this.col - 1 };
            case 'R': return { row: this.row, col: this.col + 1 };
            default: return null;
        }
    }

    getPossibleMoves() {
        return ['F', 'B', 'L', 'R'];
    }
}

class Hero1 extends Character {
    constructor(player, row, col) {
        super('H1', player, row, col);
    }

    getNewPosition(move) {
        switch (move) {
            case 'F': return { row: this.row - 2, col: this.col };
            case 'B': return { row: this.row + 2, col: this.col };
            case 'L': return { row: this.row, col: this.col - 2 };
            case 'R': return { row: this.row, col: this.col + 2 };
            default: return null;
        }
    }

    getPossibleMoves() {
        return ['F', 'B', 'L', 'R'];
    }
}

class Hero2 extends Character {
    constructor(player, row, col) {
        super('H2', player, row, col);
    }

    getNewPosition(move) {
        switch (move) {
            case 'FL': return { row: this.row - 2, col: this.col - 2 };
            case 'FR': return { row: this.row - 2, col: this.col + 2 };
            case 'BL': return { row: this.row + 2, col: this.col - 2 };
            case 'BR': return { row: this.row + 2, col: this.col + 2 };
            default: return null;
        }
    }

    getPossibleMoves() {
        return ['FL', 'FR', 'BL', 'BR'];
    }
}

module.exports = { Pawn, Hero1, Hero2 };
