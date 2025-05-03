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
      icon: (
        <div style={{ position: "relative", display: "inline-block" }}>
          <FaEraser style={{ color: "#6c757d" }} />
          {tool === "eraser" && (
            <div
              style={{
                position: "absolute",
                top: "-5px",
                left: "-5px",
                right: "-5px",
                bottom: "-5px",
                border: "2px solid red",
                borderRadius: "4px",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      ),
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

  // ... rest of the code remains exactly the same ...

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
