export interface Bit {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  collections?: string[]; // Optional collections/sets this bit belongs to
}
