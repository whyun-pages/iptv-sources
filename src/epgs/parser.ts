/**
 * 解析 XMLTV 格式 EPG XML，按日期、频道分组并转换为目标 JSON 结构
 * 使用 xml2js 解析
 */

import {
  normalizeXmlList,
  readXmlAttr,
  readXmltvChannelName,
  readXmltvProgrammeTitle,
  parseXmltvRoot,
  type XmltvChannelNode,
  type XmltvProgrammeNode,
} from './xml';
import { parseXmltvTimeRange } from './time';

export interface EpgProgrammeItem {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  title: string;
}

export interface EpgChannelJson {
  channel: string;
  epg_data: EpgProgrammeItem[];
}

/** 将频道名转为安全文件名（去掉非法字符） */
export function sanitizeChannelFileName(channel: string): string {
  return channel.replace(/[/\\:*?"<>|]/g, '_').trim() || 'channel';
}

type ParsedProgramme = XmltvProgrammeNode;
type ChannelId = string;
type ChannelName = string;
type ChannelFromXml = XmltvChannelNode;
type ParsedChannel = Record<ChannelId, ChannelName>;

function toProgrammeList(programme: unknown): ParsedProgramme[] {
  return normalizeXmlList(programme as ParsedProgramme | ParsedProgramme[] | undefined);
}

function pickChannelName(channel: ChannelFromXml): string {
  return readXmltvChannelName(channel);
}

function toChannelList(channel: unknown): ParsedChannel {
  const parsedChannels: ParsedChannel = {};
  const channels = normalizeXmlList(channel as ChannelFromXml | ChannelFromXml[] | undefined);

  for (const c of channels) {
    const id = readXmlAttr(c, 'id');
    parsedChannels[id] = pickChannelName(c);
  }
  return parsedChannels;
}

/**
 * 解析单段 XML，返回 (date, channel, EpgProgrammeItem) 列表
 */
export function parseEpgXml(
  xml: string
): Array<{ date: string; channel: string; item: EpgProgrammeItem }> {
  const tv = parseXmltvRoot(xml);
  if (!tv) return [];

  if (!tv.channel) {
    console.warn(`[WARNING] No channels found in XML`);
    return [];
  }

  const channels = toChannelList(tv.channel);
  console.log(`[TASK] Parse ${Object.keys(channels).length} channels`);
  const programmes = toProgrammeList(tv.programme);
  const out: Array<{ date: string; channel: string; item: EpgProgrammeItem }> = [];

  for (const p of programmes) {
    const channelId = readXmlAttr(p, 'channel');
    const startAttr = readXmlAttr(p, 'start');
    const stopAttr = readXmlAttr(p, 'stop');
    const time = parseXmltvTimeRange(startAttr, stopAttr);
    const title = readXmltvProgrammeTitle(p);
    if (!channelId || !time) {
      continue;
    }
    const channel = channels[channelId];
    if (!channel) {
      console.warn(`[WARNING] Channel ${channelId} not found in XML`);
      continue;
    }
    out.push({
      date: time.date,
      channel,
      item: { start: time.start, end: time.end, title },
    });
  }
  return out;
}

/**
 * 将多个 XML 的解析结果按日期、频道合并，同一频道同一天按 start 排序
 */
export function mergeByDateAndChannel(
  allItems: Array<{ date: string; channel: string; item: EpgProgrammeItem }>
): Map<ChannelName, EpgChannelJson> {
  const byKey = new Map<string, EpgProgrammeItem[]>();
  for (const { date, channel, item } of allItems) {
    const key = `${date}\t${channel}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(item);
  }
  const result = new Map<ChannelName, EpgChannelJson>();
  for (const [key, items] of byKey) {
    const [, channel] = key.split('\t');
    items.sort((a, b) => a.start.localeCompare(b.start));
    result.set(key, { channel, epg_data: items });
  }
  return result;
}
