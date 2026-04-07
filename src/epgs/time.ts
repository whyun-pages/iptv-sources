export interface XmltvTimeRange {
  date: string;
  start: string;
  end: string;
}

/** XMLTV start/stop 格式: 20240314080000 +0800 → 提取 YYYY-mm-dd 与 HH:mm */
export function parseXmltvTimeRange(startStr: string, stopStr: string): XmltvTimeRange | null {
  const startMatch = startStr?.match(/^(\d{14})/);
  const stopMatch = stopStr?.match(/^(\d{14})/);
  if (!startMatch || !stopMatch) return null;

  const start = startMatch[1];
  const stop = stopMatch[1];

  return {
    date: `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`,
    start: `${start.slice(8, 10)}:${start.slice(10, 12)}`,
    end: `${stop.slice(8, 10)}:${stop.slice(10, 12)}`,
  };
}

/**
 * 将 XMLTV 时间戳（YYYYmmddHHMMSS +ZZZZ）按其前 14 位解析为 UTC 时间。
 * epg.pw 返回的时间以 UTC 为准，时区偏移可忽略。
 */
export function parseXmltvUtcTimestamp(timeStr: string): Date | null {
  const match = timeStr?.match(/^(\d{14})/);
  if (!match) return null;

  const compact = match[1];
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6)) - 1;
  const day = Number(compact.slice(6, 8));
  const hour = Number(compact.slice(8, 10));
  const minute = Number(compact.slice(10, 12));
  const second = Number(compact.slice(12, 14));

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

export function formatHourMinute(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
