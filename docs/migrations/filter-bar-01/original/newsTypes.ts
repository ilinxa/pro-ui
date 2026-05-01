export interface NewsType {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  date: string;
  readTime: number;
  image: string;
  featured?: boolean;
  views?: number;
}
export interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
}

export interface NewsCardProps {
  news: NewsType;
  variant?: "featured" | "large" | "medium" | "small" | "list";
}

export interface NewsDetail extends NewsType {
  content: string;
  tags: string[];
}
