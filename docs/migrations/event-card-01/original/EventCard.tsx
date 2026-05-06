
import { Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle, XCircle, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { EventCardProps, EventStatus, EventType } from "@/types/eventsType";


const getEventStatus = (event: EventType): EventStatus => {
  const now = new Date();
  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : eventDate;
  
  // Set end of day for comparison
  eventDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (now > endDate) {
    return "expired";
  }
  
  if (now >= eventDate && now <= endDate) {
    return "ongoing";
  }

  const spotsLeft = event.capacity - event.registered;
  const percentFull = (event.registered / event.capacity) * 100;

  if (spotsLeft <= 0) {
    return "full";
  }

  if (percentFull >= 80) {
    return "lastSpots";
  }

  // Check if event is within 7 days
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) {
    return "upcoming";
  }

  return "open";
};

const statusConfig: Record<EventStatus, { label: string; icon: React.ElementType; className: string; bgClass: string }> = {
  expired: {
    label: "Sona Erdi",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
    bgClass: "opacity-60 grayscale-[30%]"
  },
  ongoing: {
    label: "Devam Ediyor",
    icon: Timer,
    className: "bg-accent text-accent-foreground animate-pulse",
    bgClass: ""
  },
  upcoming: {
    label: "Yaklaşıyor",
    icon: AlertCircle,
    className: "bg-warning text-warning-foreground",
    bgClass: ""
  },
  open: {
    label: "Kayıt Açık",
    icon: CheckCircle,
    className: "bg-success text-success-foreground",
    bgClass: ""
  },
  full: {
    label: "Kontenjan Dolu",
    icon: XCircle,
    className: "bg-destructive text-destructive-foreground",
    bgClass: ""
  },
  lastSpots: {
    label: "Son Yerler",
    icon: AlertCircle,
    className: "bg-warning text-warning-foreground",
    bgClass: ""
  }
};

const typeColors: Record<string, string> = {
  "Konferans": "bg-primary/10 text-primary border-primary/20",
  "Seminer": "bg-accent/10 text-accent border-accent/20",
  "Çalıştay": "bg-secondary text-secondary-foreground border-secondary",
  "Panel": "bg-muted text-muted-foreground border-muted",
  "Eğitim": "bg-success/10 text-success border-success/20",
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const getDaysUntil = (dateString: string) => {
  const now = new Date();
  const eventDate = new Date(dateString);
  now.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const EventCard = ({ event, index }: EventCardProps) => {
  const status = getEventStatus(event);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const spotsLeft = event.capacity - event.registered;
  const percentFull = (event.registered / event.capacity) * 100;
  const daysUntil = getDaysUntil(event.date);

  return (
    <Link 
      href={`/events/${event.id}`}
      className={`group block ${config.bgClass}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <article className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`${config.className} flex items-center gap-1.5 px-3 py-1`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </Badge>
          </div>

          {/* Type Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className={`${typeColors[event.type] || "bg-muted"} backdrop-blur-sm`}>
              {event.type}
            </Badge>
          </div>

          {/* Days Until */}
          {status !== "expired" && status !== "ongoing" && (
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
              <div className="text-2xl font-bold leading-none">{daysUntil}</div>
              <div className="text-xs text-white/70">gün kaldı</div>
            </div>
          )}

          {/* Ongoing Indicator */}
          {status === "ongoing" && (
            <div className="absolute bottom-4 left-4 bg-accent/90 backdrop-blur-sm rounded-lg px-3 py-2 text-accent-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-sm font-medium">Şu an devam ediyor</span>
            </div>
          )}

          {/* Featured Badge */}
          {event.featured && (
            <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium">
              Öne Çıkan
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{event.registered} / {event.capacity}</span>
              </div>
              {status !== "expired" && (
                <span className={`text-xs font-medium ${spotsLeft <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {spotsLeft > 0 ? `${spotsLeft} yer kaldı` : 'Dolu'}
                </span>
              )}
            </div>
            <Progress 
              value={percentFull} 
              className={`h-2 ${status === "expired" ? "opacity-50" : ""}`}
            />
          </div>

          {/* CTA */}
          {status !== "expired" && status !== "full" && (
            <Button 
              className="w-full mt-4" 
            //   variant={status === "ongoing" ? "accent" : "default"}
            >
              {status === "ongoing" ? "Katıl" : "Kayıt Ol"}
            </Button>
          )}
          {status === "expired" && (
            <Button variant="outline" className="w-full mt-4">
              Detayları Gör
            </Button>
          )}
          {status === "full" && (
            <Button variant="secondary" className="w-full mt-4" disabled>
              Kontenjan Dolu
            </Button>
          )}
        </div>
      </article>
    </Link>
  );
};

export default EventCard;
export { getEventStatus, statusConfig, formatDate, getDaysUntil };
