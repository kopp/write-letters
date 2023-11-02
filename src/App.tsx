import { useState, useRef, useEffect } from 'react'
import './App.css'





function useWindowDimensions() {

  const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  };

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}



function Canvas() {
  const canvasRef = useRef<null | HTMLCanvasElement>(null);
  const [isStylusOnly, setIsStylusOnly] = useState(true);
  const [position, setPosition] = useState<[number, number]>([-1, -1]);
  const [isDrawing, setIsDrawing] = useState(false);

  const isAllowedInput = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isStylusOnly) {
      return true;
    }

    const touch = e.touches[0];
    if ("touchType" in touch) {
      return touch["touchType"] === "stylus";
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (!isAllowedInput(e)) {
      return;
    }

    if (canvasRef == null || canvasRef.current == null) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
      console.error("Unable to obtain canvas context.");
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    setPosition([x, y]);

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

    console.log("move", e);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
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

  const clearCanvas = () => {
    if (canvasRef == null || canvasRef.current == null) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
      console.error("Unable to obtain canvas context.");
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

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
      <div>{isDrawing ? "" : "not "} drawing; {position[0]}, {position[1]}</div>
      <div><label>
        <input type="checkbox" checked={isStylusOnly} onChange={() => setIsStylusOnly(!isStylusOnly)} />
        Stylus only
      </label></div>
      <div><button type="button" onClick={clearCanvas}>Clear</button></div>
    </>
  );
}

function App() {

  const [expectedLetter, setExpectedLetter] = useState<string>("A");

  return (
    <>
      <div>
        Write Letters: <input type="text" value={expectedLetter} onChange={e => setExpectedLetter(e.target.value)} />
      </div>
      <div>Next letter: {expectedLetter[0]}</div>
      <Canvas />
    </>
  )
}

export default App



