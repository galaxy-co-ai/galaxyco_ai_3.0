export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain: string;
}

export interface SearchResultDisplay {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  favicon?: string;
}

