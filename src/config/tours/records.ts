import type { TourMap } from "@/components/dashboard/tour/types";

export const clinicalRecordsTours: TourMap = {
  "dental-charts": {
    title: "Dental Charts",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Dental Charts",
        body: "This page keeps a visual record of every tooth's condition and treatment history for a patient.",
      },
      {
        target: '[data-tour="dental-charts-patient-select"]',
        title: "Choose a patient",
        body: "Pick a patient here to load their personal tooth chart and history.",
      },
      {
        target: '[data-tour="dental-charts-chart"]',
        title: "The tooth chart",
        body: "Click any tooth to select it and see or update its condition.",
      },
      {
        target: '[data-tour="dental-charts-legend"]',
        title: "Colour legend",
        body: "Each colour represents a different tooth condition, like healthy, decayed, or crowned.",
      },
      {
        target: '[data-tour="dental-charts-tooth-detail"]',
        title: "Tooth details",
        body: "Once a tooth is selected, this panel shows its status and past procedures.",
      },
      {
        target: '[data-tour="dental-charts-add-procedure"]',
        title: "Add a procedure",
        body: "Click here to record a new treatment done on the selected tooth.",
      },
      {
        target: '[data-tour="dental-charts-history"]',
        title: "Procedure history",
        body: "Review past work done on this tooth, including dates and the dentist involved.",
      },
    ],
  },
  treatments: {
    title: "Treatments & Procedures",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Treatments",
        body: "Manage your list of clinic services and build multi-visit treatment plans for patients.",
      },
      {
        target: '[data-tour="treatments-tabs"]',
        title: "Catalog vs Plans",
        body: "Switch between the treatment catalog and patient treatment plans using these tabs.",
      },
      {
        target: '[data-tour="treatments-search"]',
        title: "Search treatments",
        body: "Quickly find a treatment by name or category.",
      },
      {
        target: '[data-tour="treatments-add-treatment"]',
        title: "Add a treatment",
        body: "Click here to add a new service to your clinic's catalog, with its price and duration.",
      },
      {
        target: '[data-tour="treatments-catalog-list"]',
        title: "Browse the catalog",
        body: "All available treatments are grouped by category here.",
      },
      {
        target: '[data-tour="treatments-plan-search"]',
        title: "Search plans",
        body: "Find a specific patient's treatment plan by name or patient.",
      },
      {
        target: '[data-tour="treatments-new-plan"]',
        title: "Create a treatment plan",
        body: "Start a new multi-visit plan for a patient, listing each treatment they need.",
      },
      {
        target: '[data-tour="treatments-plans-list"]',
        title: "Track plan progress",
        body: "Each card shows a plan's status and how many visits are complete.",
      },
    ],
  },
  prescriptions: {
    title: "Prescriptions",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Prescriptions",
        body: "Create and manage digital prescriptions issued to your patients.",
      },
      {
        target: '[data-tour="prescriptions-new"]',
        title: "Write a new prescription",
        body: "Click here to start a prescription for a patient and add their medications.",
      },
      {
        target: '[data-tour="prescriptions-list"]',
        title: "All prescriptions",
        body: "Every prescription issued is listed here, newest first.",
      },
      {
        target: '[data-tour="prescriptions-card-header"]',
        title: "Prescription details",
        body: "Shows the patient, prescribing dentist, and the date it was written.",
      },
      {
        target: '[data-tour="prescriptions-medications"]',
        title: "Medications list",
        body: "See the medicines, dosage, and duration prescribed for this visit.",
      },
      {
        target: '[data-tour="prescriptions-print"]',
        title: "Print the prescription",
        body: "Hover a card and click print to give the patient a paper copy for the pharmacy.",
      },
    ],
  },
  "lab-work": {
    title: "Lab Work",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Lab Work",
        body: "Track orders sent to dental labs for crowns, dentures, and other prosthetics.",
      },
      {
        target: '[data-tour="lab-work-new"]',
        title: "Create a lab order",
        body: "Click here to send a new order to a lab for a patient's dental work.",
      },
      {
        target: '[data-tour="lab-work-board"]',
        title: "Order status board",
        body: "Orders are organised into columns by their current stage.",
      },
      {
        target: '[data-tour="lab-work-column-pending"]',
        title: "Follow each stage",
        body: "Move an order along as it goes from Pending to Sent, In Progress, and Completed.",
      },
      {
        target: '[data-tour="lab-work-share"]',
        title: "Share order details",
        body: "Send the order summary to the lab directly by WhatsApp or email.",
      },
    ],
  },
  "consent-forms": {
    title: "Consent Forms",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Consent Forms",
        body: "Manage consent templates and collect signed consent from patients before treatment.",
      },
      {
        target: '[data-tour="consent-forms-actions"]',
        title: "Quick actions",
        body: "Upload a scanned form, create a new template, or import ready-made templates.",
      },
      {
        target: '[data-tour="consent-forms-create"]',
        title: "Create a patient consent",
        body: "Click here to generate a consent form for a specific patient, using a template if you like.",
      },
      {
        target: '[data-tour="consent-forms-tabs"]',
        title: "Switch views",
        body: "Move between patient consents and your reusable templates.",
      },
      {
        target: '[data-tour="consent-forms-search"]',
        title: "Search consents",
        body: "Look up a consent form by patient name or title.",
      },
      {
        target: '[data-tour="consent-forms-list"]',
        title: "Consent records",
        body: "See each patient's consent form and whether it still needs a signature.",
      },
      {
        target: '[data-tour="consent-forms-templates"]',
        title: "Manage templates",
        body: "This tab holds your reusable consent wording, ready to send to any patient.",
      },
    ],
  },
  documents: {
    title: "Documents",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Documents",
        body: "Store your clinic's licenses, certificates, and policy documents in one place.",
      },
      {
        target: '[data-tour="documents-upload"]',
        title: "Upload a document",
        body: "Click here to add a new file, giving it a title, category, and optional expiry date.",
      },
      {
        target: '[data-tour="documents-expiring"]',
        title: "Expiry alerts",
        body: "This banner appears when any document is due to expire within 30 days.",
      },
      {
        target: '[data-tour="documents-filters"]',
        title: "Search and filter",
        body: "Find a document by name or narrow the list down by category.",
      },
      {
        target: '[data-tour="documents-list"]',
        title: "Document library",
        body: "Every stored document is listed here with its category and expiry date.",
      },
      {
        target: '[data-tour="documents-delete"]',
        title: "Remove a document",
        body: "Click the trash icon to delete a document that is no longer needed.",
      },
    ],
  },
};
