export type ItemInfluence = 'searing-exarch' | 'eater-of-worlds';

export interface ActiveLeague {
  id: string;
  name: string;
  platform: 'pc';
}

export interface ScreenshotOcrResult {
  text: string;
  processedAt: string;
}

export interface ScreenshotOcrRequest {
  storagePath: string;
  requestId: string;
}

export interface ItemAffix {
  raw: string;
  code?: string;
  range?: number;
  tags: string[];
  crafted: boolean;
  unveiled: boolean;
}

export interface NormalizedItemTarget {
  baseName: string;
  itemLevel?: number;
  rarity?: string;
  armour?: number;
  armourBasePercentile?: number;
  energyShield?: number;
  energyShieldBasePercentile?: number;
  influences: ItemInfluence[];
  crafted: boolean;
  prefixes: ItemAffix[];
  suffixes: ItemAffix[];
  catalystQuality?: number;
  quality?: number;
  sockets?: string;
  levelReq?: number;
  implicits: string[];
  explicits: string[];
  unparsedLines: string[];
}
