/**
 * Date and Timezone Utilities for Asia/Kolkata (IST: UTC+05:30)
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

/**
 * Returns Date objects representing the start and end of "today" in IST.
 */
function getISTTodayRange() {
  const nowUtc = new Date().getTime();
  const istTime = new Date(nowUtc + IST_OFFSET_MS);

  const year = istTime.getUTCFullYear();
  const month = istTime.getUTCMonth();
  const day = istTime.getUTCDate();

  // Start of day in IST converted back to UTC Date object
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS);
  // End of day in IST converted back to UTC Date object
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - IST_OFFSET_MS);

  return { startOfDay, endOfDay };
}

/**
 * Returns Date objects representing the start and end of a given Year-Month in IST.
 * @param {number} year - Full year (e.g. 2026)
 * @param {number} monthIndex - 0-indexed month (0 = Jan, 11 = Dec)
 */
function getISTMonthRange(year, monthIndex) {
  // Start of month in IST converted back to UTC Date
  const startOfMonth = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0) - IST_OFFSET_MS);

  // Number of days in the target month
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const endOfMonth = new Date(Date.UTC(year, monthIndex, daysInMonth, 23, 59, 59, 999) - IST_OFFSET_MS);

  return { startOfMonth, endOfMonth };
}

module.exports = {
  getISTTodayRange,
  getISTMonthRange
};
