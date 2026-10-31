/**
 * Plain-language guide for the public website settings screen.
 * Drives the section navigation, the "what am I editing" header and the
 * step-by-step tour dialog shown on every section.
 */

export type GuideStep = {
  title: string;
  body: string;
};

export type GuideSection = {
  /** Tab value used by the settings page */
  id: string;
  /** Short nav label */
  label: string;
  /** One-line nav description */
  navHint: string;
  /** Full title shown above the section */
  title: string;
  /** What this section controls, in plain words */
  blurb: string;
  /** Where the change shows up on the public website */
  appears: string;
  steps: GuideStep[];
};

export const websiteGuideSections: GuideSection[] = [
  {
    id: "templates",
    label: "Design template",
    navHint: "Pick the overall look",
    title: "Design template",
    blurb:
      "Choose a ready-made design for your public website. The template sets the layout, hero style, fonts and default colours.",
    appears: "Changes the entire look of your public site instantly.",
    steps: [
      {
        title: "1. Browse the designs",
        body: "Each card is a complete website design. The small picture shows roughly how the top of your page will look.",
      },
      {
        title: "2. Click to apply",
        body: "Clicking a template saves it straight away — there is no separate save button here.",
      },
      {
        title: "3. Colours follow the template",
        body: "Applying a template also resets your brand colours to that design's palette. You can change them afterwards in Brand colours.",
      },
    ],
  },
  {
    id: "identity",
    label: "Homepage headline",
    navHint: "Main title, tagline and background photo",
    title: "Homepage headline & main photo",
    blurb:
      "The very first thing a visitor sees: the big headline, the line under it, and the large background photo behind them.",
    appears: "Top of your homepage (the hero banner).",
    steps: [
      {
        title: "Short description",
        body: "One or two sentences describing your clinic. Used in page previews and search results.",
      },
      {
        title: "Main headline",
        body: "The biggest text on your homepage, e.g. \"Your Smile, Our Priority\".",
      },
      {
        title: "Sub-headline",
        body: "The smaller supporting line directly under the headline.",
      },
      {
        title: "Background photo",
        body: "A wide photo sitting behind the headline. Use a bright, uncluttered image at about 1920×800 pixels.",
      },
      {
        title: "Remember to save",
        body: "Text changes only go live after you press Save changes at the bottom of the section.",
      },
    ],
  },
  {
    id: "pagecontent",
    label: "Page section wording",
    navHint: "Text for each band down the page",
    title: "Wording for each part of the page",
    blurb:
      "Your site is one long scrolling page. Here you write the small heading, title and paragraph for each band on that page.",
    appears: "Hero → About → Services & booking → Reviews → Visit → Footer, in that order.",
    steps: [
      {
        title: "What is an eyebrow?",
        body: "The tiny label above a section title, e.g. \"About us\". It is optional — leave it blank to hide it.",
      },
      {
        title: "Titles and paragraphs",
        body: "Each band has a title and, where relevant, one or two paragraphs of body text.",
      },
      {
        title: "Services are automatic",
        body: "The list of treatments inside the services band comes from your Treatments page — you only edit the heading text here.",
      },
      {
        title: "Save once at the end",
        body: "One Save page wording button at the bottom saves every band on this section.",
      },
    ],
  },
  {
    id: "gallery",
    label: "Photo gallery",
    navHint: "Clinic and before/after photos",
    title: "Photo gallery",
    blurb: "Upload photos of your clinic, team or treatment results. Each photo can have a caption.",
    appears: "Gallery grid on your public site.",
    steps: [
      {
        title: "1. Add a caption first",
        body: "Type a title and short description before uploading — they are attached to the photo you upload next.",
      },
      {
        title: "2. Upload the photo",
        body: "Press Upload & add. The photo is saved immediately and appears in the grid below.",
      },
      {
        title: "3. Remove a photo",
        body: "Hover a photo and click the bin icon, then press Save gallery to confirm the removal.",
      },
    ],
  },
  {
    id: "hours",
    label: "Opening hours",
    navHint: "Days and times you are open",
    title: "Opening hours",
    blurb: "Set the times you open and close on each day, or mark a day as closed.",
    appears: "Visit section and footer of your public site; also shown when patients book.",
    steps: [
      {
        title: "Turn a day on or off",
        body: "The switch marks the day as open or closed. Switched off shows \"Closed\" to visitors.",
      },
      {
        title: "Set the times",
        body: "Use the two time boxes for opening and closing time on that day.",
      },
      {
        title: "Save",
        body: "Press Save hours when you are done — nothing changes on the site until you do.",
      },
    ],
  },
  {
    id: "appearance",
    label: "Brand colours",
    navHint: "Your primary and accent colour",
    title: "Brand colours",
    blurb:
      "Fine-tune the two main colours of your site. These override the colours that came with your template.",
    appears: "Buttons, links, highlights and headings across the public site.",
    steps: [
      {
        title: "Primary colour",
        body: "Used for main buttons like Book now, and for key headings.",
      },
      {
        title: "Accent colour",
        body: "Used for smaller highlights, badges and icons.",
      },
      {
        title: "Check the preview",
        body: "The preview strip shows how the two colours look together before you save.",
      },
      {
        title: "Go back",
        body: "Reset to template colours restores the palette from your chosen design.",
      },
    ],
  },
  {
    id: "social",
    label: "Contact & social",
    navHint: "WhatsApp, Instagram, Facebook, reviews",
    title: "Contact & social links",
    blurb: "Where patients reach you. Leave any field blank to hide that link from the site.",
    appears: "Footer, contact buttons and the floating WhatsApp button.",
    steps: [
      {
        title: "WhatsApp number",
        body: "Digits only, starting with your country code and no plus sign — e.g. 2348012345678.",
      },
      {
        title: "Social profiles",
        body: "Paste the full web address of your page, starting with https://.",
      },
      {
        title: "Google review link",
        body: "The link that opens the review box for your clinic on Google. Used by the \"Leave a review\" button.",
      },
    ],
  },
  {
    id: "trust",
    label: "Credentials",
    navHint: "Licences and certifications",
    title: "Licences & certifications",
    blurb: "List the registrations and certificates that reassure new patients.",
    appears: "Trust badges section of your public site.",
    steps: [
      {
        title: "1. Type the credential",
        body: "For example: Licensed by the Nigerian Medical & Dental Council.",
      },
      {
        title: "2. Add it to the list",
        body: "Press Add (or Enter). It appears in the list underneath.",
      },
      {
        title: "3. Save",
        body: "Press Save credentials so the list goes live.",
      },
    ],
  },
  {
    id: "booking",
    label: "Booking messages",
    navHint: "Welcome and confirmation text",
    title: "Booking messages",
    blurb: "The wording patients read before and after they book an appointment online.",
    appears: "Booking form header and the confirmation screen after booking.",
    steps: [
      {
        title: "Welcome text",
        body: "A short greeting shown above the booking form.",
      },
      {
        title: "Confirmation message",
        body: "What the patient sees immediately after submitting a booking. Set expectations, e.g. how you will confirm.",
      },
    ],
  },
  {
    id: "trustbar",
    label: "Trust bar & stats",
    navHint: "Years, patients, rating",
    title: "Trust bar & statistics",
    blurb:
      "The small strip of numbers that reassures visitors: years of experience, patients treated, your rating and one extra figure of your choice.",
    appears: "Thin band just under the homepage headline.",
    steps: [
      {
        title: "Show or hide the strip",
        body: "Use the switch to turn the whole band on or off. Turned off, none of the numbers appear.",
      },
      {
        title: "Fill in the numbers",
        body: "Write them exactly as you want them read, e.g. \"12+\", \"5,000+\", \"4.9\".",
      },
      {
        title: "Extra figure",
        body: "The last pair lets you add anything else, e.g. label \"Same-day slots\" with value \"Daily\".",
      },
      {
        title: "Save",
        body: "Press Save trust bar so the numbers go live.",
      },
    ],
  },
  {
    id: "services",
    label: "Service highlights",
    navHint: "Service cards and why choose us",
    title: "Service highlights & why choose us",
    blurb:
      "Short cards describing what you offer, plus the reasons patients should pick your clinic.",
    appears: "Services overview cards and the \"Why choose us\" band on your homepage.",
    steps: [
      {
        title: "Heading first",
        body: "Write the title and subtitle shown above the service cards.",
      },
      {
        title: "Add a card",
        body: "Press Add service card, then type a short title and one line of description. Keep it to a few words.",
      },
      {
        title: "Why choose us",
        body: "The second list is your selling points, e.g. \"Painless treatment\" or \"Modern equipment\".",
      },
      {
        title: "Remove and save",
        body: "The bin icon removes a row. Press Save section when finished.",
      },
    ],
  },
  {
    id: "dentist",
    label: "Meet the dentist",
    navHint: "Name, credentials, photo, bio",
    title: "Meet the dentist",
    blurb: "Introduce the person patients will actually see, with a photo and a short biography.",
    appears: "\"Meet the dentist\" band on your homepage.",
    steps: [
      {
        title: "Name and credentials",
        body: "For example \"Dr Ada Obi\" and \"BDS, MSc Implantology\".",
      },
      {
        title: "Photo",
        body: "Paste the web address of a portrait photo, or upload it in the gallery first and copy its link.",
      },
      {
        title: "Biography",
        body: "Two or three sentences in a friendly tone. Mention experience and special interests.",
      },
      {
        title: "Save",
        body: "Press Save dentist profile to publish.",
      },
    ],
  },
  {
    id: "testimonials",
    label: "Testimonials",
    navHint: "Patient quotes you write yourself",
    title: "Patient testimonials",
    blurb:
      "Quotes from happy patients that you enter manually. These are separate from reviews collected through the app.",
    appears: "Testimonials band on your homepage.",
    steps: [
      {
        title: "Add a quote",
        body: "Press Add testimonial, then fill in the patient's name and what they said.",
      },
      {
        title: "Rating",
        body: "Choose a star rating from 1 to 5. Leave it blank to hide the stars.",
      },
      {
        title: "Only use real quotes",
        body: "Ask the patient's permission before publishing their name.",
      },
      {
        title: "Save",
        body: "Press Save testimonials when done.",
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    navHint: "Price guide and what to expect",
    title: "Price guide",
    blurb:
      "An optional list of common treatments with indicative prices, plus a note explaining what patients should expect.",
    appears: "Pricing band on your homepage.",
    steps: [
      {
        title: "Heading",
        body: "Write the section title, e.g. \"Transparent pricing\".",
      },
      {
        title: "Add a price row",
        body: "Each row has a treatment name, a price as you want it displayed (e.g. \"From ₦25,000\") and an optional note.",
      },
      {
        title: "What to expect",
        body: "Use this longer box to explain consultations, payment plans or anything that affects the final cost.",
      },
      {
        title: "Save",
        body: "Press Save pricing to publish the list.",
      },
    ],
  },
  {
    id: "faqs",
    label: "FAQs",
    navHint: "Common questions and answers",
    title: "Frequently asked questions",
    blurb: "Answer the questions new patients ask most, so they do not have to call.",
    appears: "Expandable FAQ list near the bottom of your homepage.",
    steps: [
      {
        title: "Add a question",
        body: "Press Add question, then type the question exactly as a patient would ask it.",
      },
      {
        title: "Write a short answer",
        body: "Two or three sentences is plenty. Be specific about times, prices and what to bring.",
      },
      {
        title: "Order matters",
        body: "The first questions in the list appear first on the page, so put the most common ones at the top.",
      },
      {
        title: "Save",
        body: "Press Save FAQs to publish.",
      },
    ],
  },
  {
    id: "location",
    label: "Location & map",
    navHint: "Map embed and directions link",
    title: "Location & map",
    blurb: "Show a map of your clinic and give patients a one-tap link for directions.",
    appears: "Visit section of your public site.",
    steps: [
      {
        title: "Map link",
        body: "In Google Maps choose Share → Embed a map and copy the address inside src=\"...\". Paste it here.",
      },
      {
        title: "Directions link",
        body: "The normal Google Maps link to your clinic. Used by the \"Get directions\" button.",
      },
      {
        title: "Save",
        body: "Press Save location. Check the map preview on your public site afterwards.",
      },
    ],
  },
  {
    id: "finalcta",
    label: "Final call-to-action & footer",
    navHint: "Closing invite and footer note",
    title: "Final call-to-action & footer",
    blurb:
      "The last invitation to book at the bottom of the page, and the small print in your footer.",
    appears: "Closing band and footer of your public site.",
    steps: [
      {
        title: "Closing title",
        body: "A direct invitation, e.g. \"Ready for a healthier smile?\"",
      },
      {
        title: "Button wording",
        body: "What the button says, e.g. \"Book your visit\". Keep it under four words.",
      },
      {
        title: "Footer note",
        body: "Small print under the footer links — registration numbers, a short line about the clinic, or opening note.",
      },
      {
        title: "Save",
        body: "Press Save closing section to publish.",
      },
    ],
  },
];

export const getGuideSection = (id: string) =>
  websiteGuideSections.find((s) => s.id === id) ?? websiteGuideSections[0];
