const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

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
            console.log(`Client joined game: ${gameId}, Total: ${games[gameId].length}`);

            ws.gameId = gameId;

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

// console.log("WebSocket server running on ws://localhost:3001");
