const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let games = {}; // To store game states

// Initialize game state
function initializeGame(gameId) {
    games[gameId] = {
        board: Array(5).fill().map(() => Array(5).fill(null)),
        players: {},
        currentTurn: 'A',
        gameOver: false,
    };
}

function isValidMove(gameState, playerId, character, move) {
    // Implement game logic to validate the move based on the character type and current game state
    // Placeholder for move validation
    return true; // Replace with actual validation logic
}

function updateBoard(gameState, playerId, character, move) {
    // Implement the logic to update the game board based on the character's move
    // Handle capturing opponent pieces, etc.
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join_game', (gameId, playerId) => {
        if (!games[gameId]) {
            initializeGame(gameId);
        }
        let gameState = games[gameId];

        if (Object.keys(gameState.players).length < 2) {
            gameState.players[playerId] = {
                characters: [], // Assign player's characters
                socketId: socket.id
            };
            socket.join(gameId);
            socket.emit('joined', { playerId, gameState });

            if (Object.keys(gameState.players).length === 2) {
                io.in(gameId).emit('game_started', gameState);
            }
        } else {
            socket.emit('game_full', { message: 'Game is full' });
        }
    });

    socket.on('make_move', ({ gameId, playerId, character, move }) => {
        let gameState = games[gameId];

        if (gameState.currentTurn === playerId && isValidMove(gameState, playerId, character, move)) {
            updateBoard(gameState, playerId, character, move);
            gameState.currentTurn = gameState.currentTurn === 'A' ? 'B' : 'A';

            io.in(gameId).emit('update_state', gameState);

            // Check for game over condition
            let opponentId = gameState.currentTurn === 'A' ? 'B' : 'A';
            if (gameState.players[opponentId].characters.length === 0) {
                gameState.gameOver = true;
                io.in(gameId).emit('game_over', { winner: playerId });
            }
        } else {
            socket.emit('invalid_move', { message: 'Invalid move' });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Handle disconnection logic
    });
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Listening on *:3000');
});
