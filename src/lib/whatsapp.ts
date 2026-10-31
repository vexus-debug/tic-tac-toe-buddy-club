// Shared WhatsApp contact link for Clinexus support/sales.
// Every public "talk to us on WhatsApp" entry point prefills the same greeting.
export const WHATSAPP_NUMBER = "2349017758165";

export const WHATSAPP_PREFILL_MESSAGE = "Hello I would like to know more about Clinexus";

export const whatsAppLink = (number: string = WHATSAPP_NUMBER): string =>
  `https://wa.me/${number}?text=${encodeURIComponent(WHATSAPP_PREFILL_MESSAGE)}`;

export const WHATSAPP_URL = whatsAppLink();
