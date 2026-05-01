
import { Calendar, Clock, User, ArrowRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { NewsCardProps } from "@/types/newsTypes";


const categoryColors: Record<string, string> = {
  "Kentsel Dönüşüm": "bg-primary/10 text-primary",
  "Sürdürülebilirlik": "bg-success/10 text-success",
  "Teknoloji": "bg-accent/10 text-accent",
  "Etkinlik": "bg-warning/10 text-warning",
  "Duyuru": "bg-destructive/10 text-destructive",
  "Araştırma": "bg-secondary text-secondary-foreground",
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return formatDate(dateString);
};

const NewsCard = ({ news, variant = "medium" }: NewsCardProps) => {
  if (variant === "featured") {
    return (
      <Link href={`/news/${news.id}`} className="group block">
        <article className="relative h-125 md:h-150 rounded-2xl overflow-hidden">
          <img
            src={news.image}
            alt={news.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <Badge className={`${categoryColors[news.category] || "bg-muted"} w-fit mb-4`}>
              {news.category}
            </Badge>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight group-hover:text-primary-foreground/90 transition-colors">
              {news.title}
            </h2>

            <p className="text-white/80 text-lg md:text-xl mb-6 max-w-3xl line-clamp-3">
              {news.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-white/70">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{news.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{getRelativeTime(news.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{news.readTime} dk okuma</span>
              </div>
              <span className="inline-flex items-center gap-2 text-white group-hover:text-primary transition-colors ml-auto">
                Devamını Oku <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "large") {
    return (
      <Link href={`/news/${news.id}`} className="group block">
        <article className="grid md:grid-cols-2 gap-6 bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300">
          <div className="relative h-64 md:h-full min-h-75 overflow-hidden">
            <img
              src={news.image}
              alt={news.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <Badge className={`${categoryColors[news.category] || "bg-muted"} w-fit mb-4`}>
              {news.category}
            </Badge>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {news.title}
            </h3>
            <p className="text-muted-foreground mb-4 line-clamp-3">{news.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {news.author}
              </span>
              <span>{getRelativeTime(news.date)}</span>
              <span>{news.readTime} dk</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "small") {
    return (
      <Link href={`/news/${news.id}`} className="group block">
        <article className="flex gap-4 p-4 bg-card rounded-xl border border-border/50 hover:shadow-md transition-all duration-300">
          <img
            src={news.image}
            alt={news.title}
            className="w-24 h-24 rounded-lg object-cover shrink-0"
          />
          <div className="flex flex-col justify-center min-w-0">
            <Badge className={`${categoryColors[news.category] || "bg-muted"} w-fit mb-2 text-xs`}>
              {news.category}
            </Badge>
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">
              {news.title}
            </h4>
            <span className="text-xs text-muted-foreground mt-1">{getRelativeTime(news.date)}</span>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link href={`/news/${news.id}`} className="group block">
        <article className="flex gap-4 py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors rounded-lg px-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-xs">
                {news.category}
              </Badge>
              <span className="text-xs text-muted-foreground">{getRelativeTime(news.date)}</span>
            </div>
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {news.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{news.excerpt}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
        </article>
      </Link>
    );
  }

  // Default: medium
  return (
    <Link href={`/news/${news.id}`} className="group block h-full">
      <article className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <img
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <Badge className={`${categoryColors[news.category] || "bg-muted"}`}>
              {news.category}
            </Badge>
          </div>
          {news.views && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
              <Eye className="w-3 h-3" />
              {news.views}
            </div>
          )}
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {news.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">{news.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
            <span>{news.author}</span>
            <span>{getRelativeTime(news.date)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default NewsCard;
export { categoryColors, formatDate, getRelativeTime };
