
import { Calendar, Clock, MapPin, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// import { getEventStatus, statusConfig, formatDate, getDaysUntil } from "@/components/events/EventCard";
import {  formatDate, getDaysUntil, getEventStatus, statusConfig } from "@/components/public/sections/events/EventCard";
import Link from "next/link";
import { EventType } from "@/types/eventsType";

interface SocialEventCardProps {
  event: EventType;
}

const SocialEventCard = ({ event }: SocialEventCardProps) => {
  const status = getEventStatus(event);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const daysUntil = getDaysUntil(event.date);
  const spotsLeft = event.capacity - event.registered;

  return (
    <Link href={`/events/${event.id}`} className="group block -mx-4 lg:-mx-0">
      <article className="relative h-64 md:h-72 overflow-hidden lg:rounded-xl shadow-[inset_0_80px_60px_-40px_rgba(0,0,0,0.4)]">
        {/* Background Image */}
        <img
          src={event.image}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        
        {/* Inner Shadow from Top */}
        <div className="absolute inset-0 shadow-[inset_0_60px_80px_-20px_rgba(0,0,0,0.6)]" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          {/* Top Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {config.label}
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                {event.type}
              </Badge>
            </div>
            
            {status !== "expired" && status !== "ongoing" && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center">
                <div className="text-2xl font-bold text-white leading-none">{daysUntil}</div>
                <div className="text-xs text-white/70">gün</div>
              </div>
            )}
            
            {status === "ongoing" && (
              <div className="flex items-center gap-2 bg-accent/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-accent-foreground">
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span className="text-xs font-medium">CANLI</span>
              </div>
            )}
          </div>

          {/* Bottom Content */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 group-hover:text-accent transition-colors">
              {event.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{spotsLeft > 0 ? `${spotsLeft} yer kaldı` : 'Dolu'}</span>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-between">
              <Button 
                // variant={status === "expired" ? "outline" : status === "ongoing" ? "accent" : "default"}
                size="sm"
                className={status === "expired" ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : ""}
                disabled={status === "full"}
              >
                {status === "expired" ? "Detayları Gör" : 
                 status === "ongoing" ? "Katıl" : 
                 status === "full" ? "Kontenjan Dolu" : "Kayıt Ol"}
              </Button>
              
              <span className="flex items-center gap-1 text-white/60 text-sm group-hover:text-accent transition-colors">
                <span className="hidden md:inline">Etkinlik Detayı</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Kasder Branding */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium tracking-wider">
          KASDER ETKİNLİK
        </div>
      </article>
    </Link>
  );
};

export default SocialEventCard;
