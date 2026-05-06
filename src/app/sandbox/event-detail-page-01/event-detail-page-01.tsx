"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ArticleBodyViewer } from "@/registry/components/data/article-body-01";
import {
  EVENT_STATUS_CONFIG,
  getEventStatus,
} from "@/registry/components/data/event-card-01";
import { InfoList01 } from "@/registry/components/data/info-list-01";
import { PeopleGrid01 } from "@/registry/components/data/people-grid-01";
import { ProgressTimeline01 } from "@/registry/components/data/progress-timeline-01";
import { RegistrationCard01 } from "@/registry/components/data/registration-card-01";
import { ScheduleList01 } from "@/registry/components/data/schedule-list-01";

import { demoEvent, demoNow } from "./event-fixture";

const FORMAT_DATE_TR = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDateTr(iso: string) {
  return FORMAT_DATE_TR.format(new Date(iso));
}

export function EventDetailPage01() {
  const event = demoEvent;
  const now = demoNow;

  const status = getEventStatus(
    {
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      endDate: event.endDate,
      capacity: event.capacity,
      registered: event.registered,
    },
    now,
  );
  const statusConfig = EVENT_STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  const isClosed = status === "expired" || status === "ongoing";

  const handleRegister = () => {
    console.log("[demo] register clicked");
  };

  const handleShare = () => {
    console.log("[demo] share clicked");
  };

  return (
    <article className="bg-background">
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="event-title"
        className="relative h-[60vh] min-h-130 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            status === "expired" && "grayscale",
          )}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/55 to-black/20"
        />

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-12">
            <Link
              href="/"
              className="reveal-up mb-6 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white motion-safe:focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none rounded-sm"
              style={{ animationDelay: "0ms" }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Tüm Etkinlikler
            </Link>

            <div
              className="reveal-up mb-4 flex flex-wrap items-center gap-2"
              style={{ animationDelay: "60ms" }}
            >
              <Badge
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1",
                  statusConfig.className,
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {statusConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className="border-white/30 bg-white/10 text-white"
              >
                {event.type}
              </Badge>
              {event.featured ? (
                <Badge className="bg-primary text-primary-foreground">
                  Öne Çıkan
                </Badge>
              ) : null}
            </div>

            <h1
              id="event-title"
              className="reveal-up max-w-4xl text-3xl font-bold text-white md:text-4xl lg:text-5xl"
              style={{ animationDelay: "120ms" }}
            >
              {event.title}
            </h1>

            <p
              className="reveal-up mt-4 max-w-2xl text-lg text-white/80"
              style={{ animationDelay: "180ms" }}
            >
              {event.description}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Body ─────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-12 lg:col-span-2">
            <ProgressTimeline01
              start={event.registrationOpensAt}
              end={event.registrationClosesAt}
              now={now}
              heading="Zaman Çizelgesi"
              labels={{
                startLabel: "Kayıt Başlangıcı",
                endLabel: "Etkinlik Günü",
                beforeText: (state) => `${state.daysToEnd} gün kaldı`,
                activeText: (state) => `${state.daysToEnd} gün kaldı`,
                afterText: "Etkinlik Sona Erdi",
                ariaLabel: "Etkinliğe kalan süre",
              }}
            />

            <section aria-labelledby="event-about-heading">
              <h2
                id="event-about-heading"
                className="mb-4 text-2xl font-bold text-foreground"
              >
                Etkinlik Hakkında
              </h2>
              <ArticleBodyViewer
                value={event.body}
                className="prose-lg text-muted-foreground"
              />
            </section>

            <ScheduleList01
              heading="Program"
              items={event.schedule}
              labels={{
                timeRangeSeparator: " – ",
                emptyText: "Program henüz açıklanmadı.",
              }}
            />

            <PeopleGrid01
              heading="Konuşmacılar"
              items={event.speakers}
              columns={3}
              avatarSize="lg"
            />
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <RegistrationCard01
                heading="Kayıt Durumu"
                capacity={event.capacity}
                registered={event.registered}
                closed={isClosed}
                onRegister={handleRegister}
                onShare={handleShare}
                labels={{
                  capacityLabel: "Kontenjan",
                  spotsLeftSuffix: "yer kaldı",
                  spotsLeftFull: "Dolu",
                  registeredSuffix: "kayıtlı",
                  capacitySuffix: "kapasite",
                  ctaRegister: "Hemen Kayıt Ol",
                  ctaSoldOut: "Kontenjan Dolu",
                  ctaClosed: "Etkinlik Sona Erdi",
                  ctaUnavailable: "Kayıt Mevcut Değil",
                  ctaShare: "Paylaş",
                  ariaLabel: "Kayıt kapasitesi",
                }}
              />

              <InfoList01
                heading="Etkinlik Bilgileri"
                variant="comfortable"
                items={[
                  {
                    id: "date",
                    icon: Calendar,
                    primary: formatDateTr(event.date),
                    secondary: event.time,
                  },
                  {
                    id: "location",
                    icon: MapPin,
                    primary: event.location,
                    secondary: event.address,
                    action: (
                      <Button
                        variant="link"
                        className="h-auto gap-1 px-0 text-primary"
                      >
                        Haritada Gör
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    ),
                  },
                  {
                    id: "capacity",
                    icon: Users,
                    primary: `${event.capacity} Kişilik Kapasite`,
                    secondary: `${event.registered} kişi kayıtlı`,
                  },
                ]}
              />

              <InfoList01
                heading="İletişim"
                variant="compact"
                items={[
                  {
                    id: "org",
                    icon: Building2,
                    primary: event.organizer.name,
                  },
                  {
                    id: "phone",
                    icon: Phone,
                    primary: event.organizer.phone,
                    href: `tel:${event.organizer.phone.replace(/\s+/g, "")}`,
                  },
                  {
                    id: "mail",
                    icon: Mail,
                    primary: event.organizer.email,
                    href: `mailto:${event.organizer.email}`,
                  },
                ]}
              />

              <InfoList01
                heading="Gerekli Belgeler"
                variant="compact"
                separated={false}
                className="bg-muted/50 border-transparent"
                items={event.requirements.map((req, idx) => ({
                  id: `req-${idx}`,
                  icon: CheckCircle2,
                  primary: req,
                }))}
              />
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}

export default EventDetailPage01;
