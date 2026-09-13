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

/**
 * Converts any Date/timestamp to 'YYYY-MM-DD' formatted date string in IST.
 */
function getISTDateString(date = new Date()) {
  const utc = new Date(date).getTime();
  const istTime = new Date(utc + IST_OFFSET_MS);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between a past date and now in Asia/Kolkata timezone.
 * Returns:
 * 0 if same calendar day in IST
 * 1 if 1 day ago in IST
 * 2 if 2 days ago in IST
 * etc.
 */
function getISTDaysDifference(pastDate, currentDate = new Date()) {
  const pastStr = getISTDateString(pastDate);
  const curStr = getISTDateString(currentDate);

  const [py, pm, pd] = pastStr.split('-').map(Number);
  const [cy, cm, cd] = curStr.split('-').map(Number);

  const pastMidnightUTC = Date.UTC(py, pm - 1, pd);
  const curMidnightUTC = Date.UTC(cy, cm - 1, cd);

  return Math.round((curMidnightUTC - pastMidnightUTC) / (24 * 60 * 60 * 1000));
}

/**
 * Checks if a sale created date is within 2 days calculated in Asia/Kolkata timezone.
 */
function isSaleWithin2DaysIST(saleDate) {
  if (!saleDate) return false;
  const diffDays = getISTDaysDifference(saleDate);
  return diffDays >= 0 && diffDays <= 2;
}

/**
 * Returns Date objects representing start and end of week (Monday to Sunday) in IST.
 */
function getISTWeekRange() {
  const nowUtc = new Date().getTime();
  const istTime = new Date(nowUtc + IST_OFFSET_MS);

  const year = istTime.getUTCFullYear();
  const month = istTime.getUTCMonth();
  const day = istTime.getUTCDate();
  const dayOfWeek = istTime.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const mondayUtc = Date.UTC(year, month, day - daysSinceMonday, 0, 0, 0, 0) - IST_OFFSET_MS;
  const sundayUtc = Date.UTC(year, month, day - daysSinceMonday + 6, 23, 59, 59, 999) - IST_OFFSET_MS;

  return {
    startOfWeek: new Date(mondayUtc),
    endOfWeek: new Date(sundayUtc)
  };
}

/**
 * Helper to get date range for presets: 'today', 'this_week', 'this_month', 'custom'
 */
function getISTDateRangePreset(preset, customStart, customEnd) {
  if (preset === 'today') {
    const { startOfDay, endOfDay } = getISTTodayRange();
    return { startDate: startOfDay, endDate: endOfDay };
  }
  if (preset === 'this_week') {
    const { startOfWeek, endOfWeek } = getISTWeekRange();
    return { startDate: startOfWeek, endDate: endOfWeek };
  }
  if (preset === 'this_month') {
    const nowIst = new Date(new Date().getTime() + IST_OFFSET_MS);
    const { startOfMonth, endOfMonth } = getISTMonthRange(nowIst.getUTCFullYear(), nowIst.getUTCMonth());
    return { startDate: startOfMonth, endDate: endOfMonth };
  }
  if (preset === 'custom' && customStart && customEnd) {
    const [sy, sm, sd] = customStart.split('-').map(Number);
    const [ey, em, ed] = customEnd.split('-').map(Number);
    const startUtc = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0) - IST_OFFSET_MS);
    const endUtc = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - IST_OFFSET_MS);
    return { startDate: startUtc, endDate: endUtc };
  }
  return { startDate: null, endDate: null };
}

module.exports = {
  getISTTodayRange,
  getISTMonthRange,
  getISTDateString,
  getISTDaysDifference,
  isSaleWithin2DaysIST,
  getISTWeekRange,
  getISTDateRangePreset
};
