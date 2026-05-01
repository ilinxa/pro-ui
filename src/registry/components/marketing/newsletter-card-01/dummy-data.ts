import type { NewsletterCardLabels } from "./types";

/**
 * Turkish labels — used by the "Custom labels" demo tab to validate the
 * full i18n surface of the component (including success / error messages).
 */
export const NEWSLETTER_CARD_LABELS_TR: NewsletterCardLabels = {
  title: "Bültenimize Katılın",
  body: "En güncel haberleri e-posta ile alın.",
  placeholder: "E-posta adresiniz",
  emailLabel: "E-posta adresiniz",
  button: "Abone Ol",
  successMessage: "Teşekkürler! Aboneliğiniz tamamlandı.",
  errorMessage: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
};

/** Fake submit handler that resolves after 1s — used by demo tabs. */
export const fakeSubmitSuccess = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

/** Fake submit handler that rejects after 800ms — used by error-state demo. */
export const fakeSubmitError = (): Promise<void> =>
  new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error("network")), 800);
  });
