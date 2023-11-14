// Code to check that a character is written well.

import { ControlPoint, LetterSegment, Letter } from "./alphabet";

export enum DrawingQuality {
  Good,
  Suboptimal,
  Bad,
}

type Vector = [number, number];

function dotProduct(a: Vector, b: Vector): number {
  return a.map((_, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function lengthOfVector(a: Vector): number {
  return Math.sqrt(a[0] ** 2 + a[1] ** 2);
}

// Return the vector with same direction but length 1
function normedVector(v: Vector): Vector {
  const len = lengthOfVector(v);
  return [v[0] / len, v[1] / len];
}

// Distance between `(x, y)` and `point` (all in units/frame of the letter).
function distanceToControlpoint(
  x: number,
  y: number,
  point: ControlPoint
): number {
  return lengthOfVector([x - point.x, y - point.y]);
}

// Distance between `(x, y)` and the line between `pointBegin` and `pointEnd` (all in units/frame of the letter).
function distanceToLineBetweenControlPoints(
  x: number,
  y: number,
  pointBegin: ControlPoint,
  pointEnd: ControlPoint
): number {
  const lineNormal = normedVector([
    -(pointEnd.y - pointBegin.y),
    pointEnd.x - pointBegin.x,
  ]);
  const beginToPoint: [number, number] = [x - pointBegin.x, y - pointBegin.y];
  return Math.abs(dotProduct(beginToPoint, lineNormal));
}

export class CharacterDrawChecker {
  private currentSegmentIndex: number = 0;
  // Next control point that the pencil has to get to.
  private nextControlPointIndex: number = 0;
  // Last control point the pencil has 'done'.
  private lastControlPointIndex: number | null = null;
  // Whether a line connects the last control point to the next control ponit.
  // If false, the last checkpoint may be null.
  private isNextCheckpointOnLine: boolean = false;
  private lastPosition: Vector | null = null;

  public constructor(
    public letter: Letter,
    public suboptimalDistance: number = 5,
    public badDistance: number = 12
  ) {}

  private getNextControlPoint(): ControlPoint {
    return this.letter.segments[this.currentSegmentIndex].controlPoints[
      this.nextControlPointIndex
    ];
  }

  private getLastControlPoint(): ControlPoint {
    if (this.lastControlPointIndex == null) {
      throw new Error("No last control point given.");
    }
    return this.letter.segments[this.currentSegmentIndex].controlPoints[
      this.lastControlPointIndex
    ];
  }

  private rateDistance(distance: number): DrawingQuality {
    if (distance < this.suboptimalDistance) {
      return DrawingQuality.Good;
    }
    if (distance < this.badDistance) {
      return DrawingQuality.Suboptimal;
    }
    return DrawingQuality.Bad;
  }

  public addDrawnPoint(x: number, y: number): DrawingQuality {
    this.lastPosition = [x, y];
    if (this.isNextCheckpointOnLine) {
      const distance = distanceToLineBetweenControlPoints(
        x,
        y,
        this.getLastControlPoint(),
        this.getNextControlPoint()
      );
      return this.rateDistance(distance);
    } else {
      const distance = distanceToControlpoint(x, y, this.getNextControlPoint());
      return this.rateDistance(distance);
    }
  }
}
