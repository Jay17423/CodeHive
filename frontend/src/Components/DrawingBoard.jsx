import React, { useRef, useState, useEffect } from 'react';


const DrawingBoard = ({ toggleBoard }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState('pen');
  const [startPoint, setStartPoint] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  const colors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffa500', '#a52a2a'];

  const tools = [
    { id: 'pen', name: 'Pen' },
    { id: 'eraser', name: 'Eraser' },
    { id: 'highlighter', name: 'Highlighter' },
    { id: 'rectangle', name: 'Rectangle' },
    { id: 'circle', name: 'Circle' },
    { id: 'line', name: 'Line' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    saveDrawing();
  }, []);

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    setUndoStack((prevStack) => [...prevStack, canvas.toDataURL()]);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    saveDrawing();

    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    } else {
      setStartPoint({
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 2;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color + '80';
      ctx.lineWidth = lineWidth * 2;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  const finishDrawing = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      ctx.closePath();
    } else if (startPoint) {
      const endX = e.nativeEvent.offsetX;
      const endY = e.nativeEvent.offsetY;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === 'rectangle') {
        ctx.beginPath();
        ctx.rect(startPoint.x, startPoint.y, endX - startPoint.x, endY - startPoint.y);
        ctx.stroke();
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(endX - startPoint.x, 2) + Math.pow(endY - startPoint.y, 2));
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setUndoStack([]); // Clear undo history
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const newStack = [...undoStack];
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setUndoStack([]);
      }
    }
  };

  // ✅ Screenshot Functionality
  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = image;
    link.download = 'drawing.png'; // Filename
    link.click();
  };

  return (
    <div className="drawing-board-container">
      <div className="toolbar">
        <div className="color-picker">
          {colors.map((c) => (
            <button key={c} className="color-option" style={{ backgroundColor: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        
        <div className="tool-selection">
          {tools.map((t) => (
            <button key={t.id} className={`tool-btn ${tool === t.id ? 'active' : ''}`} onClick={() => setTool(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
        
        <div className="brush-size">
          <label>Size:</label>
          <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} />
          <span>{lineWidth}</span>
        </div>
        
        <div className="actions">
          <button onClick={undo}>Undo</button>
          <button onClick={clearCanvas}>Clear</button>
          <button onClick={takeScreenshot}>Screenshot</button> {/* ✅ New Screenshot Button */}
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
      />
    </div>
  );
};

export default DrawingBoard;
