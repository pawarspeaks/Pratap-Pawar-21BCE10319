const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { GameState, processMove } = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const games = new Map();
const waitingPlayers = new Set();
const lobbies = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');


    socket.on('joinGame', () => {
        if (waitingPlayers.size > 0) {
            const opponentId = waitingPlayers.values().next().value;
            waitingPlayers.delete(opponentId);
            
            const gameId = `game-${opponentId}-${socket.id}`;
            const game = new GameState();
            game.addPlayer(opponentId);
            game.addPlayer(socket.id);
            games.set(gameId, game);

            game.initializeCharacters();
            
            io.to(opponentId).emit('gameStart', { gameId, state: game.getState() });
            socket.emit('gameStart', { gameId, state: game.getState() });
        } else {
            waitingPlayers.add(socket.id);
            socket.emit('waitingForOpponent');
        }
    });


    // Create a new lobby
    socket.on('createLobby', () => {
        const lobbyId = Math.random().toString(36).substr(2, 5);
        lobbies.set(lobbyId, [socket.id]);
        socket.join(lobbyId);
        socket.emit('lobbyCreated', lobbyId);
    });

    // Join an existing lobby
    socket.on('joinLobby', (lobbyId) => {
        if (lobbies.has(lobbyId)) {
            const lobby = lobbies.get(lobbyId);
            if (lobby.length < 2) {
                lobby.push(socket.id);
                socket.join(lobbyId);
                socket.emit('lobbyJoined', lobbyId);
                if (lobby.length === 2) {
                    // When the lobby is full, create a new game
                    const gameId = Math.random().toString(36).substr(2, 5);
                    games.set(gameId, new GameState());
                    lobby.forEach(playerId => {
                        const playerSocket = io.sockets.sockets.get(playerId);
                        playerSocket.leave(lobbyId);
                        playerSocket.join(gameId);
                        games.get(gameId).addPlayer(playerId);
                    });
                    io.to(gameId).emit('gameStart', { gameId, state: games.get(gameId).getState() });
                    lobbies.delete(lobbyId);
                }
            } else {
                socket.emit('lobbyFull');
            }
        } else {
            socket.emit('lobbyNotFound');
        }
    });

    // Join a game
    socket.on('joinGame', (gameId) => {
        if (!games.has(gameId)) {
            games.set(gameId, new GameState());
        }
    

        const game = games.get(gameId);
        const player = game.addPlayer(socket.id);
    
        if (player) {
            socket.join(gameId);
            io.to(gameId).emit('gameStateUpdate', game.getState());
    
            if (game.isReady()) {
                game.initializeCharacters();
                io.to(gameId).emit('gameStart', game.getState());
            }
        } else {
            socket.emit('gameFull');
        }
    });
    
    // Handle player moves
    socket.on('move', ({ gameId, characterId, move }) => {
        const game = games.get(gameId);
        if (game && game.currentPlayer === socket.id) {
            const result = processMove(game, characterId, move);
            if (result.valid) {
                io.to(gameId).emit('gameStateUpdate', game.getState());
                if (game.isGameOver()) {
                    io.to(gameId).emit('gameOver', game.winner);
                    games.delete(gameId);
                }
            } else {
                socket.emit('invalidMove', result.message);
            }
        }
    });

    socket.on('playAgain', (gameId) => {
        if (games.has(gameId)) {
            const game = games.get(gameId);
            game.reset();
            game.initializeCharacters();
            io.to(gameId).emit('gameRestart', game.getState());
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        waitingPlayers.delete(socket.id);
        games.forEach((game, gameId) => {
            if (game.hasPlayer(socket.id)) {
                io.to(gameId).emit('playerDisconnected', socket.id);
                games.delete(gameId);
            }
        });

        lobbies.forEach((lobby, lobbyId) => {
            const index = lobby.indexOf(socket.id);
            if (index !== -1) {
                lobby.splice(index, 1);
                io.to(lobbyId).emit('playerDisconnected', socket.id);
                if (lobby.length === 0) {
                    lobbies.delete(lobbyId);
                }
            }
        });
    });
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
