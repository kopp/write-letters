import { useState, useRef, useEffect } from "react";
import "./App.css";
import { LETTERS, pathForRuling, pathFromLetter } from "./alphabet";

function useWindowDimensions() {
  const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height,
    };
  };

  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

interface HtmlCanvasRefs {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

function Canvas() {
  const canvasRef = useRef<null | HTMLCanvasElement>(null);
  // use useCallback instaed of useRef
  // https://medium.com/welldone-software/usecallback-might-be-what-you-meant-by-useref-useeffect-773bc0278ae
  const [canvasRefs, setRefs] = useState<null | HtmlCanvasRefs>(null);
  const [scaleFactor, setScaleFactor] = useState(200);
  const [isStylusOnly, setIsStylusOnly] = useState(false);
  const [position, setPosition] = useState<[number, number]>([-1, -1]);
  const [isDrawing, setIsDrawing] = useState(false);

  // drawing primitives -------------------------------------------------------
  // draw lines to write on
  const drawRuling = () => {
    console.log("draw ruling");
    if (canvasRefs == null) {
      return;
    }
    const rect = canvasRefs.canvas.getBoundingClientRect();
    const width = rect.right - rect.left;

    canvasRefs.context.strokeStyle = "rgba(100, 100, 100, 0.2)";
    canvasRefs.context.stroke(
      pathForRuling(40, 400, width - 50, scaleFactor, 4)
    );
  };

  // clear user written input, but keep ruling
  const clearWriting = () => {
    if (canvasRef == null || canvasRef.current == null) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      console.error("Unable to obtain canvas context.");
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRuling();
  };

  // set context once if the canvas is available
  useEffect(() => {
    console.log("canvas changed");
    if (canvasRef == null || canvasRef.current == null) {
      console.error("Unable to get context from null ref.");
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      console.error("Unable to obtain canvas context.");
      return;
    }
    setRefs({ canvas: canvas, context: ctx });
  }, [canvasRef]);

  // reset canvas if new canvas is in use
  useEffect(() => {
    clearWriting();
  }, [canvasRefs]);

  const isAllowedInput = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isStylusOnly) {
      return true;
    }

    const touch = e.touches[0];
    if ("touchType" in touch) {
      return touch["touchType"] === "stylus";
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    console.log("touch start", e);
    e.preventDefault();

    if (!isAllowedInput(e)) {
      return;
    }

    if (canvasRef == null || canvasRef.current == null) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      console.error("Unable to obtain canvas context.");
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    setPosition([x, y]);

    ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
    ctx.stroke(pathFromLetter(LETTERS["A"], x, y, scaleFactor, "first"));

    ctx.strokeStyle = "rgb(0, 0, 0, 0.9)";

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (!isAllowedInput(e)) {
      return;
    }

    if (!isDrawing) {
      return;
    }

    if (canvasRef == null || canvasRef.current == null) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      console.error("Unable to obtain canvas context.");
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    setPosition([x, y]);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const { height, width } = useWindowDimensions();

  return (
    <>
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        width={0.9 * width}
        height={0.6 * height}
      />
      <div>
        {isDrawing ? "" : "not "} drawing; {position[0]}, {position[1]}
      </div>
      <div>
        Scale Factor:{" "}
        <input
          type="number"
          value={scaleFactor}
          onChange={(e) => setScaleFactor(parseInt(e.target.value))}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={isStylusOnly}
            onChange={() => setIsStylusOnly(!isStylusOnly)}
          />
          Stylus only
        </label>
      </div>
      <div>
        <button type="button" onClick={clearWriting}>
          Clear
        </button>
      </div>
    </>
  );
}

function App() {
  const [expectedLetter, setExpectedLetter] = useState<string>("A");

  return (
    <>
      <div>
        Write Letters:{" "}
        <input
          type="text"
          value={expectedLetter}
          onChange={(e) => setExpectedLetter(e.target.value)}
        />
      </div>
      <div>Next letter: {expectedLetter[0]}</div>
      <Canvas />
    </>
  );
}

export default App;
