import React, { useCallback, useEffect, useRef, useState } from "react";
import Board from "./Board";

const GameInfo = () => {
  const [squares, setSquares] = useState(Array(25).fill(0));
  const [isPlayerable, setIsPlayerable] = useState(false);
  const [player, setPlayer] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Waiting for opponent...");
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const wsRef = useRef(null);

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const handleOnMessage = useCallback((event) => {
    const msg = JSON.parse(event.data);
    const currentPlayerRole = playerRef.current;

    switch (msg.type) {
      case "PLAYER_ASSIGNED":
        setPlayer(msg.player);
        setRoomId(msg.roomId);
        setSquares(msg.board);
        setStatus("Chờ người chơi khác...");
        setWinner(null);
        setWinningLine([]);
        break;

      case "OPPONENT_CONNECTED":
        setStatus("Ván đấu bắt đầu!");
        break;

      case "TURN":
        setIsPlayerable(msg.yourTurn);
        break;

      case "UPDATE":
        setSquares((prev) => {
          const newBoard = [...prev];
          newBoard[msg.square] = msg.value;
          return newBoard;
        });
        break;

      case "GAME_OVER":
        setWinner(msg.winner);
        setWinningLine(msg.winningLine || []);
        if (msg.winner === "DRAW") {
          setStatus("Hòa!");
        } else if (msg.winner === currentPlayerRole) {
          setStatus("Bạn thắng!");
        } else {
          setStatus("Bạn thua!");
        }
        setIsPlayerable(false);
        break;

      case "OPPONENT_DISCONNECTED":
        setStatus("Đối thủ đã rời phòng");
        setIsPlayerable(false);
        break;

      case "GAME_FULL":
        setStatus("Phòng đã đầy! Hãy thử lại.");
        setIsPlayerable(false);
        break;

      case "RESET_DONE":
        setSquares(msg.board);
        setWinner(null);
        setWinningLine([]);
        setStatus("Ván mới bắt đầu!");
        break;

      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (wsRef.current) return;

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join" }));
    };

    ws.onmessage = handleOnMessage;

    ws.onclose = () => {
      console.log("WebSocket Closed");
      setStatus("Mất kết nối server!");
      setIsPlayerable(false);
      wsRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setStatus("Lỗi WebSocket!");
      setIsPlayerable(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log("Cleanup: closed WS connection");
      }
    };
  }, [roomId, handleOnMessage]);

  const handleClick = (index) => {
    if (!isPlayerable || winner) return;

    wsRef.current?.send(
      JSON.stringify({ type: "INCREMENT", data: { square: index } })
    );
  };

  const handleNewGame = () => {
    wsRef.current?.send(JSON.stringify({ type: "RESET" }));
  };

  return (
    <div className="game ">
      <h2 className="title">5x5 Increment Game (ODD vs EVEN)</h2>
      <p className="text">Mã Phòng: {roomId}</p>
      <p className="game-status">
        {status} {player && `(${player})`}
      </p>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded mb-3"
        onClick={handleNewGame}
        disabled={!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN}
      >
        Ván Mới
      </button>

      <Board
        squares={squares}
        handleClick={handleClick}
        winningLine={winningLine}
      />
    </div>
  );
};

export default GameInfo;
