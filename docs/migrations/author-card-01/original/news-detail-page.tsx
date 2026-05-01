'use client';
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Calendar, Clock, User, ArrowLeft, Share2, 
  Facebook, Twitter, Linkedin, Copy, Check,
   Eye, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryColors, formatDate } from "@/components/public/sections/news/NewsCard";
import Link from "next/link";
import { NewsDetail } from "@/types/newsTypes";
import { mockNewsDetails, relatedNews } from "@/data/newsData";
// import { Separator } from "@/components/ui/separator";






const NewsDetailPage = () => {
  const { id } = useParams();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const newsId = Array.isArray(id) ? id[0] : (id || "1");
    const newsData = mockNewsDetails[newsId] || mockNewsDetails["1"];
    setNews(newsData);
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (

      <main>
        {/* Hero Image */}
        <section className="relative h-[50vh] min-h-100">
          <img
            src={news.image}
            alt={news.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
          
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <Link href="/news" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Tüm Haberler
              </Link>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={categoryColors[news.category] || "bg-muted"}>
                  {news.category}
                </Badge>
                {news.featured && (
                  <Badge className="bg-primary text-primary-foreground">Öne Çıkan</Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 max-w-4xl leading-tight">
                {news.title}
              </h1>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-12 gap-12">
              {/* Main Content */}
              <article className="lg:col-span-8">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{news.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(news.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{news.readTime} dk okuma</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{news.views} görüntülenme</span>
                  </div>
                </div>

                {/* Lead */}
                <p className="text-xl text-foreground leading-relaxed mb-8 font-medium">
                  {news.excerpt}
                </p>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
                  {news.content.split('\n').map((paragraph, index) => {
                    if (paragraph.startsWith('## ')) {
                      return <h2 key={index} className="text-2xl font-serif font-bold text-foreground mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
                    }
                    if (paragraph.startsWith('### ')) {
                      return <h3 key={index} className="text-xl font-serif font-bold text-foreground mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
                    }
                    if (paragraph.startsWith('> ')) {
                      return (
                        <blockquote key={index} className="border-l-4 border-primary pl-6 py-2 my-6 bg-muted/30 rounded-r-lg italic">
                          {paragraph.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return <p key={index} className="font-semibold text-foreground mt-4">{paragraph.replace(/\*\*/g, '')}</p>;
                    }
                    if (paragraph.startsWith('- **')) {
                      const match = paragraph.match(/- \*\*(.+?)\*\*:?\s*(.+)?/);
                      if (match) {
                        return (
                          <div key={index} className="flex gap-2 my-2">
                            <span className="text-primary">•</span>
                            <span><strong className="text-foreground">{match[1]}:</strong> <span className="text-muted-foreground">{match[2]}</span></span>
                          </div>
                        );
                      }
                    }
                    if (paragraph.trim()) {
                      return <p key={index} className="text-muted-foreground my-4 leading-relaxed">{paragraph}</p>;
                    }
                    return null;
                  })}
                </div>

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-border">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Etiketler</h4>
                  <div className="flex flex-wrap gap-2">
                    {news.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Paylaş</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                  {/* Author Card */}
                  <div className="bg-card rounded-2xl p-6 border border-border/50">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-4">Yazar Hakkında</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{news.author}</p>
                        <p className="text-sm text-muted-foreground">Kıdemli Editör</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Sürdürülebilir şehircilik ve çevre konularında uzmanlaşmış gazetecilik deneyimine sahip.
                    </p>
                  </div>

                  {/* Related News */}
                  <div className="bg-card rounded-2xl p-6 border border-border/50">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      İlgili Haberler
                    </h3>
                    <div className="space-y-4">
                      {relatedNews.map((item) => (
                        <Link 
                          key={item.id} 
                          href={`/news/${item.id}`}
                          className="group flex gap-3 items-start"
                        >
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-20 h-16 rounded-lg object-cover shrink-0"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">{item.readTime} dk</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                    <h3 className="text-lg font-serif font-bold text-foreground mb-2">
                      Bültenimize Katılın
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      En güncel haberleri doğrudan e-posta kutunuza alın.
                    </p>
                    <Button className="w-full">Abone Ol</Button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>


  );
};

export default NewsDetailPage;
