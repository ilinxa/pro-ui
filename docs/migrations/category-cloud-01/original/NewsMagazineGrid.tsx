"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Calendar, Filter, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { NewsType } from "@/types/newsTypes";
import NewsCard from "./NewsCard";
import { categories, generateMockNews } from "@/data/newsData";


// Mock news data



const NewsMagazineGrid = () => {
  const [allNews] = useState<NewsType[]>(generateMockNews());
  const [displayedNews, setDisplayedNews] = useState<NewsType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 6;

  // Filter news
  const getFilteredNews = useCallback(() => {
    return allNews.filter(news => {
      // Search filter
      const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          news.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          news.author.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (activeCategory !== "Tümü" && news.category !== activeCategory) return false;

      // Date filter
      const newsDate = new Date(news.date);
      if (dateRange.from && newsDate < dateRange.from) return false;
      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        if (newsDate > endDate) return false;
      }

      return true;
    });
  }, [allNews, searchQuery, activeCategory, dateRange]);

  // Sort by date (newest first)
  const getSortedNews = useCallback((filtered: NewsType[]) => {
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Reset and load initial news when filters change
  useEffect(() => {
    const filtered = getFilteredNews();
    const sorted = getSortedNews(filtered);
    setDisplayedNews(sorted.slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(sorted.length > ITEMS_PER_PAGE);
  }, [searchQuery, activeCategory, dateRange, getFilteredNews, getSortedNews]);

  // Load more
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    setTimeout(() => {
      const filtered = getFilteredNews();
      const sorted = getSortedNews(filtered);
      const nextPage = page + 1;
      const end = nextPage * ITEMS_PER_PAGE;

      setDisplayedNews(sorted.slice(0, end));
      setPage(nextPage);
      setHasMore(end < sorted.length);
      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore, page, getFilteredNews, getSortedNews]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const featuredNews = displayedNews.find(n => n.featured);
  const regularNews = displayedNews.filter(n => !n.featured || n !== featuredNews);
  const filteredCount = getFilteredNews().length;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Header with search and filters */}
        <div className="mb-12 space-y-6">
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Haber ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg rounded-xl border-border/50 focus:border-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full">
                  <Calendar className="w-4 h-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "d MMM", { locale: tr })} - ${format(dateRange.to, "d MMM", { locale: tr })}`
                    ) : (
                      format(dateRange.from, "d MMMM yyyy", { locale: tr })
                    )
                  ) : (
                    "Tarih Filtrele"
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Clear date filter */}
            {(dateRange.from || dateRange.to) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilter} className="gap-1">
                <X className="w-3 h-3" />
                Tarihi Temizle
              </Button>
            )}
          </div>

          {/* Results count */}
          <p className="text-center text-muted-foreground text-sm">
            {filteredCount} haber bulundu
          </p>
        </div>

        {/* Magazine Layout */}
        {displayedNews.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Article */}
            {featuredNews && page === 1 && (
              <div className="mb-12">
                <NewsCard news={featuredNews} variant="featured" />
              </div>
            )}

            {/* Main Grid - Magazine Style */}
            <div className="grid grid-cols-12 gap-6">
              {/* Main Column */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* Large Article */}
                {regularNews[0] && (
                  <NewsCard news={regularNews[0]} variant="large" />
                )}

                {/* Two Medium Articles */}
                <div className="grid md:grid-cols-2 gap-6">
                  {regularNews.slice(1, 3).map((news) => (
                    <NewsCard key={news.id} news={news} variant="medium" />
                  ))}
                </div>

                {/* Rest of articles in grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularNews.slice(3).map((news) => (
                    <NewsCard key={news.id} news={news} variant="medium" />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="col-span-12 lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                  {/* Popular News */}
                  <div className="bg-card rounded-2xl p-6 border border-border/50">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-4 pb-2 border-b border-border">
                      Popüler Haberler
                    </h3>
                    <div className="space-y-1">
                      {allNews
                        .sort((a, b) => (b.views || 0) - (a.views || 0))
                        .slice(0, 5)
                        .map((news) => (
                          <NewsCard key={news.id} news={news} variant="list" />
                        ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="bg-card rounded-2xl p-6 border border-border/50">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-4 pb-2 border-b border-border">
                      Kategoriler
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c !== "Tümü").map((category) => {
                        const count = allNews.filter(n => n.category === category).length;
                        return (
                          <Badge
                            key={category}
                            variant={activeCategory === category ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setActiveCategory(category)}
                          >
                            {category} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Newsletter CTA */}
                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-2">
                      Bültenimize Katılın
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      En güncel haberleri e-posta ile alın.
                    </p>
                    <div className="flex gap-2">
                      <Input placeholder="E-posta adresiniz" className="flex-1" />
                      <Button>Abone Ol</Button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Filter className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Haber Bulunamadı</h3>
            <p className="text-muted-foreground">Arama kriterlerinize uygun haber bulunamamıştır.</p>
          </div>
        )}

        {/* Infinite Scroll Loader */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            </div>
          )}
          {!hasMore && displayedNews.length > 0 && (
            <p className="text-muted-foreground text-sm">Tüm haberler gösterildi</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsMagazineGrid;
