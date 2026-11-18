/** Ordinary least-squares fit. Returns null when fewer than two distinct x values exist. */
export function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const count = points.length;
  if (count < 2) return null;
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  const meanX = sumX / count;
  const meanY = sumY / count;
  let covariance = 0;
  let varianceX = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    covariance += dx * (point.y - meanY);
    varianceX += dx * dx;
  }
  if (varianceX === 0) return null;
  const slope = covariance / varianceX;
  return { slope, intercept: meanY - slope * meanX };
}
