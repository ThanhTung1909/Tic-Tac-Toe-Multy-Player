console.log("✅ WebSocket server running on ws://localhost:8080");

const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

const BOARD_SIZE = 5;
const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;

const WINNING_LINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

const rooms = {}; // {roomId: {players, board, status, winner, currentTurn, moveCount}}
let roomCounter = 1;

const createRoom = () => {
  const roomId = `room_${roomCounter++}`;
  rooms[roomId] = {
    players: [],
    board: Array(TOTAL_SQUARES).fill(0),
    status: "WAITING",
    winner: null,
    currentTurn: "ODD",
    moveCount: 0,
  };
  console.log(`🆕 Created ${roomId}`);
  return roomId;
};

const broadcast = (roomId, message) => {
  const room = rooms[roomId];
  if (!room) return;
  const msg = JSON.stringify(message);
  room.players.forEach((p) => {
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
  });
};

const endGame = (roomId, winner, winningLine = null) => {
  const room = rooms[roomId];
  if (!room) return;
  room.status = "OVER";
  room.winner = winner;
  broadcast(roomId, { type: "GAME_OVER", winner, winningLine });
};

const checkWinCondition = (roomId) => {
  const room = rooms[roomId];
  for (const line of WINNING_LINES) {
    const values = line.map((i) => room.board[i]);
    if (values.every((v) => v > 0 && v % 2 === 1)) {
      endGame(roomId, "ODD", line);
      return true;
    }
    if (values.every((v) => v > 0 && v % 2 === 0)) {
      endGame(roomId, "EVEN", line);
      return true;
    }
  }
  if (room.moveCount >= TOTAL_SQUARES) {
    endGame(roomId, "DRAW");
    return true;
  }
  return false;
};

const resetGame = (roomId) => {
  const room = rooms[roomId];
  if (!room) return;
  room.board = Array(TOTAL_SQUARES).fill(0);
  room.status = "PLAYING";
  room.winner = null;
  room.currentTurn = "ODD";
  room.moveCount = 0;

  broadcast(roomId, { type: "RESET_DONE", board: room.board });

  room.players.forEach((p) => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(
        JSON.stringify({
          type: "TURN",
          yourTurn: p.player === room.currentTurn,
        })
      );
    }
  });
};

const assignPlayerRoleAndBoard = (ws, playerRole, board, roomId) => {
  ws.send(
    JSON.stringify({
      type: "PLAYER_ASSIGNED",
      player: playerRole,
      roomId,
      board,
    })
  );
};

server.on("connection", (ws) => {
  console.log("New client connected");
  let joinedRoom = null;

  const waitingRoom = Object.keys(rooms).find(
    (rId) => rooms[rId].players.length < 2
  );

  joinedRoom = waitingRoom || createRoom();
  const room = rooms[joinedRoom];

  const playerRole = room.players.length === 0 ? "ODD" : "EVEN";
  room.players.push({ ws, player: playerRole });

  // Gửi roomId cho client đầu tiên
  if (playerRole === "ODD") {
    ws.send(JSON.stringify({ type: "ROOM_CREATED", roomId: joinedRoom }));
  }

  assignPlayerRoleAndBoard(ws, playerRole, room.board, joinedRoom);

  if (room.players.length === 2) {
    room.status = "PLAYING";
    broadcast(joinedRoom, { type: "OPPONENT_CONNECTED" });

    room.players.forEach((p) => {
      p.ws.send(
        JSON.stringify({
          type: "TURN",
          yourTurn: p.player === "ODD",
        })
      );
    });
    createRoom();
  }

  ws.on("message", (msg) => {
    const { type, data } = JSON.parse(msg);

    switch (type) {
      case "INCREMENT": {
        const room = rooms[joinedRoom];
        if (!room || room.status !== "PLAYING" || room.winner) return;

        const { square } = data;
        const player = room.players.find((p) => p.ws === ws)?.player;
        if (player !== room.currentTurn) return;
        if (room.board[square] !== 0) return;

        room.moveCount++;
        room.board[square] = room.moveCount;

        broadcast(joinedRoom, {
          type: "UPDATE",
          square,
          value: room.board[square],
        });

        const isOver = checkWinCondition(joinedRoom);
        if (!isOver) {
          room.currentTurn = room.currentTurn === "ODD" ? "EVEN" : "ODD";
          room.players.forEach((p) => {
            p.ws.send(
              JSON.stringify({
                type: "TURN",
                yourTurn: p.player === room.currentTurn,
              })
            );
          });
        }
        break;
      }

      case "RESET":
        resetGame(joinedRoom);
        break;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (!joinedRoom || !rooms[joinedRoom]) return;
    const room = rooms[joinedRoom];

    room.players = room.players.filter((p) => p.ws !== ws);
    if (room.status === "PLAYING") {
      room.status = "OVER";
      broadcast(joinedRoom, { type: "OPPONENT_DISCONNECTED" });
    }

    if (room.players.length === 0) {
      delete rooms[joinedRoom];
      
      console.log(`Room ${joinedRoom} removed`);
    }
  });
});
