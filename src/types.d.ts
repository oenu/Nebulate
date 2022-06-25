export interface CreatorEntry {
  matched: string[];
  not_matched: string[];
  slug: string;
}

export interface LookupTable {
  creators: CreatorEntry[];
  generatedAt: Date;
  hash: string;
}
