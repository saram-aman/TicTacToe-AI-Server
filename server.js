const http = require('http');
const WebSocket = require('ws');

// Create HTTP server with CORS headers
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end('WebSocket server is running');
});

// Attach WebSocket server to this HTTP server
const wss = new WebSocket.Server({ server });

const games = {};

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received message:', data);

        if (data.type === 'join') {
            const gameId = data.gameId;

            if (!games[gameId]) {
                games[gameId] = [];
            }

            games[gameId].push(ws);
            ws.gameId = gameId;

            console.log(`Client joined game: ${gameId}, Total: ${games[gameId].length}`);

            if (games[gameId].length === 2) {
                games[gameId][0].send(JSON.stringify({ type: 'start', symbol: 'X' }));
                games[gameId][1].send(JSON.stringify({ type: 'start', symbol: 'O' }));
            }
        }

        if (data.type === 'move') {
            const gameId = data.gameId;
            const move = data.move;
            const player = data.player;

            const gamePlayers = games[gameId] || [];
            gamePlayers.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'opponent-move',
                        move,
                        player
                    }));
                }
            });
        }
    });

    ws.on('close', () => {
        const gameId = ws.gameId;
        if (gameId && games[gameId]) {
            games[gameId] = games[gameId].filter(client => client !== ws);
            if (games[gameId].length === 0) {
                delete games[gameId];
            }
        }
    });
});

// Start the HTTP server (and WebSocket)
server.listen(3001, () => {
    console.log('WebSocket server running on ws://localhost:3001');
});
