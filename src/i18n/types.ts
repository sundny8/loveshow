export type SubsectionData = {
  title: string;
  intro?: string;
  items?: string[];
};

export type SectionData = {
  title: string;
  content?: string;
  intro?: string;
  items?: string[];
  subsections?: SubsectionData[];
  moderation?: string;
  report?: string;
};
