import React, { useRef, useState, useEffect } from "react";
import "../styles/DrawingBoard.css";
import {
  FaPen,
  FaEraser,
  FaHighlighter,
  FaSquare,
  FaCircle,
  FaSlash,
  FaUndo,
  FaTrash,
  FaCamera,
  FaTimes,
  FaHandPaper,
} from "react-icons/fa";

const DrawingBoard = ({ toggleBoard, roomId, socket }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState("pen");
  const [startPoint, setStartPoint] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState(null);

  const undoStackRef = useRef(undoStack);
  const redoStackRef = useRef(redoStack);

  const tools = [
    { id: "pen", name: "Pen", icon: <FaPen style={{ color: "#007bff" }} /> },
    {
      id: "eraser",
      name: "Eraser",
      icon: <FaEraser style={{ color: "#6c757d" }} />,
    },
    {
      id: "highlighter",
      name: "Highlighter",
      icon: <FaHighlighter style={{ color: "#ffc107" }} />,
    },
    {
      id: "rectangle",
      name: "Rectangle",
      icon: <FaSquare style={{ color: "#28a745" }} />,
    },
    {
      id: "circle",
      name: "Circle",
      icon: <FaCircle style={{ color: "#6f42c1" }} />,
    },
    {
      id: "line",
      name: "Line",
      icon: <FaSlash style={{ color: "#fd7e14" }} />,
    },
    {
      id: "pan",
      name: "Pan",
      icon: <FaHandPaper style={{ color: "#17a2b8" }} />,
    },
  ];

  useEffect(() => {
    undoStackRef.current = undoStack;
    redoStackRef.current = redoStack;
  }, [undoStack, redoStack]);

  const colors = [
    "#000000",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#ffa500",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveDrawing();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleRemoteDrawStart = ({ x, y }) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleRemoteDraw = ({ x, y, color, lineWidth, tool }) => {
      if (tool === "pen") {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      } else if (tool === "eraser") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = lineWidth * 2;
      } else if (tool === "highlighter") {
        ctx.strokeStyle = color + "200";
        ctx.lineWidth = lineWidth * 2;
      }
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleRemoteDrawEnd = () => {
      ctx.closePath();
      saveDrawing();
    };

    const handleRemoteShape = ({
      shape,
      startX,
      startY,
      endX,
      endY,
      color,
      lineWidth,
    }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      if (shape === "rectangle") {
        ctx.rect(startX, startY, endX - startX, endY - startY);
      } else if (shape === "circle") {
        const radius = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      } else if (shape === "line") {
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }

      ctx.stroke();
      saveDrawing();
    };

    const handleRemoteDrawClear = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setUndoStack([]);
    };

    const handleRemoteDrawUndo = () => {
      if (undoStackRef.current.length > 0) {
        const newStack = [...undoStackRef.current];
        newStack.pop();

        if (newStack.length > 0) {
          const img = new Image();
          img.src = newStack[newStack.length - 1];
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setUndoStack(newStack);
          };
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          setUndoStack([]);
        }
      }
    };

    socket.on("remoteDrawStart", handleRemoteDrawStart);
    socket.on("remoteDraw", handleRemoteDraw);
    socket.on("remoteDrawEnd", handleRemoteDrawEnd);
    socket.on("remoteShape", handleRemoteShape);
    socket.on("remoteDrawClear", handleRemoteDrawClear);
    socket.on("remoteDrawUndo", handleRemoteDrawUndo);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off("remoteDrawStart", handleRemoteDrawStart);
      socket.off("remoteDraw", handleRemoteDraw);
      socket.off("remoteDrawEnd", handleRemoteDrawEnd);
      socket.off("remoteShape", handleRemoteShape);
      socket.off("remoteDrawClear", handleRemoteDrawClear);
      socket.off("remoteDrawUndo", handleRemoteDrawUndo);
    };
  }, []);

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    setUndoStack((prevStack) => [...prevStack, canvas.toDataURL()]);
    setRedoStack([]);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pan") {
      setIsPanning(true);
      setLastPanPosition({ x, y });
      return;
    }

    const ctx = canvas.getContext("2d");
    setIsDrawing(true);

    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      socket.emit("drawStart", { roomId, x, y });
    } else {
      setStartPoint({ x, y });
    }
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pan" && isPanning && lastPanPosition) {
      const dx = x - lastPanPosition.x;
      const dy = y - lastPanPosition.y;

      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.src = canvas.toDataURL();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, dx, dy);
      };

      setLastPanPosition({ x, y });
      return;
    }

    if (!isDrawing) return;
    const ctx = canvas.getContext("2d");

    if (["pen", "eraser", "highlighter"].includes(tool)) {
      const ctx = canvas.getContext("2d");

      if (tool === "pen") {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      } else if (tool === "eraser") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = lineWidth * 2;
      } else if (tool === "highlighter") {
        ctx.strokeStyle = color + "80";
        ctx.lineWidth = lineWidth * 2;
      }

      ctx.lineTo(x, y);
      ctx.stroke();
      socket.emit("draw", { roomId, x, y, color, lineWidth, tool });
    }
  };

  const finishDrawing = (e) => {
    if (tool === "pan") {
      setIsPanning(false);
      setLastPanPosition(null);
      saveDrawing();
      return;
    }

    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");

    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      ctx.closePath();
      socket.emit("drawEnd", { roomId });
      saveDrawing();
    } else if (startPoint) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      if (tool === "rectangle") {
        ctx.rect(
          startPoint.x,
          startPoint.y,
          endX - startPoint.x,
          endY - startPoint.y
        );
        socket.emit("remoteShape", {
          roomId,
          shape: "rectangle",
          startX: startPoint.x,
          startY: startPoint.y,
          endX,
          endY,
          color,
          lineWidth,
        });
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(endX - startPoint.x, 2) + Math.pow(endY - startPoint.y, 2)
        );
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        socket.emit("remoteShape", {
          roomId,
          shape: "circle",
          startX: startPoint.x,
          startY: startPoint.y,
          endX,
          endY,
          color,
          lineWidth,
        });
      } else if (tool === "line") {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endX, endY);
        socket.emit("remoteShape", {
          roomId,
          shape: "line",
          startX: startPoint.x,
          startY: startPoint.y,
          endX,
          endY,
          color,
          lineWidth,
        });
      }

      ctx.stroke();
      saveDrawing();
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setUndoStack([]);
    socket.emit("drawClear", { roomId });
  };

  const undo = () => {
    if (undoStack.length > 1) {
      const newUndoStack = [...undoStack];
      const last = newUndoStack.pop();

      setRedoStack((prev) => [...prev, last]);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.src = newUndoStack[newUndoStack.length - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };

      setUndoStack(newUndoStack);
      socket.emit("drawUndo", { roomId });
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack];
      const redoImage = newRedoStack.pop();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.src = redoImage;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };

      setUndoStack((prev) => [...prev, redoImage]);
      setRedoStack(newRedoStack);
    }
  };

  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = "drawing.png";
    link.click();
  };

  return (
    <div className="drawing-board-container">
      <div className="toolbar">
        <div className="color-picker">
          {colors.map((c) => (
            <button
              key={c}
              className={`color-option ${color === c ? "active" : ""}`}
              data-color={c}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="actions">
          <button onClick={undo}>
            <FaUndo style={{ color: "#0d6efd", marginRight: "6px" }} /> Undo
          </button>
          <button onClick={redo}>
            <FaUndo
              style={{
                transform: "scaleX(-1)",
                color: "#198754",
                marginRight: "6px",
              }}
            />{" "}
            Redo
          </button>

          <button onClick={clearCanvas}>
            <FaTrash style={{ color: "#dc3545", marginRight: "6px" }} /> Clear
          </button>
          <button onClick={takeScreenshot}>
            <FaCamera style={{ color: "#20c997", marginRight: "6px" }} />{" "}
            Screenshot
          </button>
          <button onClick={toggleBoard}>
            <FaTimes style={{ color: "red", marginRight: "6px" }} /> Close
          </button>
        </div>
        <div className="tool-selection">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? "active" : ""}`}
              onClick={() => setTool(t.id)}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        <div className="brush-size">
          <label>Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
          />
          <span>{lineWidth}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={`drawing-canvas ${tool === "pan" ? "pan-mode" : ""}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
      />
    </div>
  );
};

export default DrawingBoard;