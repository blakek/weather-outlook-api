export type Point = [number, number];
export type Polygon = Point[];
export type Line = [Point, Point];

const POLYGON_MINIMUM_POINTS = 3;

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

export function isPointInPolygon(polygon: Polygon, point: Point): boolean {
  // Point cannot be inside a polygon with less than 3 points
  if (polygon.length < POLYGON_MINIMUM_POINTS) {
    return false;
  }

  // Optimization: First check if the point is within the bounding box.
  const isInBoundingBox = isPointInBoundingBox(polygon, point);

  if (!isInBoundingBox) {
    return false;
  }

  const isInside = polygon.reduce(
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

  return isInside;
}
