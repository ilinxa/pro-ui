"use client";
import { Newspaper, TrendingUp, Clock } from "lucide-react";
import PageHero from "../commons/PageHero";



const NewsHero = () => {
  return (
    <PageHero
      badge="Haberler & Duyurular"
      badgeIcon={Newspaper}
      title="Güncel Haberler"
      titleHighlight="Son Gelişmeler"
      description="Kentsel gelişim, şehir planlama ve sürdürülebilirlik alanındaki en son gelişmeleri ve duyuruları takip edin."
    >
      {/* Quick Stats */}
      <div className="flex flex-wrap justify-center gap-8">
        <div className="flex items-center gap-3 text-white/90">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold">500+</div>
            <div className="text-sm text-white/70">Makale</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/90">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold">10K+</div>
            <div className="text-sm text-white/70">Okuyucu</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/90">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold">Günlük</div>
            <div className="text-sm text-white/70">Güncelleme</div>
          </div>
        </div>
      </div>
    </PageHero>
  );
};

export default NewsHero;
