const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getISTDateString(date = new Date()) {
  const utc = new Date(date).getTime();
  const istTime = new Date(utc + IST_OFFSET_MS);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getISTDaysDifference(pastDate, currentDate = new Date()) {
  const pastStr = getISTDateString(pastDate);
  const curStr = getISTDateString(currentDate);

  const [py, pm, pd] = pastStr.split('-').map(Number);
  const [cy, cm, cd] = curStr.split('-').map(Number);

  const pastMidnightUTC = Date.UTC(py, pm - 1, pd);
  const curMidnightUTC = Date.UTC(cy, cm - 1, cd);

  return Math.round((curMidnightUTC - pastMidnightUTC) / (24 * 60 * 60 * 1000));
}

export function isSaleWithin2DaysIST(saleDate) {
  if (!saleDate) return false;
  const diffDays = getISTDaysDifference(saleDate);
  return diffDays >= 0 && diffDays <= 2;
}
