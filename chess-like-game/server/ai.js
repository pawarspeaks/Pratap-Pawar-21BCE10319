function getAIMove(gameState) {
    const aiPlayer = gameState.currentPlayer;
    const aiCharacters = gameState.characters.filter(c => c.player === aiPlayer);
    
    for (const character of aiCharacters) {
        const moves = character.getPossibleMoves();
        for (const move of moves) {
            const newPosition = character.getNewPosition(move);
            if (isValidMove(gameState, character, newPosition)) {
                return { characterId: character.id, move };
            }
        }
    }
    
    // If no valid move found, return null
    return null;
}

function isValidMove(gameState, character, newPosition) {
    if (newPosition.row < 0 || newPosition.row > 4 || newPosition.col < 0 || newPosition.col > 4) {
        return false;
    }

    const targetCharacter = gameState.board[newPosition.row][newPosition.col];
    return !targetCharacter || targetCharacter.player !== character.player;
}

module.exports = { getAIMove };
