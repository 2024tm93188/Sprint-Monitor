/**
 * Statistics Utility Functions
 * Pure functions for statistical calculations used in risk evaluation.
 * All functions are deterministic and explainable.
 */

/**
 * Calculate the arithmetic mean of an array of numbers.
 * @param values - Array of numeric values
 * @returns The mean, or 0 if array is empty
 *
 * @example
 * calculateMean([28, 32, 30]) // Returns 30
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the variance of an array of numbers.
 * Uses population variance (divides by n, not n-1).
 * @param values - Array of numeric values
 * @returns The variance, or 0 if array has less than 2 elements
 *
 * @example
 * calculateVariance([28, 32, 30]) // Returns 2.67
 */
export function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return calculateMean(squaredDiffs);
}

/**
 * Calculate the standard deviation of an array of numbers.
 * @param values - Array of numeric values
 * @returns The standard deviation (square root of variance)
 *
 * @example
 * calculateStandardDeviation([28, 32, 30]) // Returns ~1.63
 */
export function calculateStandardDeviation(values: number[]): number {
  return Math.sqrt(calculateVariance(values));
}

/**
 * Calculate the Coefficient of Variation (CV).
 * CV = standardDeviation / mean
 * A measure of relative variability, useful for comparing
 * variability across datasets with different means.
 *
 * @param values - Array of numeric values
 * @returns CV as a decimal (e.g., 0.15 = 15% variation)
 *
 * @example
 * calculateCoefficientOfVariation([28, 32, 30]) // Returns ~0.054
 */
export function calculateCoefficientOfVariation(values: number[]): number {
  const mean = calculateMean(values);
  if (mean === 0) return 0;
  const stdDev = calculateStandardDeviation(values);
  return stdDev / mean;
}

/**
 * Calculate a percentage rate from count data.
 * @param occurrences - Number of times event occurred
 * @param total - Total number of observations
 * @returns Percentage (0-100)
 *
 * @example
 * calculateRate(2, 10) // Returns 20 (20%)
 */
export function calculateRate(occurrences: number, total: number): number {
  if (total === 0) return 0;
  return (occurrences / total) * 100;
}

/**
 * Round a number to specified decimal places.
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamp a value between min and max bounds.
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate the median of an array of numbers.
 * @param values - Array of numeric values
 * @returns The median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate the weighted average.
 * @param values - Array of values
 * @param weights - Array of weights (must match values length)
 * @returns Weighted average
 */
export function calculateWeightedMean(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length || values.length === 0) return 0;

  const weightedSum = values.reduce(
    (acc, val, i) => acc + val * weights[i],
    0
  );
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}
