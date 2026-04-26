/**
 * retryWrapper.js
 * Wraps any async function with exponential-backoff retry logic.
 * Specifically designed to handle transient LLM API failures.
 */

/**
 * Execute an async function with retries on failure.
 * @param {Function} fn          - Async function to execute
 * @param {number}   maxRetries  - Maximum number of attempts (default: 3)
 * @param {number}   baseDelay   - Base delay in ms (default: 500)
 * @returns {Promise<any>}
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 500) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry on validation/client errors
      if (err.statusCode && err.statusCode < 500 && err.statusCode !== 429) {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 500, 1000, 2000
        console.warn(`[RetryWrapper] Attempt ${attempt} failed. Retrying in ${delay}ms...`, err.message);
        await sleep(delay);
      }
    }
  }

  console.error(`[RetryWrapper] All ${maxRetries} attempts failed.`);
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { withRetry };
