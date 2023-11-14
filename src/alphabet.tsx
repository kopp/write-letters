// Define outline of the letters to use.

// https://de.wikipedia.org/wiki/Datei:Lineatur_Liniendefinition.png
const UNDER_LINE = 0; // should be 0; values > 0 will add some padding, which should not be handled here
const BASE_LINE = 1 / 3;
const MIDDLE_LINE = 2 / 3;
const TOP_LINE = 1; // should be 1: Assumption is that the scale factor scales font coordinates to pixels; larger values will confuse some logic.

// The points are given in 'letter local coordinates'.
// The leftmost point of the letter, projected onto the under line, is (0, 0).
// x increases to the right and y increases upwards.
// The point at (0, 0) is referet to as 'anchor point'.
export interface ControlPoint {
  readonly x: number;
  readonly y: number;
}

// Each segment consists of control points that need to be visited in order of appearance here.
export interface LetterSegment {
  readonly controlPoints: ControlPoint[];
}

// A letter is comprised of multiple segments.
// The segments hare to be traced in the order listed here.
export interface Letter {
  readonly segments: LetterSegment[];
}

const CAPITAL_A: Letter = {
  segments: [
    {
      controlPoints: [
        { x: 0, y: BASE_LINE },
        { x: 0.1, y: (2 * BASE_LINE) / 3 + TOP_LINE / 3 },
        { x: 0.2, y: BASE_LINE / 3 + (2 * TOP_LINE) / 3 },
        { x: 0.3, y: TOP_LINE },
        { x: 0.4, y: BASE_LINE / 3 + (2 * TOP_LINE) / 3 },
        { x: 0.5, y: (2 * BASE_LINE) / 3 + TOP_LINE / 3 },
        { x: 0.6, y: BASE_LINE },
      ],
    },
    {
      controlPoints: [
        { x: 0.1, y: MIDDLE_LINE },
        { x: 0.2, y: MIDDLE_LINE },
        { x: 0.3, y: MIDDLE_LINE },
        { x: 0.4, y: MIDDLE_LINE },
        { x: 0.5, y: MIDDLE_LINE },
      ],
    },
  ],
};

// Generate a path to draw the given letter.
// If `reference` is `anchor`, then
// the anchor point of the letter is at `(x, y)` in the coordinate system of the canvas.
// Since the anchor point is the lowest point of the letter, the letter will be 'above' `(x, y)`.
// If `reference` is `first`, then
// the first point of the letter is at `(x, y)`.
// The size of the letter is controlled by `scale` whith scales the letter local
// coordinate values to canvas values.
export function pathFromLetter(
  letter: Letter,
  x: number,
  y: number,
  scale: number,
  reference: "anchor" | "first"
): Path2D {
  const transformPoint: (point: ControlPoint) => [number, number] = (() => {
    if (reference === "anchor") {
      return (point) => [x + point.x * scale, y - point.y * scale];
    }
    if (reference === "first") {
      const firstPoint = letter.segments[0].controlPoints[0];
      return (point) => [
        x + (point.x - firstPoint.x) * scale,
        y - (point.y - firstPoint.y) * scale,
      ];
    }
    throw new Error("Unhandled reference system " + reference);
  })();

  const path = new Path2D();
  for (const segment of letter.segments) {
    const segmentPath = new Path2D();
    let isFirst = true;
    for (const point of segment.controlPoints) {
      if (isFirst) {
        segmentPath.moveTo(...transformPoint(point));
        isFirst = false;
      } else {
        segmentPath.lineTo(...transformPoint(point));
      }
    }
    path.addPath(segmentPath);
  }
  return path;
}

// Return an object to draw ruling starting at `(x, y)` on the drawing canvas,
// stretching for `width` (in canvas coordinates) to the right.
// The under line will be at `(x, y)`, the ther lines will be above this line on the canvas.
// `scale` will scale the coordinates to canvas values.
// Draw `numLines` (4: all four)
export function pathForRuling(
  x: number,
  y: number,
  width: number,
  scale: number,
  numLines: number = 4
): Path2D {
  // all lines start and end at the same x value
  const xBeginCanvas = x;
  const xEndCanvas = x + width;
  // y values on canvas to start lines
  if (numLines != 4) {
    console.error("Currently only 4 lines are supported; drawing 4 lines.");
  }
  const yCanvasValues = [UNDER_LINE, BASE_LINE, MIDDLE_LINE, TOP_LINE].map(
    (ly) => y - ly * scale
  );

  const path = new Path2D();
  // horizontal lines
  for (const yCanvas of yCanvasValues) {
    path.moveTo(xBeginCanvas, yCanvas);
    path.lineTo(xEndCanvas, yCanvas);
  }
  // vertical lines
  for (const xCanvas of [xBeginCanvas, xEndCanvas]) {
    path.moveTo(xCanvas, yCanvasValues[0]);
    path.lineTo(xCanvas, yCanvasValues[yCanvasValues.length - 1]);
  }

  return path;
}

export const LETTERS = {
  A: CAPITAL_A,
};
