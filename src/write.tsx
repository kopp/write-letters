import { useRef, useState, useCallback } from "react";
import { useWindowDimensions } from "./window_dimensions";

interface Point {
  x: number;
  y: number;
}

type LineString = Point[];

export function WritingPaper() {
  // state --------------------------------------------------------------------

  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [context, setContext] = useState<CanvasRenderingContext2D>();

  const canvasRef = useCallback((newCanvas: HTMLCanvasElement) => {
    console.log("New canvas");
    setCanvas(newCanvas);
    const newContext = newCanvas.getContext("2d");
    if (newContext == null) {
      throw Error("Unable to get context");
    }
    setContext(newContext);
  }, []);

  const drawingHistory = useRef<LineString[]>([]);

  // drawing primitives -------------------------------------------------------

  // Draw one point in the drawing history.
  // By default: draw the most recently added point in the drawing history.
  const pencilDrawPoint = (linestringIndex = -1, pointIndex = -1) => {
    if (context == null || canvas == null) {
      return;
    }

    if (linestringIndex < 0) {
      linestringIndex = drawingHistory.current.length + linestringIndex;
    }
    const relevantLineString = drawingHistory.current[linestringIndex];
    if (pointIndex < 0) {
      pointIndex = relevantLineString.length + pointIndex;
    }
    if (pointIndex < 0 || pointIndex >= relevantLineString.length) {
      throw Error(
        `Invalid index ${pointIndex} for linestring ${linestringIndex} (length ${relevantLineString.length}).`
      );
    }

    context.strokeStyle = "rgba(100, 100, 100, 0.5)";

    if (relevantLineString.length == 0) {
      return;
    }

    if (pointIndex == 0) {
      context.fillRect(relevantLineString[0].x, relevantLineString[0].y, 1, 1);
    } else {
      const begin = relevantLineString[pointIndex - 1];
      const end = relevantLineString[pointIndex];
      context.beginPath();
      context.moveTo(begin.x, begin.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  };

  const pencilDrawFullHistory = () => {
    for (
      let linestringIndex = 0;
      linestringIndex < drawingHistory.current.length;
      ++linestringIndex
    ) {
      for (
        let pointIndex = 0;
        pointIndex < drawingHistory.current[linestringIndex].length;
        ++pointIndex
      ) {
        pencilDrawPoint(linestringIndex, pointIndex);
      }
    }
  };

  const eraseWriting = () => {
    drawingHistory.current = [];
    clearWriting();
  };

  const clearWriting = () => {
    context?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
  };

  const undoLastLinestring = () => {
    drawingHistory.current.pop();
    clearWriting();
    pencilDrawFullHistory();
  };

  // touch event handling -----------------------------------------------------

  const getPosition: (e: React.TouchEvent<HTMLCanvasElement>) => Point = (
    e
  ) => {
    if (canvas == null) {
      throw Error("No context in getPosition");
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    return { x: x, y: y };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (context == null || canvas == null) {
      console.error("no context in touch start");
      return;
    }
    e.preventDefault();
    const pos = getPosition(e);
    drawingHistory.current.push([pos]);
    console.log(
      "touch start at",
      pos,
      "drawing history is",
      drawingHistory.current
    );
    pencilDrawPoint();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (context == null || canvas == null) {
      console.error("no context in touch move");
      return;
    }
    e.preventDefault();
    const pos = getPosition(e);
    drawingHistory.current[drawingHistory.current.length - 1].push(pos);
    pencilDrawPoint();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  // UI -----------------------------------------------------------------------

  const { height, width } = useWindowDimensions();

  return (
    <>
      <div>
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          width={0.9 * width}
          height={0.6 * height}
        />
      </div>
      <div>
        <button type="button" onClick={undoLastLinestring}>
          Undo Linestring
        </button>
        <button type="button" onClick={eraseWriting}>
          Clear
        </button>
      </div>
    </>
  );
}
