import { describe, expect, it } from 'vitest';
import { formatHourMinute, parseXmltvTimeRange, parseXmltvUtcTimestamp } from '../../src/epgs/time';

describe('parseXmltvTimeRange', () => {
  it('should extract date and hh:mm from XMLTV timestamps', () => {
    expect(parseXmltvTimeRange('20240314080000 +0800', '20240314093000 +0800')).toEqual({
      date: '2024-03-14',
      start: '08:00',
      end: '09:30',
    });
  });

  it('should return null when timestamps are invalid', () => {
    expect(parseXmltvTimeRange('invalid', '20240314093000 +0800')).toBeNull();
  });
});

describe('parseXmltvUtcTimestamp', () => {
  it('should parse compact XMLTV timestamp as UTC date', () => {
    const date = parseXmltvUtcTimestamp('20240314093000 +0000');

    expect(date?.toISOString()).toBe('2024-03-14T09:30:00.000Z');
  });

  it('should return null for invalid timestamp', () => {
    expect(parseXmltvUtcTimestamp('bad')).toBeNull();
  });
});

describe('formatHourMinute', () => {
  it('should format time as HH:mm', () => {
    const date = new Date(Date.UTC(2024, 2, 14, 9, 5, 0));

    expect(formatHourMinute(date)).toBe('09:05');
  });
});
