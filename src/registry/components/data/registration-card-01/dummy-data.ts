import type { RegistrationCard01Labels } from "./types";

export const dummyRegistrationOpen = {
  capacity: 500,
  registered: 142,
};

export const dummyRegistrationLastSpots = {
  capacity: 500,
  registered: 423, // 84.6% — triggers lastSpots state
};

export const dummyRegistrationUrgent = {
  capacity: 100,
  registered: 95, // 5 spots left — triggers urgent (destructive color)
};

export const dummyRegistrationFull = {
  capacity: 50,
  registered: 50,
};

export const dummyRegistrationClosed = {
  capacity: 200,
  registered: 87,
  closed: true,
};

/** No capacity / no registered — open mode without a quota bar. */
export const dummyRegistrationNoQuota = {
  // intentionally empty
};

export const trLabels: RegistrationCard01Labels = {
  capacityLabel: "Kontenjan",
  spotsLeftSuffix: "yer kaldı",
  spotsLeftFull: "Dolu",
  registeredSuffix: "kayıtlı",
  capacitySuffix: "kapasite",
  ctaRegister: "Hemen Kayıt Ol",
  ctaSoldOut: "Kontenjan Dolu",
  ctaClosed: "Etkinlik Sona Erdi",
  ctaUnavailable: "Kayıt yapılamıyor",
  ctaShare: "Paylaş",
  ariaLabel: "Kayıt kontenjanı",
};

export const fundraisingLabels: RegistrationCard01Labels = {
  capacityLabel: "Goal",
  spotsLeftSuffix: "remaining",
  spotsLeftFull: "Goal reached!",
  registeredSuffix: "raised",
  capacitySuffix: "goal",
  ctaRegister: "Donate now",
  ctaSoldOut: "Goal reached",
  ctaClosed: "Campaign ended",
  ctaUnavailable: "Donations unavailable",
  ctaShare: "Share",
  ariaLabel: "Fundraising progress",
};
