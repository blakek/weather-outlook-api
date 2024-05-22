export type Point = [number, number];
export type Polygon = Point[];
export type Line = [Point, Point];

const POLYGON_MINIMUM_POINTS = 3;

export function arePointsEqual(point1: Point, point2: Point): boolean {
  return point1[0] === point2[0] && point1[1] === point2[1];
}

export function arePolygonsEqual(
  polygon1: Polygon,
  polygon2: Polygon,
): boolean {
  if (polygon1.length !== polygon2.length) {
    return false;
  }

  // Find polygon1[0] in polygon2
  const offset = polygon2.findIndex((point) =>
    arePointsEqual(point, polygon1[0]),
  );

  if (offset === -1) {
    return false;
  }

  const shouldTryReverse = !arePointsEqual(
    polygon1[1],
    polygon2[(offset + 1) % polygon2.length],
  );

  const step = shouldTryReverse ? -offset : offset;

  const getOffsetIndex = (p1i: number) =>
    Math.abs((p1i + step) % polygon2.length);

  return polygon1.every((point, index) =>
    arePointsEqual(point, polygon2[getOffsetIndex(index)]),
  );
}

export const pointToString = ([x, y]: Point): string => `(${x}, ${y})`;

export function getMinMaxXY(
  polygon: Polygon,
  tolerance = 0,
): [minX: number, minY: number, maxX: number, maxY: number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  polygon.forEach(([x, y]) => {
    if (x < minX) {
      minX = x;
    }

    if (x > maxX) {
      maxX = x;
    }

    if (y < minY) {
      minY = y;
    }

    if (y > maxY) {
      maxY = y;
    }
  });

  minX -= tolerance;
  minY -= tolerance;
  maxX += tolerance;
  maxY += tolerance;

  return [minX, minY, maxX, maxY];
}

export function getBoundingBox(polygon: Polygon, tolerance = 0): Polygon {
  const [minX, minY, maxX, maxY] = getMinMaxXY(polygon, tolerance);

  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ] as Polygon;
}

export function doesPointIntersectLine(
  [x, y]: Point,
  [[x1, y1], [x2, y2]]: Line,
): boolean {
  const isWithinYBounds = y < y1 !== y < y2;

  if (!isWithinYBounds) {
    return false;
  }

  const lineSlope = (x2 - x1) / (y2 - y1);
  const verticalDifference = y - y1;
  const lineIntersect = lineSlope * verticalDifference + x1;
  return x < lineIntersect;
}

export function isPointInBoundingBox(
  polygon: Polygon,
  point: Point,
  tolerance = 0,
): boolean {
  const [minX, minY, maxX, maxY] = getMinMaxXY(polygon, tolerance);

  return (
    point[0] >= minX && point[0] <= maxX && point[1] >= minY && point[1] <= maxY
  );
}

/**
 * Returns the distance between two points.
 */
export function distance([x1, y1]: Point, [x2, y2]: Point): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Returns the unit vector of a line.
 * This is useful for determining the direction of a line.
 */
export function getUnitVector(
  line: Line,
): [xMagnitude: number, yMagnitude: number] {
  const [start, end] = line;
  const [dx, dy] = [end[0] - start[0], end[1] - start[1]];
  const magnitude = distance(start, end);
  return [dx / magnitude, dy / magnitude];
}

/**
 * Returns the normal vector of a line.
 * This is useful for determining the direction perpendicular to a line.
 */
export function getNormalVector(line: Line): Point {
  const [dx, dy] = getUnitVector(line);
  // Rotate the unit vector by 90 degrees
  return [dy, -dx];
}

export function offsetPoint(
  point: Point,
  normal: Point,
  distance: number,
): Point {
  const [dx, dy] = normal;
  return [point[0] + dx * distance, point[1] + dy * distance];
}

export function inflatePolygon(polygon: Polygon, distance: number): Polygon {
  if (distance === 0) {
    return polygon;
  }

  const inflated: Polygon = polygon.map((point, index) => {
    const previousPoint =
      polygon[(index - 1 + polygon.length) % polygon.length];
    const nextPoint = polygon[(index + 1) % polygon.length];

    // Compute normal vectors for both edges connected to the point
    const normalPrev = getNormalVector([previousPoint, point]);
    const normalNext = getNormalVector([point, nextPoint]);

    // Average the normals to get a smooth inflation
    const normal = [
      (normalPrev[0] + normalNext[0]) / 2,
      (normalPrev[1] + normalNext[1]) / 2,
    ];

    // Normalize the averaged normal vector
    const magnitude = Math.sqrt(normal[0] ** 2 + normal[1] ** 2);
    const normalizedNormal: Point = [
      normal[0] / magnitude,
      normal[1] / magnitude,
    ];

    return offsetPoint(point, normalizedNormal, distance);
  });

  return inflated;
}

export function isPointInPolygon(
  polygon: Polygon,
  point: Point,
  /**
   * If provided, a point on the polygon's edge or within this distance of the
   * edge will be considered inside the polygon. This also helps with rounding
   * errors.
   */
  tolerance = 0,
): [isInPolygon: boolean, reason?: string] {
  // Point cannot be inside a polygon with less than 3 points
  if (polygon.length < POLYGON_MINIMUM_POINTS) {
    return [false, "not a polygon"];
  }

  // Optimization: First check if the point is within the bounding box.
  const isInBoundingBox = isPointInBoundingBox(polygon, point, tolerance);

  if (!isInBoundingBox) {
    return [false, "outside bounding box"];
  }

  const inflatedPolygon = inflatePolygon(polygon, tolerance);

  const isInside = inflatedPolygon.reduce(
    (wasLastInside, vertex, pointIndex, polygon) => {
      const previousVertex = polygon.at(pointIndex - 1)!;

      const intersectsLine = doesPointIntersectLine(point, [
        vertex,
        previousVertex,
      ]);

      // If we intersect a line, we toggle the inside/outside state
      if (intersectsLine) {
        return !wasLastInside;
      }

      // Keep the same state if we don't intersect the line
      return wasLastInside;
    },
    false,
  );

  return [isInside];
}

export function isValidPoint(maybePoint: unknown): maybePoint is Point {
  return (
    Array.isArray(maybePoint) &&
    maybePoint.length === 2 &&
    maybePoint.every(isFinite)
  );
}

export function isValidPolygon(maybePolygon: unknown): maybePolygon is Polygon {
  if (!Array.isArray(maybePolygon)) {
    return false;
  }

  if (maybePolygon.length < POLYGON_MINIMUM_POINTS) {
    return false;
  }

  return maybePolygon.every((point) => isValidPoint(point));
}
