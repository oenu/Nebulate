export interface ChannelEntry {
  matched: string[];
  not_matched: string[];
  slug: string;
}

export interface LookupTable {
  channels: ChannelEntry[];
  generatedAt: Date;
  id: string;
}
