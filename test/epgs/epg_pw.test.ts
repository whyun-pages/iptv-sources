import { describe, expect, it } from 'vitest';
import { buildPwChannelJson, parseChannelListFromHtml, parsePwEpgXml } from '../../src/epgs/epg_pw';

describe('parseChannelListFromHtml', () => {
  it('should extract unique channel ids and trim names', () => {
    const html = `
      <a href="/last/100.html?lang=zh-hans"> CCTV-1 综合 </a>
      <a href="/last/100.html?lang=zh-hans">CCTV-1 综合</a>
      <a href="/last/200.html?lang=zh-hans">北京卫视</a>
    `;

    expect(parseChannelListFromHtml(html)).toEqual([
      { id: '100', name: 'CCTV-1 综合' },
      { id: '200', name: '北京卫视' },
    ]);
  });
});

describe('parsePwEpgXml', () => {
  it('should parse channel and programme nodes from XMLTV fragment', () => {
    const xml = `<?xml version="1.0"?>
<tv>
  <channel id="100">
    <display-name lang="zh">CCTV-1 综合</display-name>
  </channel>
  <programme start="20240314000000 +0000" stop="20240314010000 +0000" channel="100">
    <title lang="zh">午夜新闻</title>
  </programme>
</tv>`;

    const parsed = parsePwEpgXml(xml);

    expect(parsed.channels).toHaveLength(1);
    expect(parsed.programmes).toHaveLength(1);
    expect(parsed.channels[0].$?.id).toBe('100');
    expect(parsed.programmes[0].$?.channel).toBe('100');
  });

  it('should return empty arrays for malformed xml', () => {
    expect(parsePwEpgXml('<tv><channel id="1"></tv>')).toEqual({
      channels: [],
      programmes: [],
    });
  });
});

describe('buildPwChannelJson', () => {
  it('should convert UTC XMLTV programmes into TVBox json items', () => {
    const xml = `<?xml version="1.0"?>
<tv>
  <channel id="100">
    <display-name lang="zh">CCTV-1 综合</display-name>
  </channel>
  <programme start="20240314003000 +0000" stop="20240314010000 +0000" channel="100">
    <title lang="zh">午夜新闻</title>
  </programme>
  <programme start="invalid" stop="20240314020000 +0000" channel="100">
    <title>Should Skip</title>
  </programme>
</tv>`;

    const parsed = parsePwEpgXml(xml);
    const json = buildPwChannelJson(parsed.channels[0], parsed.programmes);

    expect(json).toEqual({
      channel: 'cctv-1 综合',
      epg_data: [
        {
          start: '00:30',
          end: '01:00',
          title: '午夜新闻',
        },
      ],
    });
  });
});
