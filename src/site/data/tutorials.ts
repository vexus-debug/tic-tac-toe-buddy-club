/**
 * Tutorial framework data.
 *
 * Structure: clinic type -> section (process / flow / setup area) -> tutorials.
 * Public tutorials are kept here so the guide pages stay aligned with the
 * labels and workflows used in the dental dashboard.
 */

export type TutorialStep = {
  title: string;
  body: string;
  /** Screenshot of the dashboard screen this step refers to (served from /public). */
  image?: string;
  imageAlt?: string;
};

export type Tutorial = {
  slug: string;
  title: string;
  summary: string;
  /** Estimated reading / doing time, e.g. "5 min" */
  duration?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  steps?: TutorialStep[];
};

export type TutorialSection = {
  slug: string;
  title: string;
  description: string;
  tutorials: Tutorial[];
};

export type ClinicTutorialType = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** lucide-react icon name used by the pages */
  icon: "Smile" | "Eye";
  sections: TutorialSection[];
};

const eyeSections = (): TutorialSection[] => [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Create your clinic, invite your team and find your way around the dashboard.",
    tutorials: [
      {
        slug: "find-your-way-around",
        title: "Find Your Way Around the Dashboard",
        summary: "Learn where the eye care workflows live and return to the right screen quickly.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open your clinic dashboard", body: "Sign in and choose your clinic. The Dashboard is the starting point for appointments, patients, eye clinic work, finance and stock.", image: "/tutorials/eye/dashboard.png", imageAlt: "Open your clinic dashboard — Clinexus eye clinic dashboard" },
          { title: "Open the Eye Clinic group", body: "The Eye Clinic group in the sidebar holds Eye Exams, Optical Prescriptions, Contact Lenses, Optical Orders, Diagnostics, Eye Results, Eye Charts and Surgery Bookings.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Open the Eye Clinic group — Clinexus eye clinic dashboard" },
          { title: "Use the other sidebar groups", body: "Open Patient Care for patients, appointments, the waiting list, schedules, consents and reviews. Use Finance for money matters, Reports for performance, and Inventory & Supply for frames, lenses and drugs.", image: "/tutorials/eye/dashboard.png", imageAlt: "Use the other sidebar groups — Clinexus eye clinic dashboard" },
          { title: "Start from Eye Clinic Overview", body: "Choose Eye Clinic Overview for one clinic-wide view of exams today, prescriptions issued, active contact lens wearers, open optical orders, upcoming surgeries and diagnostic studies.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Start from Eye Clinic Overview — Clinexus eye clinic dashboard" },
          { title: "Check your access", body: "If a page is missing from your sidebar, ask an owner or admin to review your staff role. Access to clinical pages, billing and settings depends on that role.", image: "/tutorials/eye/settings.png", imageAlt: "Check your access — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "set-up-your-first-day",
        title: "Set Up Your First Day",
        summary: "Complete the essential clinic settings before you see your first patient.",
        duration: "10 min",
        level: "Beginner",
        steps: [
          { title: "Open Settings", body: "Choose Settings from the shared navigation, then open Clinic Profile.", image: "/tutorials/eye/settings.png", imageAlt: "Open Settings — Clinexus eye clinic dashboard" },
          { title: "Save your clinic details", body: "Enter the clinic information your team and patients should see, optionally select Upload Logo, then select Save Changes.", image: "/tutorials/eye/settings.png", imageAlt: "Save your clinic details — Clinexus eye clinic dashboard" },
          { title: "Add your team", body: "Open Staff, select Add Staff, and enter each person's details and role. Optometrists and assistants need clinical access; front-desk staff need appointments, orders and billing.", image: "/tutorials/eye/staff.png", imageAlt: "Add your team — Clinexus eye clinic dashboard" },
          { title: "Set working hours", body: "Open Schedules, select a staff member, turn working days on or off, and enter the working-hour and break times.", image: "/tutorials/eye/schedules.png", imageAlt: "Set working hours — Clinexus eye clinic dashboard" },
          { title: "Add your services", body: "Open your service catalogue and add the visits you charge for, such as full eye examination, refraction, contact lens fitting, visual field test and follow-up review.", image: "/tutorials/eye/settings.png", imageAlt: "Add your services — Clinexus eye clinic dashboard" },
          { title: "Do a practice run", body: "Register a test patient, book an appointment, record a short eye exam and delete the records afterwards so your team can practise safely.", image: "/tutorials/eye/appointments.png", imageAlt: "Do a practice run — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "setup",
    title: "Setup & Configuration",
    description: "Clinic details, branding, working hours, services, pricing and roles.",
    tutorials: [
      {
        slug: "configure-clinic-settings",
        title: "Configure Clinic Settings",
        summary: "Keep your clinic profile, notifications and team settings in one place.",
        duration: "8 min",
        level: "Beginner",
        steps: [
          { title: "Open Clinic Profile", body: "In Settings, choose the Clinic Profile tab and review the clinic name, address and contact details.", image: "/tutorials/eye/settings.png", imageAlt: "Open Clinic Profile — Clinexus eye clinic dashboard" },
          { title: "Upload your logo", body: "Select Upload Logo, choose the clinic logo, and check that it appears correctly before saving.", image: "/tutorials/eye/settings.png", imageAlt: "Upload your logo — Clinexus eye clinic dashboard" },
          { title: "Turn on the right notifications", body: "Open Notifications and choose the switches for appointment reminders, payment alerts and low stock alerts so the team is warned about frames, lenses and drops running out.", image: "/tutorials/eye/settings.png", imageAlt: "Turn on the right notifications — Clinexus eye clinic dashboard" },
          { title: "Manage members and rooms", body: "If you are an admin, use Members & Roles to edit details or change a role, and set up your consulting and refraction rooms.", image: "/tutorials/eye/staff.png", imageAlt: "Manage members and rooms — Clinexus eye clinic dashboard" },
          { title: "Save each change", body: "Select Save Changes after updating a settings tab, then reopen the tab to confirm the saved values are still present.", image: "/tutorials/eye/settings.png", imageAlt: "Save each change — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "add-staff-and-assign-roles",
        title: "Manage Staff and Assign Roles",
        summary: "Add your team and give each person the access their job needs.",
        duration: "10 min",
        level: "Beginner",
        steps: [
          { title: "Open Staff Management", body: "Choose Staff from Administration. Every team member appears as a card with their name, specialty, role badge, status and phone number.", image: "/tutorials/eye/staff.png", imageAlt: "Open Staff Management — Clinexus eye clinic dashboard" },
          { title: "Start a new staff member", body: "Select Add Staff, then enter the person's full name. Full Name is the only required field.", image: "/tutorials/eye/staff.png", imageAlt: "Start a new staff member — Clinexus eye clinic dashboard" },
          { title: "Choose the role", body: "Clinical roles can open Eye Exams, Optical Prescriptions, Contact Lenses, Diagnostics, Eye Results and Eye Charts. Reception and assistant roles handle Optical Orders and bookings. Owners and admins see everything.", image: "/tutorials/eye/staff.png", imageAlt: "Choose the role — Clinexus eye clinic dashboard" },
          { title: "Create the login", body: "Complete the dialog so the staff member receives an account, then ask them to sign in and confirm their sidebar shows the pages they need.", image: "/tutorials/eye/staff.png", imageAlt: "Create the login — Clinexus eye clinic dashboard" },
          { title: "Keep records current", body: "Edit a staff card when someone changes role, and mark leavers inactive so they no longer appear in booking lists.", image: "/tutorials/eye/staff.png", imageAlt: "Keep records current — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "set-up-your-public-website",
        title: "Set Up Your Public Website",
        summary: "Publish your clinic page so patients can find you and book.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Website Settings", body: "Choose Website Settings from Administration.", image: "/tutorials/eye/website-settings.png", imageAlt: "Open Website Settings — Clinexus eye clinic dashboard" },
          { title: "Write your clinic introduction", body: "Enter the clinic name, tagline, about text and contact details patients should see.", image: "/tutorials/eye/website-settings.png", imageAlt: "Write your clinic introduction — Clinexus eye clinic dashboard" },
          { title: "List your eye care services", body: "Add the services you want to advertise, such as eye examinations, glasses dispensing, contact lens fitting, glaucoma screening and cataract assessment.", image: "/tutorials/eye/website-settings.png", imageAlt: "List your eye care services — Clinexus eye clinic dashboard" },
          { title: "Add opening hours and location", body: "Enter your hours, address and directions, then save the page.", image: "/tutorials/eye/website-settings.png", imageAlt: "Add opening hours and location — Clinexus eye clinic dashboard" },
          { title: "Preview and publish", body: "Open the public preview, check every section reads correctly on a phone, then publish.", image: "/tutorials/eye/website-settings.png", imageAlt: "Preview and publish — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "manage-products-and-shop-orders",
        title: "Sell Frames and Eye Care Products",
        summary: "Publish frames, lenses and eye care products, then process the orders.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Shop Management", body: "Choose Shop Management from Administration.", image: "/tutorials/eye/shop-management.png", imageAlt: "Open Shop Management — Clinexus eye clinic dashboard" },
          { title: "Add a product", body: "Create the product with its name, description, price, images and stock. Typical items are frames, single vision and anti-glare lenses, contact lens solutions, lubricating drops and sunglasses.", image: "/tutorials/eye/shop-management.png", imageAlt: "Add a product — Clinexus eye clinic dashboard" },
          { title: "Keep prices and stock accurate", body: "Update price and stock whenever your supplier costs or shelf counts change so patients are not sold items you do not have.", image: "/tutorials/eye/inventory.png", imageAlt: "Keep prices and stock accurate — Clinexus eye clinic dashboard" },
          { title: "Process incoming orders", body: "Review new orders, move each one through its status as you prepare and hand it over, and check the payment before release.", image: "/tutorials/eye/shop-management.png", imageAlt: "Process incoming orders — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "review-the-audit-log",
        title: "Review the Audit Log",
        summary: "See who changed a clinical or financial record and when.",
        duration: "5 min",
        level: "Advanced",
        steps: [
          { title: "Open Audit Log", body: "Choose Audit Log from Administration. Access is limited to owners and admins.", image: "/tutorials/eye/audit-log.png", imageAlt: "Open Audit Log — Clinexus eye clinic dashboard" },
          { title: "Filter to what you are checking", body: "Narrow the log by date, user or record type before you read it.", image: "/tutorials/eye/audit-log.png", imageAlt: "Filter to what you are checking — Clinexus eye clinic dashboard" },
          { title: "Read an entry", body: "Each entry shows the person, the action and the record affected, so you can trace an edited prescription, order amount or invoice.", image: "/tutorials/eye/audit-log.png", imageAlt: "Read an entry — Clinexus eye clinic dashboard" },
          { title: "Follow up correctly", body: "Open the original record to confirm the current values, and correct it there rather than in the log.", image: "/tutorials/eye/audit-log.png", imageAlt: "Follow up correctly — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "patients",
    title: "Patients & Records",
    description: "Registering patients, eye history, documents and consents.",
    tutorials: [
      {
        slug: "register-a-patient",
        title: "Register a Patient",
        summary: "Create one complete patient record the whole team can use.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Patients", body: "Choose Patients from Patient Care and select Add Patient.", image: "/tutorials/eye/patients.png", imageAlt: "Open Patients — Clinexus eye clinic dashboard" },
          { title: "Enter contact details", body: "Complete the patient's name, phone number and other required contact fields.", image: "/tutorials/eye/patients.png", imageAlt: "Enter contact details — Clinexus eye clinic dashboard" },
          { title: "Add useful history", body: "Record general medical history and anything that affects the eyes, such as diabetes, hypertension, allergies and current drops.", image: "/tutorials/eye/patients.png", imageAlt: "Add useful history — Clinexus eye clinic dashboard" },
          { title: "Search before you create", body: "Always search the name or phone number first. One record per patient keeps exams, prescriptions and orders together.", image: "/tutorials/eye/patients.png", imageAlt: "Search before you create — Clinexus eye clinic dashboard" },
          { title: "Save the record", body: "Complete the dialog, then search for the name or patient ID to confirm the patient is listed.", image: "/tutorials/eye/patients.png", imageAlt: "Save the record — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "use-a-patient-profile",
        title: "Use a Patient Profile",
        summary: "Read a patient's full eye history from one screen.",
        duration: "7 min",
        level: "Beginner",
        steps: [
          { title: "Find the patient", body: "On Patients, search by name, ID or phone, then select the patient.", image: "/tutorials/eye/patients.png", imageAlt: "Find the patient — Clinexus eye clinic dashboard" },
          { title: "Review the overview", body: "Check contact details, outstanding balance and recent activity at the top of the profile.", image: "/tutorials/eye/patients.png", imageAlt: "Review the overview — Clinexus eye clinic dashboard" },
          { title: "Open the Eye History tab", body: "The eye records tab summarises the patient's eye exams, optical prescriptions, contact lenses, optical orders, diagnostic studies and surgery in one place.", image: "/tutorials/eye/patients.png", imageAlt: "Open the Eye History tab — Clinexus eye clinic dashboard" },
          { title: "Jump to results and trends", body: "Use the links for the patient's fundus, OCT and visual field results, and for their eye charts and trends.", image: "/tutorials/eye/eye-charts.png", imageAlt: "Jump to results and trends — Clinexus eye clinic dashboard" },
          { title: "Edit patient details", body: "Select the edit button in the profile header, update the information and complete the Edit Patient dialog.", image: "/tutorials/eye/patients.png", imageAlt: "Edit patient details — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "record-eye-history-and-notes",
        title: "Record Eye History and Visit Notes",
        summary: "Keep the clinical story clear for whoever sees the patient next.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open the patient profile", body: "Search Patients and select the patient whose visit you are documenting.", image: "/tutorials/eye/patients.png", imageAlt: "Open the patient profile — Clinexus eye clinic dashboard" },
          { title: "Capture the background", body: "Record the presenting complaint, how long it has lasted, previous glasses or contact lens wear, eye surgery, family history of glaucoma and any current eye drops.", image: "/tutorials/eye/patients.png", imageAlt: "Capture the background — Clinexus eye clinic dashboard" },
          { title: "Document the visit", body: "Enter what the patient reported, what you found, your assessment and the plan, keeping right eye and left eye findings clearly separated.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Document the visit — Clinexus eye clinic dashboard" },
          { title: "Note the eye", body: "Use OD for the right eye, OS for the left and OU for both so nobody has to guess which eye a finding belongs to.", image: "/tutorials/eye/patients.png", imageAlt: "Note the eye — Clinexus eye clinic dashboard" },
          { title: "Review before saving", body: "Check the eye labels, measurements and follow-up instructions, then save the note.", image: "/tutorials/eye/patients.png", imageAlt: "Review before saving — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "upload-patient-documents",
        title: "Upload a Patient Document",
        summary: "Store referrals, reports and scans with the right patient.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open Documents", body: "Choose Documents from Administration and select Upload Document.", image: "/tutorials/eye/documents.png", imageAlt: "Open Documents — Clinexus eye clinic dashboard" },
          { title: "Choose the patient and file", body: "Select the patient, choose the file and enter the document details requested.", image: "/tutorials/eye/documents.png", imageAlt: "Choose the patient and file — Clinexus eye clinic dashboard" },
          { title: "Name files so they are findable", body: "Include the document type and date, for example referral letter, OCT report or hospital discharge summary.", image: "/tutorials/eye/documents.png", imageAlt: "Name files so they are findable — Clinexus eye clinic dashboard" },
          { title: "Complete the upload", body: "Finish the dialog to attach the document to the patient record.", image: "/tutorials/eye/documents.png", imageAlt: "Complete the upload — Clinexus eye clinic dashboard" },
          { title: "Watch expiry alerts", body: "Return to Documents to review expiry alerts and remove a file when it should no longer be kept.", image: "/tutorials/eye/documents.png", imageAlt: "Watch expiry alerts — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "create-and-sign-consent",
        title: "Create and Sign a Consent Form",
        summary: "Prepare eye care consents, attach them to a patient and record the signature.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Consent Forms", body: "Choose Consent Forms from Patient Care and stay on Patient Consents for patient records.", image: "/tutorials/eye/consent-forms.png", imageAlt: "Open Consent Forms — Clinexus eye clinic dashboard" },
          { title: "Import the eye care library", body: "In Templates, import the standard eye care library. It includes general eye examination, pupil dilation, cataract surgery, refractive surgery, intravitreal injection, contact lens wear, ophthalmic imaging, consent for a minor and financial agreement forms.", image: "/tutorials/eye/consent-forms.png", imageAlt: "Import the eye care library — Clinexus eye clinic dashboard" },
          { title: "Create the consent", body: "Select the create consent action, choose the patient and template, and complete the form details.", image: "/tutorials/eye/consent-forms.png", imageAlt: "Create the consent — Clinexus eye clinic dashboard" },
          { title: "Sign the form", body: "Open the patient consent and select Sign to record the patient's completed consent. Dilation and surgery consents must be signed before the procedure starts.", image: "/tutorials/eye/consent-forms.png", imageAlt: "Sign the form — Clinexus eye clinic dashboard" },
          { title: "Keep templates ready", body: "Use New Template for your own wording, or upload a scanned form you already use on paper.", image: "/tutorials/eye/consent-forms.png", imageAlt: "Keep templates ready — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "appointments",
    title: "Appointments & Scheduling",
    description: "Booking flows, calendars, the waiting list and staff hours.",
    tutorials: [
      {
        slug: "book-an-appointment",
        title: "Book an Appointment",
        summary: "Place a patient with the right clinician, service and time slot.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Appointments", body: "Choose Appointments from Patient Care and select Book Appointment.", image: "/tutorials/eye/appointments.png", imageAlt: "Open Appointments — Clinexus eye clinic dashboard" },
          { title: "Choose the patient and service", body: "Select the patient, the optometrist and the visit type, such as full eye examination, refraction only, contact lens fitting, visual field test or post-operative review.", image: "/tutorials/eye/appointments.png", imageAlt: "Choose the patient and service — Clinexus eye clinic dashboard" },
          { title: "Allow enough time", body: "Book longer slots for first visits, dilated examinations and contact lens teaching, and shorter slots for collections and quick reviews.", image: "/tutorials/eye/appointments.png", imageAlt: "Allow enough time — Clinexus eye clinic dashboard" },
          { title: "Choose the time", body: "Use the date and time controls to select an available slot, switching between day, week and month views when you need a wider picture.", image: "/tutorials/eye/appointments.png", imageAlt: "Choose the time — Clinexus eye clinic dashboard" },
          { title: "Save the booking", body: "Complete the dialog, then confirm the appointment appears in the schedule or list view.", image: "/tutorials/eye/appointments.png", imageAlt: "Save the booking — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "handle-a-walk-in",
        title: "Handle a Walk-In Patient",
        summary: "Add an unplanned visit without losing patient or appointment history.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open the walk-in flow", body: "On Appointments, select Walk-In.", image: "/tutorials/eye/waiting-list.png", imageAlt: "Open the walk-in flow — Clinexus eye clinic dashboard" },
          { title: "Find or add the patient", body: "Select the existing patient, or complete the patient details if this is their first visit.", image: "/tutorials/eye/patients.png", imageAlt: "Find or add the patient — Clinexus eye clinic dashboard" },
          { title: "Add the visit details", body: "Choose the clinician, the reason for the visit and any notes. Flag sudden vision loss, eye injury or severe pain so the patient is seen first.", image: "/tutorials/eye/waiting-list.png", imageAlt: "Add the visit details — Clinexus eye clinic dashboard" },
          { title: "Complete check-in", body: "Finish the dialog so the patient appears in the day's appointments or waiting queue.", image: "/tutorials/eye/waiting-list.png", imageAlt: "Complete check-in — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "check-in-and-call-patients",
        title: "Check In and Call Patients",
        summary: "Move patients from arrival to the consulting room in the right order.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Check in from Appointments", body: "Find the appointment and select Check in when the patient arrives.", image: "/tutorials/eye/appointments.png", imageAlt: "Check in from Appointments — Clinexus eye clinic dashboard" },
          { title: "Open Waiting List", body: "Choose Waiting List to see the queue with its waiting, called, in progress and completed counts.", image: "/tutorials/eye/waiting-list.png", imageAlt: "Open Waiting List — Clinexus eye clinic dashboard" },
          { title: "Call the next patient", body: "Select Call Next to move the next patient forward, or check a patient in directly from this page.", image: "/tutorials/eye/waiting-list.png", imageAlt: "Call the next patient — Clinexus eye clinic dashboard" },
          { title: "Keep dilated patients visible", body: "Note when drops were instilled so the patient is called back at the right time, and mark the visit complete when they leave.", image: "/tutorials/eye/waiting-list.png", imageAlt: "Keep dilated patients visible — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "set-staff-schedules",
        title: "Set Staff Schedules",
        summary: "Control who is available, on which days and at what times.",
        duration: "7 min",
        level: "Intermediate",
        steps: [
          { title: "Open Schedules", body: "Choose Schedules from Patient Care.", image: "/tutorials/eye/schedules.png", imageAlt: "Open Schedules — Clinexus eye clinic dashboard" },
          { title: "Select a staff member", body: "Pick the person whose hours you are setting.", image: "/tutorials/eye/staff.png", imageAlt: "Select a staff member — Clinexus eye clinic dashboard" },
          { title: "Set working days and hours", body: "Turn each day on or off and enter the start, end and break times.", image: "/tutorials/eye/schedules.png", imageAlt: "Set working days and hours — Clinexus eye clinic dashboard" },
          { title: "Block out non-clinical time", body: "Reserve time for surgery lists, home visits, admin and leave so those slots cannot be booked.", image: "/tutorials/eye/schedules.png", imageAlt: "Block out non-clinical time — Clinexus eye clinic dashboard" },
          { title: "Save and check the calendar", body: "Save the schedule, then open Appointments to confirm the available slots match.", image: "/tutorials/eye/schedules.png", imageAlt: "Save and check the calendar — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "clinical-flow",
    title: "Clinical Workflow",
    description: "From check-in to eye examination, diagnostics, results and follow-up.",
    tutorials: [
      {
        slug: "record-an-eye-exam",
        title: "Record an Eye Exam",
        summary: "Capture vision, pressures and slit-lamp findings for both eyes in one record.",
        duration: "12 min",
        level: "Beginner",
        steps: [
          { title: "Open Eye Exams", body: "Choose Eye Exams from the Eye Clinic group and select New Exam. The Recent exams list shows each patient with their date, vision, diagnosis and a pressure badge.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Open Eye Exams — Clinexus eye clinic dashboard" },
          { title: "Choose the patient and date", body: "Search the patient by name or phone in the picker, then set the exam date. On an existing exam the patient stays locked, so only the findings can be edited.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Choose the patient and date — Clinexus eye clinic dashboard" },
          { title: "Record the complaint", body: "Enter the chief complaint in the patient's own words, for example blurred distance vision, headaches when reading or gritty eyes.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Record the complaint — Clinexus eye clinic dashboard" },
          { title: "Enter vision for each eye", body: "Record unaided, aided and pinhole vision separately for the right eye (OD) and left eye (OS). Pinhole vision helps you tell a refractive problem from disease.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Enter vision for each eye — Clinexus eye clinic dashboard" },
          { title: "Record the pressures", body: "Choose the pressure method you used, then enter the reading in mmHg for each eye. Readings above 21 mmHg are flagged on the list and on the overview.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Record the pressures — Clinexus eye clinic dashboard" },
          { title: "Examine and record the front of the eye", body: "Enter pupil findings and the anterior segment findings for each eye, covering lids, conjunctiva, cornea, anterior chamber and lens.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Examine and record the front of the eye — Clinexus eye clinic dashboard" },
          { title: "Record the fundus and cup/disc ratio", body: "Enter the fundus findings and the cup/disc ratio for each eye. A ratio of 0.6 or more is picked up on the glaucoma watch list.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Record the fundus and cup/disc ratio — Clinexus eye clinic dashboard" },
          { title: "Mark dilation", body: "Turn on the dilation toggle when the pupils were dilated for this exam, so the next clinician can interpret the findings correctly.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Mark dilation — Clinexus eye clinic dashboard" },
          { title: "Finish with diagnosis and plan", body: "Enter your diagnosis, the plan and any notes, then select Save exam. Use the trash icon on a list row only to remove a record created in error.", image: "/tutorials/eye/eye-exams.png", imageAlt: "Finish with diagnosis and plan — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "run-a-diagnostic-study",
        title: "Record a Diagnostic Study",
        summary: "Log OCT, visual fields and imaging with their findings and files.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Diagnostics", body: "Choose Diagnostics from the Eye Clinic group and select Record Study.", image: "/tutorials/eye/eye-diagnostics.png", imageAlt: "Open Diagnostics — Clinexus eye clinic dashboard" },
          { title: "Choose the study and eye", body: "Select the patient, the study type, and whether it applies to the right eye, the left eye or both.", image: "/tutorials/eye/eye-diagnostics.png", imageAlt: "Choose the study and eye — Clinexus eye clinic dashboard" },
          { title: "Enter the findings", body: "Type the measured values into the findings, using the standard short forms so they can be charted, for example RNFL 82, CMT 260, MD -3.4, PSD 2.1 or CDR 0.7.", image: "/tutorials/eye/eye-diagnostics.png", imageAlt: "Enter the findings — Clinexus eye clinic dashboard" },
          { title: "Attach the report", body: "Add the file name and a link to the stored report or image so colleagues can open the original.", image: "/tutorials/eye/eye-diagnostics.png", imageAlt: "Attach the report — Clinexus eye clinic dashboard" },
          { title: "Save and filter", body: "Select Save study, then use the study type filter at the top of the list to find a group of studies quickly.", image: "/tutorials/eye/eye-diagnostics.png", imageAlt: "Save and filter — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "read-eye-results",
        title: "Read Eye Results",
        summary: "Review a patient's fundus, OCT and visual field reports in one place.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Eye Results", body: "Choose Eye Results from the Eye Clinic group.", image: "/tutorials/eye/eye-results.png", imageAlt: "Open Eye Results — Clinexus eye clinic dashboard" },
          { title: "Select the patient", body: "Use the patient card to pick a patient. The card also summarises their latest exam pressure, vision, cup/disc ratio and diagnosis.", image: "/tutorials/eye/eye-results.png", imageAlt: "Select the patient — Clinexus eye clinic dashboard" },
          { title: "Work through the groups", body: "Results are grouped into fundus, OCT, visual field and other, each with a count so you can see what is available.", image: "/tutorials/eye/eye-results.png", imageAlt: "Work through the groups — Clinexus eye clinic dashboard" },
          { title: "Read the flagged values", body: "Each row shows the extracted measurements as badges and highlights abnormal ones, so you can spot a thinning nerve or worsening field at a glance.", image: "/tutorials/eye/eye-results.png", imageAlt: "Read the flagged values — Clinexus eye clinic dashboard" },
          { title: "Open the original file", body: "Select the file link on a row to open the stored report, and use the Graphs button to move to the trend view.", image: "/tutorials/eye/eye-results.png", imageAlt: "Open the original file — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "track-eye-charts",
        title: "Track Eye Charts and Trends",
        summary: "See whether pressure, nerve and field measurements are getting worse.",
        duration: "7 min",
        level: "Intermediate",
        steps: [
          { title: "Open Eye Charts", body: "Choose Eye Charts from the Eye Clinic group.", image: "/tutorials/eye/eye-charts.png", imageAlt: "Open Eye Charts — Clinexus eye clinic dashboard" },
          { title: "Select the patient", body: "Pick the patient in the picker. The badges show how many fundus, OCT, visual field and other studies they have.", image: "/tutorials/eye/eye-charts.png", imageAlt: "Select the patient — Clinexus eye clinic dashboard" },
          { title: "Read the trends", body: "Six charts plot pressure, cup/disc ratio, OCT nerve fibre thickness, central macular thickness, and visual field mean deviation and pattern standard deviation over time.", image: "/tutorials/eye/eye-charts.png", imageAlt: "Read the trends — Clinexus eye clinic dashboard" },
          { title: "Compare the two eyes", body: "The right eye is drawn as a solid line and the left eye as a dashed line, so a change in one eye stands out.", image: "/tutorials/eye/eye-charts.png", imageAlt: "Compare the two eyes — Clinexus eye clinic dashboard" },
          { title: "Act on a worsening trend", body: "If a line is moving the wrong way, review the source studies, change treatment or refer, and book the next review.", image: "/tutorials/eye/eye-charts.png", imageAlt: "Act on a worsening trend — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "use-the-eye-overview",
        title: "Run Your Day from the Eye Overview",
        summary: "Use one screen to see clinic activity and the patients who need attention.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Eye Clinic Overview", body: "Choose Eye Clinic Overview from the Overview group.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Open Eye Clinic Overview — Clinexus eye clinic dashboard" },
          { title: "Check the activity cards", body: "Read exams today, prescriptions issued, active contact lens wearers, open optical orders, upcoming surgeries and diagnostic studies.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Check the activity cards — Clinexus eye clinic dashboard" },
          { title: "Check the money cards", body: "Review optical sales value, the amount still outstanding on orders, and the glasses that are ready for collection.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Check the money cards — Clinexus eye clinic dashboard" },
          { title: "Work the alert lists", body: "Follow up raised pressure above 21 mmHg, the glaucoma watch list, today's theatre list, contact lens aftercare that is due and prescriptions expiring soon.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Work the alert lists — Clinexus eye clinic dashboard" },
          { title: "Start work from here", body: "Select New Eye Exam to go straight into recording a visit, and review the common diagnoses chart to see what your clinic is treating most.", image: "/tutorials/eye/eye-overview.png", imageAlt: "Start work from here — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "optical",
    title: "Optical & Contact Lenses",
    description: "Prescriptions, contact lens fittings, frames, lenses and collections.",
    tutorials: [
      {
        slug: "issue-an-optical-prescription",
        title: "Issue an Optical Prescription",
        summary: "Write a spectacle prescription with the correct values for each eye.",
        duration: "9 min",
        level: "Beginner",
        steps: [
          { title: "Open Optical Prescriptions", body: "Choose Optical Prescriptions from the Eye Clinic group and select New Prescription.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Open Optical Prescriptions — Clinexus eye clinic dashboard" },
          { title: "Choose the patient and type", body: "Select the patient, then choose the prescription type: distance, reading, bifocal, progressive, computer or contact lens.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Choose the patient and type — Clinexus eye clinic dashboard" },
          { title: "Set the dates", body: "Enter the issue date and the expiry date. Expiring prescriptions are listed on the Eye Clinic Overview so patients can be recalled.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Set the dates — Clinexus eye clinic dashboard" },
          { title: "Enter the right eye values", body: "In the right eye (OD) box, enter sphere, cylinder, axis, add and prism exactly as measured.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Enter the right eye values — Clinexus eye clinic dashboard" },
          { title: "Enter the left eye values", body: "Repeat in the left eye (OS) box, and check the signs before you move on. A wrong sign means a wrong lens.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Enter the left eye values — Clinexus eye clinic dashboard" },
          { title: "Add the fitting details", body: "Enter pupillary distance in mm, base curve, diameter, the lens brand and any notes for the dispenser.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Add the fitting details — Clinexus eye clinic dashboard" },
          { title: "Save and check", body: "Select Save prescription, then confirm the formatted values on the list row match what you measured.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Save and check — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "fit-contact-lenses",
        title: "Fit and Follow Up Contact Lenses",
        summary: "Record a fitting, track the lens details and keep aftercare on time.",
        duration: "10 min",
        level: "Intermediate",
        steps: [
          { title: "Open Contact Lenses", body: "Choose Contact Lenses from the Eye Clinic group and select New Fitting.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Open Contact Lenses — Clinexus eye clinic dashboard" },
          { title: "Choose the patient and date", body: "Select the patient and set the fitting date.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Choose the patient and date — Clinexus eye clinic dashboard" },
          { title: "Record the lens", body: "Enter the lens brand, the lens type and the wearing modality, then the base curve and diameter.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Record the lens — Clinexus eye clinic dashboard" },
          { title: "Enter the power for each eye", body: "Record the power for the right eye and the left eye separately.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Enter the power for each eye — Clinexus eye clinic dashboard" },
          { title: "Assess the fit", body: "Write your fit assessment, covering centration, movement, comfort and vision with the lens in place.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Assess the fit — Clinexus eye clinic dashboard" },
          { title: "Book aftercare", body: "Set the aftercare date so the patient appears on the aftercare-due list on the Eye Clinic Overview.", image: "/tutorials/eye/appointments.png", imageAlt: "Book aftercare — Clinexus eye clinic dashboard" },
          { title: "Keep the status current", body: "Move the fitting from trial to dispensed, then to aftercare, or to discontinued if the patient stops wearing lenses.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Keep the status current — Clinexus eye clinic dashboard" },
          { title: "Save the fitting", body: "Select Save fitting and confirm the status badge and aftercare date on the list row.", image: "/tutorials/eye/contact-lenses.png", imageAlt: "Save the fitting — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "manage-optical-orders",
        title: "Manage Optical Orders",
        summary: "Track glasses from order to lab to collection, and the money with them.",
        duration: "10 min",
        level: "Beginner",
        steps: [
          { title: "Open Optical Orders", body: "Choose Optical Orders from the Eye Clinic group and select New Order.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Open Optical Orders — Clinexus eye clinic dashboard" },
          { title: "Identify the order", body: "Select the patient, then enter your order number and the order date so the job can be traced.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Identify the order — Clinexus eye clinic dashboard" },
          { title: "Record the frame", body: "Enter the frame brand, model and price the patient chose.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Record the frame — Clinexus eye clinic dashboard" },
          { title: "Record the lenses", body: "Choose the lens type and coating, then enter the lens price.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Record the lenses — Clinexus eye clinic dashboard" },
          { title: "Add the lab and promised date", body: "Enter the lab or supplier and the date you promised the glasses, so you can see which jobs are late.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Add the lab and promised date — Clinexus eye clinic dashboard" },
          { title: "Record the money", body: "Enter the total amount and the amount paid. Any balance is shown in red on the list row.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Record the money — Clinexus eye clinic dashboard" },
          { title: "Move the status along", body: "Update the status as the job progresses: ordered, at lab, ready, collected or cancelled. Ready orders appear as glasses awaiting collection on the overview.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Move the status along — Clinexus eye clinic dashboard" },
          { title: "Close the order", body: "When the patient collects, enter the delivered date, confirm the balance is settled, and select Save order.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Close the order — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "dispense-checklist",
        title: "Run a Safe Dispensing Check",
        summary: "Check a pair of glasses against the prescription before it leaves the clinic.",
        duration: "5 min",
        level: "Intermediate",
        steps: [
          { title: "Open the patient's prescription", body: "On Optical Prescriptions, open the prescription the order was made from.", image: "/tutorials/eye/optical-prescriptions.png", imageAlt: "Open the patient's prescription — Clinexus eye clinic dashboard" },
          { title: "Compare eye by eye", body: "Check sphere, cylinder, axis and add for the right eye and the left eye against the order and the lab ticket.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Compare eye by eye — Clinexus eye clinic dashboard" },
          { title: "Check the fit", body: "Confirm the pupillary distance, lens type and coating match what was ordered, and adjust the frame on the patient.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Check the fit — Clinexus eye clinic dashboard" },
          { title: "Confirm the vision", body: "Ask the patient to read distance and near with the new glasses, and note any complaint before they leave.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Confirm the vision — Clinexus eye clinic dashboard" },
          { title: "Complete the order", body: "Mark the optical order collected, record the delivered date and settle any balance.", image: "/tutorials/eye/optical-orders.png", imageAlt: "Complete the order — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "surgery",
    title: "Surgery & Theatre",
    description: "Booking eye surgery, lens planning, pre-op checks and outcomes.",
    tutorials: [
      {
        slug: "book-eye-surgery",
        title: "Book Eye Surgery",
        summary: "Create a theatre booking with the correct procedure, eye and lens plan.",
        duration: "10 min",
        level: "Intermediate",
        steps: [
          { title: "Open Surgery Bookings", body: "Choose Surgery Bookings from the Eye Clinic group and select New Booking.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Open Surgery Bookings — Clinexus eye clinic dashboard" },
          { title: "Choose the patient and procedure", body: "Select the patient, then the procedure, for example cataract surgery with a lens implant, laser treatment or an injection.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Choose the patient and procedure — Clinexus eye clinic dashboard" },
          { title: "Confirm the eye", body: "Set whether the surgery is on the right eye, the left eye or both. Check this against the exam notes before saving.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Confirm the eye — Clinexus eye clinic dashboard" },
          { title: "Set the date, time and theatre", body: "Enter the date, the time and the theatre so the case appears on the theatre list on the Eye Clinic Overview.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Set the date, time and theatre — Clinexus eye clinic dashboard" },
          { title: "Plan the lens", body: "Enter the lens model and its power in dioptres, and record the biometry notes the plan is based on.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Plan the lens — Clinexus eye clinic dashboard" },
          { title: "Save the booking", body: "Select Save booking and confirm the case shows the right procedure, eye and status on the list.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Save the booking — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "complete-preop-checks",
        title: "Complete the Pre-Op Checklist",
        summary: "Work through every pre-operative check before the patient goes to theatre.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open the booking", body: "On Surgery Bookings, open the case you are preparing.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Open the booking — Clinexus eye clinic dashboard" },
          { title: "Work down the checklist", body: "Tick each pre-op item as it is done: consent signed, biometry done, blood pressure checked, blood sugar checked, fasting confirmed, pupil dilated, antibiotic drops started, anaesthetic review and lens available.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Work down the checklist — Clinexus eye clinic dashboard" },
          { title: "Record the consent", body: "Tick the consent box only when the signed form exists. A case without it shows a 'no consent' warning on the list.", image: "/tutorials/eye/consent-forms.png", imageAlt: "Record the consent — Clinexus eye clinic dashboard" },
          { title: "Confirm the booking", body: "Move the status to confirmed once the checks are complete and the patient has been told when to arrive.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Confirm the booking — Clinexus eye clinic dashboard" },
          { title: "Handle changes early", body: "If a check fails, set the status to postponed or cancelled and tell the patient, rather than leaving the case on the theatre list.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Handle changes early — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "record-surgery-outcome",
        title: "Record the Surgery Outcome",
        summary: "Close the case with what was done and what the follow-up should be.",
        duration: "6 min",
        level: "Intermediate",
        steps: [
          { title: "Open the completed case", body: "On Surgery Bookings, open the booking after the operation.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Open the completed case — Clinexus eye clinic dashboard" },
          { title: "Write the outcome", body: "Record what was done, the lens actually implanted, anything unexpected and the post-operative drops.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Write the outcome — Clinexus eye clinic dashboard" },
          { title: "Set the status to completed", body: "Update the status so the case leaves the upcoming theatre list.", image: "/tutorials/eye/surgery-bookings.png", imageAlt: "Set the status to completed — Clinexus eye clinic dashboard" },
          { title: "Book the review", body: "Create the post-operative appointment, and record the first-day vision and pressure as a new eye exam.", image: "/tutorials/eye/appointments.png", imageAlt: "Book the review — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "billing",
    title: "Billing & Payments",
    description: "Invoices, payments, estimates, plans and expenses.",
    tutorials: [
      {
        slug: "create-an-invoice",
        title: "Create and Settle an Invoice",
        summary: "Bill a visit, glasses or procedure and record the payment.",
        duration: "8 min",
        level: "Beginner",
        steps: [
          { title: "Open Billing", body: "Choose Billing from Finance.", image: "/tutorials/eye/billing.png", imageAlt: "Open Billing — Clinexus eye clinic dashboard" },
          { title: "Start the invoice", body: "Create a new invoice and select the patient.", image: "/tutorials/eye/billing.png", imageAlt: "Start the invoice — Clinexus eye clinic dashboard" },
          { title: "Add the lines", body: "Add what the patient is paying for, such as the eye examination, visual field test, frames, lenses, contact lenses or drops.", image: "/tutorials/eye/billing.png", imageAlt: "Add the lines — Clinexus eye clinic dashboard" },
          { title: "Record the payment", body: "Enter the amount received and the payment method. Part payments leave a visible balance.", image: "/tutorials/eye/billing.png", imageAlt: "Record the payment — Clinexus eye clinic dashboard" },
          { title: "Check it is closed", body: "Save the invoice and confirm the status and the patient's outstanding balance are correct.", image: "/tutorials/eye/billing.png", imageAlt: "Check it is closed — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "quote-with-an-estimate",
        title: "Quote a Patient with an Estimate",
        summary: "Give a written price before the patient commits to glasses or surgery.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Estimates", body: "Choose Estimates from Finance.", image: "/tutorials/eye/estimates.png", imageAlt: "Open Estimates — Clinexus eye clinic dashboard" },
          { title: "Build the quote", body: "Select the patient and add the items, such as frame, lenses, coatings and the professional fee, or the surgery package.", image: "/tutorials/eye/estimates.png", imageAlt: "Build the quote — Clinexus eye clinic dashboard" },
          { title: "Share it with the patient", body: "Send or print the estimate so the patient can decide with clear figures.", image: "/tutorials/eye/estimates.png", imageAlt: "Share it with the patient — Clinexus eye clinic dashboard" },
          { title: "Convert it when accepted", body: "Once the patient agrees, raise the invoice or the optical order from the agreed figures.", image: "/tutorials/eye/billing.png", imageAlt: "Convert it when accepted — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "set-up-a-payment-plan",
        title: "Set Up a Payment Plan",
        summary: "Let a patient pay for glasses or surgery in instalments.",
        duration: "6 min",
        level: "Intermediate",
        steps: [
          { title: "Open Payment Plans", body: "Choose Payment Plans from Finance.", image: "/tutorials/eye/payment-plans.png", imageAlt: "Open Payment Plans — Clinexus eye clinic dashboard" },
          { title: "Create the plan", body: "Select the patient, enter the total, the deposit and the instalment amounts and dates.", image: "/tutorials/eye/payment-plans.png", imageAlt: "Create the plan — Clinexus eye clinic dashboard" },
          { title: "Record each instalment", body: "Add each payment as it is received so the remaining balance stays accurate.", image: "/tutorials/eye/payment-plans.png", imageAlt: "Record each instalment — Clinexus eye clinic dashboard" },
          { title: "Watch for missed payments", body: "Review overdue instalments regularly and contact the patient before releasing further work.", image: "/tutorials/eye/payment-plans.png", imageAlt: "Watch for missed payments — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "record-expenses",
        title: "Record Clinic Expenses",
        summary: "Capture what the clinic spends so profit figures are real.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Expenses", body: "Choose Expenses from Finance.", image: "/tutorials/eye/expenses.png", imageAlt: "Open Expenses — Clinexus eye clinic dashboard" },
          { title: "Add the expense", body: "Enter the date, category, amount and a short description, for example lens lab invoice, frame stock, drops, rent or equipment servicing.", image: "/tutorials/eye/expenses.png", imageAlt: "Add the expense — Clinexus eye clinic dashboard" },
          { title: "Keep the proof", body: "Attach or file the receipt reference so the entry can be checked later.", image: "/tutorials/eye/expenses.png", imageAlt: "Keep the proof — Clinexus eye clinic dashboard" },
          { title: "Review by category", body: "Compare categories each month to see where costs are rising.", image: "/tutorials/eye/expenses.png", imageAlt: "Review by category — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "inventory",
    title: "Inventory & Supplies",
    description: "Frames, lenses, contact lenses, eye drops, suppliers and purchase orders.",
    tutorials: [
      {
        slug: "set-up-your-stock",
        title: "Set Up Your Stock List",
        summary: "Track frames, lenses, contact lenses and ophthalmic drugs.",
        duration: "8 min",
        level: "Beginner",
        steps: [
          { title: "Open Inventory", body: "Choose Inventory from Inventory & Supply.", image: "/tutorials/eye/inventory.png", imageAlt: "Open Inventory — Clinexus eye clinic dashboard" },
          { title: "Add your items", body: "Create items for frames, stock lenses, contact lenses, solutions, diagnostic drops, anaesthetics and consumables.", image: "/tutorials/eye/inventory.png", imageAlt: "Add your items — Clinexus eye clinic dashboard" },
          { title: "Set quantities and reorder levels", body: "Enter the current quantity and the level at which you want to be warned, so you never run out of a fast-moving frame or drop.", image: "/tutorials/eye/inventory.png", imageAlt: "Set quantities and reorder levels — Clinexus eye clinic dashboard" },
          { title: "Record expiry dates", body: "Add expiry dates for drops, solutions and contact lenses, and check the expiry alerts before dispensing.", image: "/tutorials/eye/inventory.png", imageAlt: "Record expiry dates — Clinexus eye clinic dashboard" },
          { title: "Adjust stock as you use it", body: "Update quantities when items are dispensed or damaged so the counts stay trustworthy.", image: "/tutorials/eye/inventory.png", imageAlt: "Adjust stock as you use it — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "manage-suppliers",
        title: "Manage Suppliers",
        summary: "Keep your frame, lens and drug suppliers in one place.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open Suppliers", body: "Choose Suppliers from Inventory & Supply.", image: "/tutorials/eye/suppliers.png", imageAlt: "Open Suppliers — Clinexus eye clinic dashboard" },
          { title: "Add a supplier", body: "Enter the company name, contact person, phone, email and what they supply.", image: "/tutorials/eye/suppliers.png", imageAlt: "Add a supplier — Clinexus eye clinic dashboard" },
          { title: "Note the terms", body: "Record lead times and payment terms so you know how early to order lenses and frames.", image: "/tutorials/eye/suppliers.png", imageAlt: "Note the terms — Clinexus eye clinic dashboard" },
          { title: "Keep details current", body: "Update or remove a supplier when contacts change, so orders do not go to the wrong place.", image: "/tutorials/eye/suppliers.png", imageAlt: "Keep details current — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "raise-a-purchase-order",
        title: "Raise a Purchase Order",
        summary: "Order stock from a supplier and receive it against the order.",
        duration: "7 min",
        level: "Intermediate",
        steps: [
          { title: "Open Purchase Orders", body: "Choose Purchase Orders from Inventory & Supply.", image: "/tutorials/eye/purchase-orders.png", imageAlt: "Open Purchase Orders — Clinexus eye clinic dashboard" },
          { title: "Create the order", body: "Select the supplier and add the items and quantities you need.", image: "/tutorials/eye/purchase-orders.png", imageAlt: "Create the order — Clinexus eye clinic dashboard" },
          { title: "Send and track it", body: "Send the order to the supplier and keep its status current while you wait.", image: "/tutorials/eye/purchase-orders.png", imageAlt: "Send and track it — Clinexus eye clinic dashboard" },
          { title: "Receive the delivery", body: "Check what arrived against the order, then record the received quantities so stock levels update.", image: "/tutorials/eye/inventory.png", imageAlt: "Receive the delivery — Clinexus eye clinic dashboard" },
          { title: "Query shortfalls", body: "Raise missing or damaged items with the supplier before closing the order.", image: "/tutorials/eye/purchase-orders.png", imageAlt: "Query shortfalls — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
  {
    slug: "reports",
    title: "Reports & Insights",
    description: "Understanding your dashboard metrics and exporting reports.",
    tutorials: [
      {
        slug: "run-a-clinic-report",
        title: "Run a Clinic Report",
        summary: "Compare revenue, activity, patients and team performance for a period.",
        duration: "7 min",
        level: "Beginner",
        steps: [
          { title: "Open Reports", body: "Choose Reports from the Reports group.", image: "/tutorials/eye/reports.png", imageAlt: "Open Reports — Clinexus eye clinic dashboard" },
          { title: "Choose the date range", body: "Set the from and to dates for the period you want to review.", image: "/tutorials/eye/reports.png", imageAlt: "Choose the date range — Clinexus eye clinic dashboard" },
          { title: "Read the key numbers", body: "Review the headline cards, the revenue trend, the service mix and the clinician performance table.", image: "/tutorials/eye/reports.png", imageAlt: "Read the key numbers — Clinexus eye clinic dashboard" },
          { title: "Export the results", body: "Select Export to download the report for sharing or further review.", image: "/tutorials/eye/reports.png", imageAlt: "Export the results — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "use-advanced-analytics",
        title: "Use Advanced Analytics",
        summary: "Explore deeper performance views when standard reports are not enough.",
        duration: "8 min",
        level: "Advanced",
        steps: [
          { title: "Open Advanced Analytics", body: "Choose Advanced Analytics from the Reports group. Access is limited to the roles your clinic allows.", image: "/tutorials/eye/analytics.png", imageAlt: "Open Advanced Analytics — Clinexus eye clinic dashboard" },
          { title: "Start with the overview", body: "Review the headline metrics before narrowing your investigation.", image: "/tutorials/eye/analytics.png", imageAlt: "Start with the overview — Clinexus eye clinic dashboard" },
          { title: "Compare the charts", body: "Compare revenue, activity and performance across the available periods or categories.", image: "/tutorials/eye/analytics.png", imageAlt: "Compare the charts — Clinexus eye clinic dashboard" },
          { title: "Turn an insight into action", body: "Adjust schedules, frame and lens stock, pricing or recall lists, then review the next period.", image: "/tutorials/eye/analytics.png", imageAlt: "Turn an insight into action — Clinexus eye clinic dashboard" },
        ],
      },
      {
        slug: "review-profitability",
        title: "Review Profitability",
        summary: "See how consultations, optical sales and surgery contribute to the result.",
        duration: "6 min",
        level: "Advanced",
        steps: [
          { title: "Open Profitability", body: "Choose Profitability from Finance when your role has access.", image: "/tutorials/eye/profitability.png", imageAlt: "Open Profitability — Clinexus eye clinic dashboard" },
          { title: "Compare revenue and expenses", body: "Review the revenue, expense and margin views to see what is driving the current result.", image: "/tutorials/eye/profitability.png", imageAlt: "Compare revenue and expenses — Clinexus eye clinic dashboard" },
          { title: "Separate optical from clinical", body: "Compare examination income with frame, lens and contact lens income to see which side is carrying the clinic.", image: "/tutorials/eye/profitability.png", imageAlt: "Separate optical from clinical — Clinexus eye clinic dashboard" },
          { title: "Follow up in the source screen", body: "Use Billing, Expenses, Optical Orders or Reports to investigate the record behind an unexpected figure.", image: "/tutorials/eye/profitability.png", imageAlt: "Follow up in the source screen — Clinexus eye clinic dashboard" },
        ],
      },
    ],
  },
];

const dentalSections = (): TutorialSection[] => [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Create your clinic, invite your team and find your way around the dashboard.",
    tutorials: [
      {
        slug: "find-your-way-around",
        title: "Find Your Way Around the Dashboard",
        summary: "Learn where the main dental workflows live and return to the right screen quickly.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open your clinic dashboard", body: "Sign in and choose your clinic. The Dashboard is the starting point for appointments, patients, clinical work, finance and stock.", image: "/tutorials/dashboard.png", imageAlt: "Open your clinic dashboard — Clinexus dental dashboard" },
          { title: "Use the sidebar groups", body: "Open Patient Care for patients and appointments, Clinical for dental work, Finance for money matters, Reports for performance, and Inventory & Supply for stock.", image: "/tutorials/dashboard.png", imageAlt: "Use the sidebar groups — Clinexus dental dashboard" },
          { title: "Open Tutorials when you need a refresher", body: "Select Tutorials from the shared navigation to return to these guides. Use the page walk-through button when it appears on a dashboard screen.", image: "/tutorials/tutorials.png", imageAlt: "Open Tutorials when you need a refresher — Clinexus dental dashboard" },
          { title: "Check your access", body: "If a page is missing from the sidebar, ask an owner or admin to review your staff role. Access to billing, records and settings depends on that role.", image: "/tutorials/dashboard.png", imageAlt: "Check your access — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "set-up-your-first-day",
        title: "Set Up Your First Day",
        summary: "Complete the essential clinic settings before booking your first patient.",
        duration: "10 min",
        level: "Beginner",
        steps: [
          { title: "Open Settings", body: "Choose Settings from the shared navigation, then open Clinic Profile.", image: "/tutorials/settings.png", imageAlt: "Open Settings — Clinexus dental dashboard" },
          { title: "Save your clinic details", body: "Enter the clinic information your team and patients should see, optionally select Upload Logo, then select Save Changes.", image: "/tutorials/settings.png", imageAlt: "Save your clinic details — Clinexus dental dashboard" },
          { title: "Add your team", body: "Open Staff, select Add Staff, enter the staff member's details and role, then complete the dialog to create the account.", image: "/tutorials/settings.png", imageAlt: "Add your team — Clinexus dental dashboard" },
          { title: "Set working hours", body: "Open Schedules, select a staff member, turn working days on or off, and enter the working-hour and break times.", image: "/tutorials/schedules.png", imageAlt: "Set working hours — Clinexus dental dashboard" },
          { title: "Add your services", body: "Open Treatments, stay on Catalog, select Add Treatment, enter the service details and save it for use in plans and billing.", image: "/tutorials/settings.png", imageAlt: "Add your services — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "setup",
    title: "Setup & Configuration",
    description: "Clinic details, branding, working hours, services, pricing and roles.",
    tutorials: [
      {
        slug: "configure-clinic-settings",
        title: "Configure Clinic Settings",
        summary: "Keep your clinic profile, website, notifications and team settings in one place.",
        duration: "8 min",
        level: "Beginner",
        steps: [
          { title: "Open Clinic Profile", body: "In Settings, choose the Clinic Profile tab and review the clinic name and contact details.", image: "/tutorials/patient-profile.png", imageAlt: "Open Clinic Profile — Clinexus dental dashboard" },
          { title: "Upload your logo", body: "Select Upload Logo, choose the clinic logo, and check that it appears correctly before saving.", image: "/tutorials/settings.png", imageAlt: "Upload your logo — Clinexus dental dashboard" },
          { title: "Turn on the right notifications", body: "Open Notifications and choose the switches for Appointment Reminders, Payment Alerts, Lab Completion Alerts and Low Stock Alerts.", image: "/tutorials/settings.png", imageAlt: "Turn on the right notifications — Clinexus dental dashboard" },
          { title: "Manage members and chairs", body: "If you are an admin, use Members & Roles to edit details or change a role. Use Chairs to add or remove treatment chairs.", image: "/tutorials/settings.png", imageAlt: "Manage members and chairs — Clinexus dental dashboard" },
          { title: "Save each change", body: "Select Save Changes after updating a settings tab. Reopen the tab to confirm the saved values are still present.", image: "/tutorials/settings.png", imageAlt: "Save each change — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "add-staff-and-assign-roles",
        title: "Manage Staff and Assign Roles",
        summary: "Add your team, give each person the right access, create logins and keep records up to date.",
        duration: "12 min",
        level: "Beginner",
        steps: [
          { title: "Open Staff Management", body: "Choose Staff from the Administration group. The page header shows how many team members you have, and every person appears as a card with their name, specialty, role badge, status and phone number.", image: "/tutorials/staff-management.png", imageAlt: "Staff Management page — Clinexus dental dashboard" },
          { title: "Use the built-in help first", body: "Select Walk me through for a guided tour of the page, or How to use for a short written summary. Both point out the Add Staff button, the staff cards and the role badges.", image: "/tutorials/staff-management.png", imageAlt: "Walk me through and How to use on Staff Management — Clinexus dental dashboard" },
          { title: "Start a new staff member", body: "Select Add Staff to open the Add Staff Member dialog, then enter the person's full name. Full Name is the only required field.", image: "/tutorials/staff-add.png", imageAlt: "Add Staff Member dialog — Clinexus dental dashboard" },
          { title: "Choose the role", body: "Pick the role that matches the person's work: dentist, assistant, hygienist, receptionist, accountant, lab technician or lab assistant. Owners can also assign admin. The role decides which pages appear in that person's sidebar.", image: "/tutorials/staff-add.png", imageAlt: "Choosing a staff role — Clinexus dental dashboard" },
          { title: "Add specialty and contact details", body: "Enter a specialty such as Orthodontics when it helps your team recognise the person, then add the phone number and email address used for clinic contact.", image: "/tutorials/staff-add.png", imageAlt: "Staff specialty and contact fields — Clinexus dental dashboard" },
          { title: "Create a login when they need one", body: "Turn on Create Login Account for anyone who will use the dashboard, then enter the email and password they will sign in with. Leave it off for staff you only want listed in records.", image: "/tutorials/staff-add.png", imageAlt: "Create Login Account switch — Clinexus dental dashboard" },
          { title: "Save the staff member", body: "Select Add Staff to save. The new card appears in the grid with a coloured role badge and an active status dot.", image: "/tutorials/staff-management.png", imageAlt: "New staff card in the staff grid — Clinexus dental dashboard" },
          { title: "Edit a person later", body: "Hover a staff card and select the pencil icon to open Edit Staff. You can correct the name, role, specialty, phone and email, and owners and admins can set a new password for that person.", image: "/tutorials/staff-edit.png", imageAlt: "Edit Staff dialog — Clinexus dental dashboard" },
          { title: "Deactivate instead of deleting", body: "When someone leaves, open Edit Staff and change Status to Inactive. Their history stays in your records but the card is marked inactive and their access is withdrawn.", image: "/tutorials/staff-edit.png", imageAlt: "Setting a staff member to inactive — Clinexus dental dashboard" },
          { title: "Set their working hours", body: "After adding dentists and other clinical staff, open Schedules and set each person's working days, hours and breaks so appointments can only be booked when they are available.", image: "/tutorials/schedules.png", imageAlt: "Staff schedules — Clinexus dental dashboard" },
          { title: "Check what each role can see", body: "Ask the person to sign in and confirm the sidebar matches their job. If a page is missing or they can see too much, return to Edit Staff and adjust the role.", image: "/tutorials/staff-management.png", imageAlt: "Reviewing staff roles — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "build-your-treatment-catalog",
        title: "Build Your Treatment Catalog",
        summary: "Create the services and prices your team will select during care and billing.",
        duration: "10 min",
        level: "Beginner",
        steps: [
          { title: "Open Treatments", body: "Choose Treatments from the Clinical group and select the Catalog tab.", image: "/tutorials/treatments.png", imageAlt: "Open Treatments — Clinexus dental dashboard" },
          { title: "Add a treatment", body: "Select Add Treatment and enter the treatment name, category, price and other required details.", image: "/tutorials/treatments.png", imageAlt: "Add a treatment — Clinexus dental dashboard" },
          { title: "Save the catalog item", body: "Complete the dialog to save the treatment, then confirm it appears in the catalog list.", image: "/tutorials/treatments.png", imageAlt: "Save the catalog item — Clinexus dental dashboard" },
          { title: "Review treatment plans separately", body: "Use the Treatment Plans tab for patient-specific plans; the Catalog is for reusable services.", image: "/tutorials/treatments.png", imageAlt: "Review treatment plans separately — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "set-up-your-public-website",
        title: "Set Up Your Public Website",
        summary: "Update your clinic website content, services, FAQs, testimonials and images.",
        duration: "15 min",
        level: "Intermediate",
        steps: [
          { title: "Choose a website section", body: "Open Website Settings and use the section selector to move between the public pages and content areas.", image: "/tutorials/website-settings.png", imageAlt: "Choose a website section — Clinexus dental dashboard" },
          { title: "Update the main content", body: "Edit the text and colours for the selected section. Use Reset to template colours if you want to restore the template palette.", image: "/tutorials/website-settings.png", imageAlt: "Update the main content — Clinexus dental dashboard" },
          { title: "Add repeated content", body: "Use Add service card, Add reason, Add testimonial, Add price row or Add question where the section offers those choices.", image: "/tutorials/website-settings.png", imageAlt: "Add repeated content — Clinexus dental dashboard" },
          { title: "Add images", body: "Use the image upload controls for the hero and gallery images, then check the preview for cropping and readability.", image: "/tutorials/website-settings.png", imageAlt: "Add images — Clinexus dental dashboard" },
          { title: "Use the built-in walkthrough", body: "Select Show me how when you want the page to point out the available website settings.", image: "/tutorials/website-settings.png", imageAlt: "Use the built-in walkthrough — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "manage-products-and-shop-orders",
        title: "Manage Products and Shop Orders",
        summary: "Add products and move shop orders from review through delivery.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Add a product", body: "Open Shop Management and select Add Product. Enter the product information and complete the dialog.", image: "/tutorials/shop-management.png", imageAlt: "Add a product — Clinexus dental dashboard" },
          { title: "Review an order", body: "Use View on an order to inspect its items, customer details and current status.", image: "/tutorials/shop-management.png", imageAlt: "Review an order — Clinexus dental dashboard" },
          { title: "Confirm the order", body: "Select Confirm when the order is ready for processing.", image: "/tutorials/shop-management.png", imageAlt: "Confirm the order — Clinexus dental dashboard" },
          { title: "Complete delivery", body: "When the customer has received the order, select Mark Delivered. Use Cancel only when the order should not continue.", image: "/tutorials/shop-management.png", imageAlt: "Complete delivery — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "review-the-audit-log",
        title: "Review the Audit Log",
        summary: "Check a time-ordered record of important activity in your clinic.",
        duration: "4 min",
        level: "Intermediate",
        steps: [
          { title: "Open Audit Log", body: "Choose Audit Log from Administration. This page is available to owners and admins.", image: "/tutorials/audit-log.png", imageAlt: "Open Audit Log — Clinexus dental dashboard" },
          { title: "Scan recent activity", body: "Review the activity list to see what changed and when.", image: "/tutorials/audit-log.png", imageAlt: "Scan recent activity — Clinexus dental dashboard" },
          { title: "Investigate an entry", body: "Use the entry details to compare the action with the patient, invoice, staff or setting involved.", image: "/tutorials/audit-log.png", imageAlt: "Investigate an entry — Clinexus dental dashboard" },
          { title: "Follow up safely", body: "If an entry is unexpected, review the related record and ask an owner or admin to confirm the next action.", image: "/tutorials/audit-log.png", imageAlt: "Follow up safely — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "patients",
    title: "Patients & Records",
    description: "Registering patients, medical records, documents and history.",
    tutorials: [
      {
        slug: "register-a-patient",
        title: "Register a Patient",
        summary: "Create one complete patient record that the whole team can use.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Patients", body: "Choose Patients from Patient Care and select Add Patient.", image: "/tutorials/patients.png", imageAlt: "Open Patients — Clinexus dental dashboard" },
          { title: "Enter contact details", body: "Complete the patient's name, phone number and other required contact fields in the Add Patient dialog.", image: "/tutorials/patients.png", imageAlt: "Enter contact details — Clinexus dental dashboard" },
          { title: "Add useful history", body: "Record the patient's medical history and other relevant details when the dialog provides those fields.", image: "/tutorials/patients.png", imageAlt: "Add useful history — Clinexus dental dashboard" },
          { title: "Save the record", body: "Complete the dialog to create the patient, then search for the name or patient ID to confirm it is listed.", image: "/tutorials/patients.png", imageAlt: "Save the record — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "use-a-patient-profile",
        title: "Use a Patient Profile",
        summary: "Find the full patient history without creating duplicate records.",
        duration: "7 min",
        level: "Beginner",
        steps: [
          { title: "Find the patient", body: "On Patients, search by name, ID or phone, then select the patient row or card.", image: "/tutorials/patients.png", imageAlt: "Find the patient — Clinexus dental dashboard" },
          { title: "Review the overview", body: "Use the profile overview to check contact details, outstanding balance and recent activity.", image: "/tutorials/patient-profile.png", imageAlt: "Review the overview — Clinexus dental dashboard" },
          { title: "Open the right record tab", body: "Move between Clinical Notes, treatment plans, billing, prescriptions and the other available patient tabs.", image: "/tutorials/patient-profile.png", imageAlt: "Open the right record tab — Clinexus dental dashboard" },
          { title: "Edit patient details", body: "Select the edit button in the profile header, update the information, and complete the Edit Patient dialog.", image: "/tutorials/patients.png", imageAlt: "Edit patient details — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "add-clinical-notes",
        title: "Add Clinical Notes to a Visit",
        summary: "Keep the patient's clinical story clear for every clinician who follows up.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open the patient profile", body: "Search Patients and select the patient whose visit you are documenting.", image: "/tutorials/patient-profile.png", imageAlt: "Open the patient profile — Clinexus dental dashboard" },
          { title: "Open Clinical Notes", body: "Choose the Clinical Notes or SOAP area in the profile.", image: "/tutorials/patient-profile.png", imageAlt: "Open Clinical Notes — Clinexus dental dashboard" },
          { title: "Document the visit", body: "Enter the relevant Subjective, Objective, Assessment and Plan information, along with any treatment details requested by the form.", image: "/tutorials/documents.png", imageAlt: "Document the visit — Clinexus dental dashboard" },
          { title: "Review before saving", body: "Check tooth numbers, surfaces and follow-up instructions, then save the note using the form's save action.", image: "/tutorials/patient-profile.png", imageAlt: "Review before saving — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "upload-patient-documents",
        title: "Upload a Patient Document",
        summary: "Store referrals, scans and other patient files with the right record.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open Documents", body: "Choose Documents from Administration and select Upload Document.", image: "/tutorials/documents.png", imageAlt: "Open Documents — Clinexus dental dashboard" },
          { title: "Choose the patient and file", body: "In the Upload Document dialog, select the patient, choose the file and enter the document details requested.", image: "/tutorials/patients.png", imageAlt: "Choose the patient and file — Clinexus dental dashboard" },
          { title: "Complete the upload", body: "Finish the dialog to attach the document to the patient record.", image: "/tutorials/documents.png", imageAlt: "Complete the upload — Clinexus dental dashboard" },
          { title: "Watch expiry alerts", body: "Return to Documents to review expiry alerts and remove a file with its delete action when it should no longer be kept.", image: "/tutorials/documents.png", imageAlt: "Watch expiry alerts — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "create-and-sign-consent",
        title: "Create and Sign a Consent Form",
        summary: "Prepare a consent form, connect it to a patient and record the signature.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Consent Forms", body: "Choose Consent Forms from Clinical and stay on Patient Consents for patient records.", image: "/tutorials/consent-forms.png", imageAlt: "Open Consent Forms — Clinexus dental dashboard" },
          { title: "Create the consent", body: "Select the create consent action, choose the patient and template, and complete the form details.", image: "/tutorials/consent-forms.png", imageAlt: "Create the consent — Clinexus dental dashboard" },
          { title: "Sign the form", body: "Open the patient consent and select Sign to record the patient's completed consent.", image: "/tutorials/consent-forms.png", imageAlt: "Sign the form — Clinexus dental dashboard" },
          { title: "Keep templates ready", body: "Use Templates and select New Template to create a reusable form. Use Upload Scanned or Import Templates when you already have forms outside the app.", image: "/tutorials/consent-forms.png", imageAlt: "Keep templates ready — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "appointments",
    title: "Appointments & Scheduling",
    description: "Booking flows, calendars, reminders and no-show handling.",
    tutorials: [
      {
        slug: "book-an-appointment",
        title: "Book an Appointment",
        summary: "Place a patient into the correct chair, service and time slot.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Appointments", body: "Choose Appointments from Patient Care and select Book Appointment.", image: "/tutorials/appointments.png", imageAlt: "Open Appointments — Clinexus dental dashboard" },
          { title: "Choose the patient and service", body: "Select the patient, clinician, treatment or service, and any other required booking details.", image: "/tutorials/patients.png", imageAlt: "Choose the patient and service — Clinexus dental dashboard" },
          { title: "Choose the time", body: "Use the date and time controls to select an available slot. Check the day, week or month view if you need a wider view.", image: "/tutorials/appointments.png", imageAlt: "Choose the time — Clinexus dental dashboard" },
          { title: "Save the booking", body: "Complete the booking dialog, then confirm the appointment appears in Schedule View or List View.", image: "/tutorials/appointments.png", imageAlt: "Save the booking — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "handle-a-walk-in",
        title: "Handle a Walk-In Patient",
        summary: "Add an unplanned visit without losing the patient or appointment history.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open the walk-in flow", body: "On Appointments, select Walk-In.", image: "/tutorials/waiting-list.png", imageAlt: "Open the walk-in flow — Clinexus dental dashboard" },
          { title: "Find or add the patient", body: "Select an existing patient or complete the patient details requested by the Walk-In dialog.", image: "/tutorials/patients.png", imageAlt: "Find or add the patient — Clinexus dental dashboard" },
          { title: "Add the visit details", body: "Choose the clinician, service and any required timing or notes.", image: "/tutorials/waiting-list.png", imageAlt: "Add the visit details — Clinexus dental dashboard" },
          { title: "Complete check-in", body: "Finish the dialog so the patient appears in the day's appointments or waiting queue.", image: "/tutorials/waiting-list.png", imageAlt: "Complete check-in — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "check-in-and-call-patients",
        title: "Check In and Call Patients",
        summary: "Move patients from arrival to the treatment queue in the right order.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Check in from Appointments", body: "Find the appointment and select Check in when the patient arrives.", image: "/tutorials/waiting-list.png", imageAlt: "Check in from Appointments — Clinexus dental dashboard" },
          { title: "Open Waiting List", body: "Choose Waiting List to see the queue and its Waiting, Called, In Progress and Completed counts.", image: "/tutorials/waiting-list.png", imageAlt: "Open Waiting List — Clinexus dental dashboard" },
          { title: "Call the next patient", body: "Select Call Next to move the next patient forward, or use Check In to add a patient directly to the queue.", image: "/tutorials/patients.png", imageAlt: "Call the next patient — Clinexus dental dashboard" },
          { title: "Finish the visit state", body: "Update the patient as they move through the queue so the team always sees who is waiting and who is being treated.", image: "/tutorials/waiting-list.png", imageAlt: "Finish the visit state — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "set-staff-schedules",
        title: "Set Staff Schedules",
        summary: "Make real availability visible before your team books appointments.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Schedules", body: "Choose Schedules from Patient Care and select a staff member.", image: "/tutorials/schedules.png", imageAlt: "Open Schedules — Clinexus dental dashboard" },
          { title: "Set working days", body: "Use the day controls to turn each working day on or off.", image: "/tutorials/schedules.png", imageAlt: "Set working days — Clinexus dental dashboard" },
          { title: "Enter working hours", body: "Set the start and end times for each working day in the weekly grid.", image: "/tutorials/schedules.png", imageAlt: "Enter working hours — Clinexus dental dashboard" },
          { title: "Add breaks", body: "Block break periods so those times are not offered as available appointment slots.", image: "/tutorials/schedules.png", imageAlt: "Add breaks — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "clinical-flow",
    title: "Clinical Workflow",
    description: "From check-in to consultation, treatment notes and follow-up.",
    tutorials: [
      {
        slug: "update-a-dental-chart",
        title: "Update a Dental Chart",
        summary: "Record tooth conditions and procedures using the interactive chart.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Select the patient", body: "Open Dental Charts and use Select patient to load the correct chart.", image: "/tutorials/patients.png", imageAlt: "Select the patient — Clinexus dental dashboard" },
          { title: "Choose a tooth", body: "Select the tooth on the adult FDI chart, then review its current condition and history.", image: "/tutorials/dental-charts.png", imageAlt: "Choose a tooth — Clinexus dental dashboard" },
          { title: "Add a procedure", body: "Select Add Procedure, choose the category and procedure, and enter the tooth, surface or other clinical details.", image: "/tutorials/dental-charts.png", imageAlt: "Add a procedure — Clinexus dental dashboard" },
          { title: "Save the entry", body: "Select Save Procedure or Add Entry, depending on the form, then check the procedure history for the new record.", image: "/tutorials/dental-charts.png", imageAlt: "Save the entry — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "create-a-treatment-plan",
        title: "Create a Treatment Plan",
        summary: "Turn planned dental work into a clear sequence of visits and costs.",
        duration: "10 min",
        level: "Intermediate",
        steps: [
          { title: "Open Treatment Plans", body: "In Treatments & Procedures, choose the Treatment Plans tab and select New Treatment Plan.", image: "/tutorials/treatments.png", imageAlt: "Open Treatment Plans — Clinexus dental dashboard" },
          { title: "Add the plan details", body: "Choose the patient, enter the Plan name, select a Priority and set a Target End Date when one is known.", image: "/tutorials/treatments.png", imageAlt: "Add the plan details — Clinexus dental dashboard" },
          { title: "Add visits", body: "Select Add Visit and enter the treatment, tooth number, visit number, estimated cost and scheduled date for each part of the plan.", image: "/tutorials/treatments.png", imageAlt: "Add visits — Clinexus dental dashboard" },
          { title: "Review progress", body: "Open the plan card to track Pending, Scheduled, In-progress or Skipped items.", image: "/tutorials/treatments.png", imageAlt: "Review progress — Clinexus dental dashboard" },
          { title: "Close the plan", body: "Use Pause Plan or Complete Plan when the treatment status changes. Cancel a plan only when it will not continue.", image: "/tutorials/treatments.png", imageAlt: "Close the plan — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "write-a-prescription",
        title: "Create a Prescription",
        summary: "Record medication instructions from the patient's clinical workflow.",
        duration: "6 min",
        level: "Intermediate",
        steps: [
          { title: "Open Prescriptions", body: "Choose Prescriptions from Clinical and select New Prescription.", image: "/tutorials/prescriptions.png", imageAlt: "Open Prescriptions — Clinexus dental dashboard" },
          { title: "Choose the patient", body: "Select the patient whose prescription you are preparing.", image: "/tutorials/patients.png", imageAlt: "Choose the patient — Clinexus dental dashboard" },
          { title: "Enter the prescription", body: "Add the medicine, dosage, frequency, duration and instructions requested by the form.", image: "/tutorials/prescriptions.png", imageAlt: "Enter the prescription — Clinexus dental dashboard" },
          { title: "Save and print", body: "Complete the dialog to save the prescription, then use its print action when the patient needs a paper copy.", image: "/tutorials/prescriptions.png", imageAlt: "Save and print — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "create-a-lab-case",
        title: "Create a Dental Lab Case",
        summary: "Send crowns, bridges, dentures and other lab work through its status pipeline.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Lab Work", body: "Open the Lab Work screen from the clinic dashboard when your clinic uses lab cases.", image: "/tutorials/lab-work.png", imageAlt: "Open Lab Work — Clinexus dental dashboard" },
          { title: "Start a case", body: "Select New Lab Case, choose the patient, lab work type and laboratory.", image: "/tutorials/lab-work.png", imageAlt: "Start a case — Clinexus dental dashboard" },
          { title: "Add case requirements", body: "Enter shade or colour requirements, material preferences and any notes the laboratory needs.", image: "/tutorials/lab-work.png", imageAlt: "Add case requirements — Clinexus dental dashboard" },
          { title: "Move the case forward", body: "Use the case actions to move it through Pending, Sent, In Progress, Completed and Received.", image: "/tutorials/lab-work.png", imageAlt: "Move the case forward — Clinexus dental dashboard" },
          { title: "Share the case", body: "Use Send via WhatsApp or Send via Email when the laboratory needs the case details outside the dashboard.", image: "/tutorials/lab-work.png", imageAlt: "Share the case — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "complete-a-clinical-visit",
        title: "Complete a Clinical Visit",
        summary: "Connect check-in, charting, notes, treatment and follow-up in one workflow.",
        duration: "10 min",
        level: "Intermediate",
        steps: [
          { title: "Check the patient in", body: "Use Check in on the appointment or move the patient through Waiting List with Call Next.", image: "/tutorials/patients.png", imageAlt: "Check the patient in — Clinexus dental dashboard" },
          { title: "Review the record", body: "Open the patient profile, review the history, and check the dental chart before treatment.", image: "/tutorials/patient-profile.png", imageAlt: "Review the record — Clinexus dental dashboard" },
          { title: "Record care", body: "Add the procedure to the chart, update the treatment plan when needed, and write the clinical note.", image: "/tutorials/patient-profile.png", imageAlt: "Record care — Clinexus dental dashboard" },
          { title: "Finish the next step", body: "Create a prescription, consent or lab case when the visit requires it, then arrange the follow-up appointment.", image: "/tutorials/patient-profile.png", imageAlt: "Finish the next step — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "in-house-lab",
    title: "In-House Lab",
    description: "Run your own dental laboratory: cases, technicians, lab invoices and lab revenue rules.",
    tutorials: [
      {
        slug: "read-the-lab-dashboard",
        title: "Read the Lab Dashboard",
        summary: "See the whole laboratory at a glance: case counts, revenue, urgent work and overdue cases.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Lab Dashboard", body: "Choose Lab Dashboard from the In-House Lab group. The Live badge in the corner shows the figures refresh as your team works.", image: "/tutorials/lab-dashboard.png", imageAlt: "Lab Dashboard — Clinexus dental dashboard" },
          { title: "Check the case counters", body: "The four cards across the top show Total Cases, In Progress, Ready and Urgent. Use them each morning to see what the lab is carrying.", image: "/tutorials/lab-dashboard.png", imageAlt: "Lab case counters — Clinexus dental dashboard" },
          { title: "Review lab revenue", body: "The Lab Revenue card shows Total Revenue, This Month, Collected and Outstanding, with a Payment Collection bar. These figures stay independent from clinic finances.", image: "/tutorials/lab-dashboard.png", imageAlt: "Lab revenue card — Clinexus dental dashboard" },
          { title: "Watch the completion rate", body: "Completion Rate shows how many cases have been delivered out of the total. Pending, Delivered, Overdue and Unpaid tiles sit beside it.", image: "/tutorials/lab-dashboard.png", imageAlt: "Lab completion rate — Clinexus dental dashboard" },
          { title: "Clear urgent and overdue work", body: "Use the Urgent Cases and Overdue lists to see which patients are waiting, then open Lab Cases to move that work forward. Upcoming shows the due dates ahead.", image: "/tutorials/lab-dashboard.png", imageAlt: "Urgent and overdue lab cases — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "register-and-track-lab-cases",
        title: "Register and Track Lab Cases",
        summary: "Log every case on the board and move it from pending to delivered.",
        duration: "9 min",
        level: "Beginner",
        steps: [
          { title: "Open Lab Cases", body: "Choose Lab Cases from In-House Lab. Cases are shown as a board with four columns — Pending, In Progress, Ready and Delivered — and each column shows its count.", image: "/tutorials/lab-cases.png", imageAlt: "Lab Cases board — Clinexus dental dashboard" },
          { title: "Start a new case", body: "Select New Lab Case. Only five details are required: the patient, the dentist, the job instructions, the cost and the expected delivery date.", image: "/tutorials/lab-cases-new.png", imageAlt: "New Lab Case dialog — Clinexus dental dashboard" },
          { title: "Choose the job instructions", body: "Tick the work being made — for example PFM Crowns, Zirconia Crowns, Acrylic or Flexible Dentures, Shell Crowns, Orthodontic Appliances, Veneers, repairs or a courier charge.", image: "/tutorials/lab-cases-new.png", imageAlt: "Lab job instructions — Clinexus dental dashboard" },
          { title: "Enter cost and delivery date", body: "Type the cost in naira and pick the expected delivery date. Open More details (optional) to add shade, material notes, a discount or mark the case urgent.", image: "/tutorials/lab-cases-new.png", imageAlt: "Lab case cost and delivery date — Clinexus dental dashboard" },
          { title: "Register the case", body: "Select Register Lab Case. The case appears in the Pending column with its own case number, the patient's name, the fee and the due date.", image: "/tutorials/lab-cases.png", imageAlt: "Registered lab case on the board — Clinexus dental dashboard" },
          { title: "Move the case along", body: "As work starts, finishes and reaches the patient, move the case through In Progress, Ready and Delivered so the board always matches the bench.", image: "/tutorials/lab-cases.png", imageAlt: "Lab case status columns — Clinexus dental dashboard" },
          { title: "Watch urgent and late cases", body: "Urgent cases carry a red Urgent badge, and a due date that has passed turns red until the case is ready or delivered. Clear those first.", image: "/tutorials/lab-cases.png", imageAlt: "Urgent and overdue lab case cards — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "manage-lab-technicians",
        title: "Manage Lab Technicians",
        summary: "See who is on the bench and how much work each technician is carrying.",
        duration: "5 min",
        level: "Beginner",
        steps: [
          { title: "Open Technicians", body: "Choose Technicians from In-House Lab. Each technician appears as a card with their name, specialty and active status.", image: "/tutorials/lab-technicians.png", imageAlt: "Lab Technicians page — Clinexus dental dashboard" },
          { title: "Add technicians through Staff", body: "If the page is empty, open Staff and add the person with the lab technician or lab assistant role. They then appear here automatically.", image: "/tutorials/staff-add.png", imageAlt: "Adding a lab technician in Staff — Clinexus dental dashboard" },
          { title: "Read the workload tiles", body: "Every card shows Active, In Progress, Pending and Urgent case counts for that technician — a quick view of who is free and who is overloaded.", image: "/tutorials/lab-technicians.png", imageAlt: "Technician workload counts — Clinexus dental dashboard" },
          { title: "Balance the bench", body: "When one technician carries most of the urgent or pending work, reassign cases in Lab Cases before due dates start slipping.", image: "/tutorials/lab-cases.png", imageAlt: "Rebalancing lab cases — Clinexus dental dashboard" },
          { title: "Keep the list current", body: "Use Staff to update a technician's specialty or set them inactive when they leave, so the lab list always reflects your real team.", image: "/tutorials/staff-edit.png", imageAlt: "Updating a technician record — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "bill-lab-work",
        title: "Bill Lab Work",
        summary: "Raise lab invoices and track payments separately from clinic billing.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Lab Billing", body: "Choose Lab Billing from In-House Lab. The cards at the top show Total Lab Revenue, Paid, Outstanding and Unpaid Invoices — all separate from clinic billing.", image: "/tutorials/lab-billing.png", imageAlt: "Lab Billing page — Clinexus dental dashboard" },
          { title: "Create a lab invoice", body: "Select Create Lab Invoice and choose the lab case you are billing. The case details carry into the invoice.", image: "/tutorials/lab-billing-new.png", imageAlt: "Create Lab Invoice dialog — Clinexus dental dashboard" },
          { title: "Enter the amounts", body: "Fill in the subtotal, any discount and the amount already paid. Add a note when the clinic or patient needs an explanation on the invoice.", image: "/tutorials/lab-billing-new.png", imageAlt: "Lab invoice amounts — Clinexus dental dashboard" },
          { title: "Save the invoice", body: "Select Create Invoice. It appears in the Lab Invoices table with the clinic, patient, subtotal, discount, total, amount paid and status.", image: "/tutorials/lab-billing.png", imageAlt: "Lab invoices table — Clinexus dental dashboard" },
          { title: "Record payments as they arrive", body: "Use the action on an invoice row to record what has been paid. The status and the Outstanding figure update straight away.", image: "/tutorials/lab-billing.png", imageAlt: "Recording a lab payment — Clinexus dental dashboard" },
          { title: "Chase what is unpaid", body: "Check the Unpaid Invoices count regularly and follow up on the rows that are still outstanding before the month closes.", image: "/tutorials/lab-billing.png", imageAlt: "Unpaid lab invoices — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "set-lab-allocation-rules",
        title: "Set Lab Allocation Rules",
        summary: "Decide how lab income is split between materials, technicians, running costs and profit.",
        duration: "6 min",
        level: "Intermediate",
        steps: [
          { title: "Open Lab Settings", body: "Choose Lab Settings from In-House Lab. The page shows Total Lab Revenue, This Month and Outstanding above the allocation rules.", image: "/tutorials/lab-settings.png", imageAlt: "Lab Settings page — Clinexus dental dashboard" },
          { title: "Review the current split", body: "Lab Allocation Rules lists each category with its percentage — for example Materials & Consumables, Technician Commission, Lab Operations, Equipment & Maintenance and Overhead & Profit.", image: "/tutorials/lab-settings.png", imageAlt: "Lab allocation rules — Clinexus dental dashboard" },
          { title: "Edit the percentages", body: "Select Edit and change the percentage beside each category to match how your lab actually spends its income.", image: "/tutorials/lab-settings-edit.png", imageAlt: "Editing lab allocation percentages — Clinexus dental dashboard" },
          { title: "Make the total 100%", body: "The Total row must reach exactly 100% before the changes can be saved. Adjust the categories until the total is right, then select Save.", image: "/tutorials/lab-settings-edit.png", imageAlt: "Lab allocation total — Clinexus dental dashboard" },
          { title: "Keep lab and clinic apart", body: "These rules only apply to lab income. Clinic revenue is still split by the rules on the Revenue Allocation page under Finance.", image: "/tutorials/revenue-allocation.png", imageAlt: "Clinic revenue allocation — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "billing",
    title: "Billing & Payments",
    description: "Invoices, payments, expenses and financial reporting.",
    tutorials: [
      {
        slug: "create-and-send-an-invoice",
        title: "Create and Send an Invoice",
        summary: "Turn completed dental work into a clear invoice for the patient.",
        duration: "7 min",
        level: "Beginner",
        steps: [
          { title: "Open Billing", body: "Choose Billing from Finance and select Create Invoice.", image: "/tutorials/billing.png", imageAlt: "Open Billing — Clinexus dental dashboard" },
          { title: "Choose the patient", body: "Select the patient and add the treatments, products or other billable items.", image: "/tutorials/patients.png", imageAlt: "Choose the patient — Clinexus dental dashboard" },
          { title: "Review the totals", body: "Check quantities, prices, discounts and the amount due before completing the invoice.", image: "/tutorials/billing.png", imageAlt: "Review the totals — Clinexus dental dashboard" },
          { title: "Create the invoice", body: "Complete the Create Invoice dialog, then find the new invoice in the billing list.", image: "/tutorials/billing.png", imageAlt: "Create the invoice — Clinexus dental dashboard" },
          { title: "Share the invoice", body: "Open the invoice detail and use the available sharing or sending action when the patient needs a copy.", image: "/tutorials/billing.png", imageAlt: "Share the invoice — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "record-a-payment-and-statement",
        title: "Record a Payment and Client Statement",
        summary: "Keep balances accurate and give patients a useful view of what they owe.",
        duration: "7 min",
        level: "Beginner",
        steps: [
          { title: "Find the invoice", body: "Use Billing search and the status filter to find the patient's invoice, then open its detail.", image: "/tutorials/billing.png", imageAlt: "Find the invoice — Clinexus dental dashboard" },
          { title: "Record the payment", body: "Use the invoice detail payment action to enter the amount and payment information, including a part-payment when needed.", image: "/tutorials/billing.png", imageAlt: "Record the payment — Clinexus dental dashboard" },
          { title: "Check the balance", body: "Confirm that the invoice status and outstanding balance reflect the payment.", image: "/tutorials/billing.png", imageAlt: "Check the balance — Clinexus dental dashboard" },
          { title: "Create a statement", body: "Return to Billing and select Client Statement, choose the patient and complete the statement dialog.", image: "/tutorials/billing.png", imageAlt: "Create a statement — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "prepare-a-treatment-estimate",
        title: "Prepare a Treatment Estimate",
        summary: "Give a patient a proposed cost before treatment starts.",
        duration: "8 min",
        level: "Intermediate",
        steps: [
          { title: "Open Estimates", body: "Choose Estimates from Finance and select New Estimate.", image: "/tutorials/estimates.png", imageAlt: "Open Estimates — Clinexus dental dashboard" },
          { title: "Choose the patient", body: "Select the patient and add the proposed services with Add Item.", image: "/tutorials/patients.png", imageAlt: "Choose the patient — Clinexus dental dashboard" },
          { title: "Review the estimate", body: "Check the treatment items, quantities, prices and total before completing New Treatment Estimate.", image: "/tutorials/estimates.png", imageAlt: "Review the estimate — Clinexus dental dashboard" },
          { title: "Send it to the patient", body: "Use Send on the estimate when it is ready for review.", image: "/tutorials/patients.png", imageAlt: "Send it to the patient — Clinexus dental dashboard" },
          { title: "Continue after a decision", body: "Use Accept or Decline to record the response. Convert an accepted estimate to an invoice when treatment is ready to bill.", image: "/tutorials/estimates.png", imageAlt: "Continue after a decision — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "set-up-a-payment-plan",
        title: "Set Up a Payment Plan",
        summary: "Split an eligible invoice into manageable installments and track each one.",
        duration: "7 min",
        level: "Intermediate",
        steps: [
          { title: "Open Payment Plans", body: "Choose Payment Plans from Finance and select Create Plan.", image: "/tutorials/payment-plans.png", imageAlt: "Open Payment Plans — Clinexus dental dashboard" },
          { title: "Link the invoice", body: "In Create Payment Plan, select the invoice and enter the installment schedule requested by the patient.", image: "/tutorials/billing.png", imageAlt: "Link the invoice — Clinexus dental dashboard" },
          { title: "Create the plan", body: "Complete the dialog and check that the plan appears with its active installments.", image: "/tutorials/payment-plans.png", imageAlt: "Create the plan — Clinexus dental dashboard" },
          { title: "Record installments", body: "When a payment arrives, select Mark Paid on the matching installment.", image: "/tutorials/payment-plans.png", imageAlt: "Record installments — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "record-expenses-and-commissions",
        title: "Record Expenses and Commissions",
        summary: "Keep operating costs and team payouts visible alongside revenue.",
        duration: "10 min",
        level: "Intermediate",
        steps: [
          { title: "Add an expense", body: "Open Expenses, select Add Expense, and enter the vendor, category, amount and date.", image: "/tutorials/expenses.png", imageAlt: "Add an expense — Clinexus dental dashboard" },
          { title: "Save and review", body: "Complete the Add Expense dialog, then use search and category filters to find the saved expense.", image: "/tutorials/expenses.png", imageAlt: "Save and review — Clinexus dental dashboard" },
          { title: "Create a payout", body: "If you manage commissions, open Commissions and select New Payout. Enter the staff member, amount and related details.", image: "/tutorials/expenses.png", imageAlt: "Create a payout — Clinexus dental dashboard" },
          { title: "Record payment", body: "Open the payout and select Record Payment when the commission has been paid.", image: "/tutorials/billing.png", imageAlt: "Record payment — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "configure-revenue-allocation",
        title: "Configure Revenue Allocation",
        summary: "Set the rules that split clinic revenue between staff and the reserve.",
        duration: "8 min",
        level: "Advanced",
        steps: [
          { title: "Open Revenue Allocation", body: "Choose Revenue Allocation from Finance. This area is available to owners and admins.", image: "/tutorials/revenue-allocation.png", imageAlt: "Open Revenue Allocation — Clinexus dental dashboard" },
          { title: "Review the snapshot", body: "Check Total Revenue, Revenue This Month and the War Chest reserve before changing a rule.", image: "/tutorials/revenue-allocation.png", imageAlt: "Review the snapshot — Clinexus dental dashboard" },
          { title: "Turn automatic splitting on or off", body: "Use the auto-split toggle to control whether new revenue follows the allocation rules.", image: "/tutorials/revenue-allocation.png", imageAlt: "Turn automatic splitting on or off — Clinexus dental dashboard" },
          { title: "Edit the allocation rules", body: "Use the edit action, update the percentages so they total 100%, then save the rule.", image: "/tutorials/revenue-allocation.png", imageAlt: "Edit the allocation rules — Clinexus dental dashboard" },
          { title: "Review staff shares", body: "Edit staff sub-splits when needed, save the changes and confirm the summary reflects the new allocation.", image: "/tutorials/staff.png", imageAlt: "Review staff shares — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "inventory",
    title: "Inventory & Supplies",
    description: "Stock items, reorder levels, suppliers and expiry tracking.",
    tutorials: [
      {
        slug: "add-and-maintain-stock",
        title: "Add and Maintain Stock",
        summary: "Keep consumables and equipment counts accurate during daily work.",
        duration: "8 min",
        level: "Beginner",
        steps: [
          { title: "Add an item", body: "Open Inventory and select Add Item. Enter the item name, quantity, reorder level and other required details.", image: "/tutorials/inventory.png", imageAlt: "Add an item — Clinexus dental dashboard" },
          { title: "Save the item", body: "Complete the Add Inventory Item dialog, then confirm the item appears in the stock table.", image: "/tutorials/inventory.png", imageAlt: "Save the item — Clinexus dental dashboard" },
          { title: "Restock an item", body: "Use Restock on the relevant row, enter the received quantity in Restock Item, and complete the dialog.", image: "/tutorials/inventory.png", imageAlt: "Restock an item — Clinexus dental dashboard" },
          { title: "Record usage", body: "Use Use on the relevant row, enter the quantity consumed and confirm the Use Stock action.", image: "/tutorials/inventory.png", imageAlt: "Record usage — Clinexus dental dashboard" },
          { title: "Watch low stock", body: "Review the low-stock alert banner and restock items before a procedure is affected.", image: "/tutorials/inventory.png", imageAlt: "Watch low stock — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "manage-suppliers",
        title: "Manage Suppliers",
        summary: "Keep supplier contacts ready for reorders and purchase orders.",
        duration: "6 min",
        level: "Beginner",
        steps: [
          { title: "Open Suppliers", body: "Choose Suppliers from Inventory & Supply and select Add Supplier.", image: "/tutorials/suppliers.png", imageAlt: "Open Suppliers — Clinexus dental dashboard" },
          { title: "Enter supplier details", body: "Add the company or supplier name, contact, phone, email and notes in the Add Supplier form.", image: "/tutorials/suppliers.png", imageAlt: "Enter supplier details — Clinexus dental dashboard" },
          { title: "Save the supplier", body: "Complete the form and confirm the supplier appears in the list.", image: "/tutorials/suppliers.png", imageAlt: "Save the supplier — Clinexus dental dashboard" },
          { title: "Keep the list current", body: "Update the active or inactive status and remove a supplier only when it should no longer be used.", image: "/tutorials/suppliers.png", imageAlt: "Keep the list current — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "create-a-purchase-order",
        title: "Create and Receive a Purchase Order",
        summary: "Order supplies and update stock when they arrive.",
        duration: "9 min",
        level: "Intermediate",
        steps: [
          { title: "Start a purchase order", body: "Open Purchase Orders and select New PO or Create Order.", image: "/tutorials/purchase-orders.png", imageAlt: "Start a purchase order — Clinexus dental dashboard" },
          { title: "Choose the supplier and items", body: "Select the supplier, add the stock items and enter the quantities requested.", image: "/tutorials/suppliers.png", imageAlt: "Choose the supplier and items — Clinexus dental dashboard" },
          { title: "Save the order", body: "Complete the New Purchase Order dialog and check that the order is in draft status.", image: "/tutorials/purchase-orders.png", imageAlt: "Save the order — Clinexus dental dashboard" },
          { title: "Send the order", body: "Select Mark Ordered when the purchase order has been sent to the supplier.", image: "/tutorials/purchase-orders.png", imageAlt: "Send the order — Clinexus dental dashboard" },
          { title: "Receive the stock", body: "When the delivery arrives, select Mark Received or Received. Confirm that the inventory quantity updates.", image: "/tutorials/inventory.png", imageAlt: "Receive the stock — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "map-treatment-materials",
        title: "Map Treatment Materials",
        summary: "Connect procedures to the stock items they consume.",
        duration: "7 min",
        level: "Intermediate",
        steps: [
          { title: "Open Treatment Materials", body: "Choose Treatment Materials from Inventory & Supply.", image: "/tutorials/treatment-materials.png", imageAlt: "Open Treatment Materials — Clinexus dental dashboard" },
          { title: "Add a mapping", body: "Select Add Mapping or Link a material, then choose the treatment and stock item.", image: "/tutorials/treatment-materials.png", imageAlt: "Add a mapping — Clinexus dental dashboard" },
          { title: "Set the quantity", body: "Enter the quantity used for one procedure so the clinic can track consumption consistently.", image: "/tutorials/treatment-materials.png", imageAlt: "Set the quantity — Clinexus dental dashboard" },
          { title: "Save and review", body: "Complete Map Treatment to Material and check the mapping list. Remove a link only when the treatment no longer uses that item.", image: "/tutorials/treatment-materials.png", imageAlt: "Save and review — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "record-inventory-costs",
        title: "Record Inventory Costs",
        summary: "Capture supply transactions so costs and stock movements stay traceable.",
        duration: "6 min",
        level: "Intermediate",
        steps: [
          { title: "Open Inventory Costs", body: "Choose Inventory Costs from Inventory & Supply.", image: "/tutorials/inventory-costs.png", imageAlt: "Open Inventory Costs — Clinexus dental dashboard" },
          { title: "Start a transaction", body: "Select Record Inventory Transaction and choose the item and transaction type.", image: "/tutorials/inventory-costs.png", imageAlt: "Start a transaction — Clinexus dental dashboard" },
          { title: "Enter the cost details", body: "Add the quantity, amount, date and notes requested by the dialog.", image: "/tutorials/inventory-costs.png", imageAlt: "Enter the cost details — Clinexus dental dashboard" },
          { title: "Save and verify", body: "Complete the dialog, then check the transaction list and the item's current stock or cost information.", image: "/tutorials/inventory-costs.png", imageAlt: "Save and verify — Clinexus dental dashboard" },
        ],
      },
    ],
  },
  {
    slug: "reports",
    title: "Reports & Insights",
    description: "Understanding your dashboard metrics and exporting reports.",
    tutorials: [
      {
        slug: "run-a-clinic-report",
        title: "Run a Clinic Report",
        summary: "Compare revenue, treatments, patients and team performance for a selected period.",
        duration: "7 min",
        level: "Beginner",
        steps: [
          { title: "Open Reports", body: "Choose Reports from the Reports group.", image: "/tutorials/reports.png", imageAlt: "Open Reports — Clinexus dental dashboard" },
          { title: "Choose the date range", body: "Set the From and To dates or months for the period you want to review.", image: "/tutorials/reports.png", imageAlt: "Choose the date range — Clinexus dental dashboard" },
          { title: "Read the key numbers", body: "Review the KPI cards, revenue trend, treatment mix and dentist performance table.", image: "/tutorials/reports.png", imageAlt: "Read the key numbers — Clinexus dental dashboard" },
          { title: "Export the results", body: "Select Export or Export CSV to download the report for sharing or further review.", image: "/tutorials/reports.png", imageAlt: "Export the results — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "use-advanced-analytics",
        title: "Use Advanced Analytics",
        summary: "Explore deeper clinic performance views when standard reports are not enough.",
        duration: "8 min",
        level: "Advanced",
        steps: [
          { title: "Open Advanced Analytics", body: "Choose Advanced Analytics from the Reports group. Access is limited to the roles allowed by your clinic.", image: "/tutorials/analytics.png", imageAlt: "Open Advanced Analytics — Clinexus dental dashboard" },
          { title: "Start with the overview", body: "Review the available dashboards and headline metrics before narrowing your investigation.", image: "/tutorials/analytics.png", imageAlt: "Start with the overview — Clinexus dental dashboard" },
          { title: "Compare the charts", body: "Use the displayed charts to compare revenue, activity and performance across the available periods or categories.", image: "/tutorials/analytics.png", imageAlt: "Compare the charts — Clinexus dental dashboard" },
          { title: "Turn an insight into action", body: "Use the result to adjust schedules, treatment catalogues, stock levels or follow-up work, then review the next reporting period.", image: "/tutorials/analytics.png", imageAlt: "Turn an insight into action — Clinexus dental dashboard" },
        ],
      },
      {
        slug: "review-profitability",
        title: "Review Profitability",
        summary: "Understand how revenue, expenses and margins are shaping the clinic.",
        duration: "6 min",
        level: "Advanced",
        steps: [
          { title: "Open Profitability", body: "Choose Profitability from Finance when your role has access to the page.", image: "/tutorials/profitability.png", imageAlt: "Open Profitability — Clinexus dental dashboard" },
          { title: "Compare revenue and expenses", body: "Review the revenue, expense and margin views to see what is driving the current result.", image: "/tutorials/expenses.png", imageAlt: "Compare revenue and expenses — Clinexus dental dashboard" },
          { title: "Look for patterns", body: "Compare the treatment, staff or period details shown on the page to identify areas that need attention.", image: "/tutorials/profitability.png", imageAlt: "Look for patterns — Clinexus dental dashboard" },
          { title: "Follow up in the source screen", body: "Use Billing, Expenses, Treatments or Reports to investigate the record behind an unexpected result.", image: "/tutorials/profitability.png", imageAlt: "Follow up in the source screen — Clinexus dental dashboard" },
        ],
      },
    ],
  },
];

export const tutorialClinicTypes: ClinicTutorialType[] = [
  {
    slug: "dental-clinics",
    name: "Dental Clinics",
    tagline: "Set up charting, treatment plans and recalls.",
    description:
      "Step-by-step guides for dental practices: from first login to running multi-visit treatment plans, recalls and billing.",
    icon: "Smile",
    sections: dentalSections(),
  },
  {
    slug: "eye-clinics",
    name: "Eye Care & Optometry",
    tagline: "Set up refraction records, lens inventory and referrals.",
    description:
      "Step-by-step guides for optometry and eye care practices: prescriptions, visual acuity records, lens stock and referrals.",
    icon: "Eye",
    sections: eyeSections(),
  },
];

export const getClinicType = (slug?: string) =>
  tutorialClinicTypes.find((c) => c.slug === slug);

export const getSection = (clinicSlug?: string, sectionSlug?: string) =>
  getClinicType(clinicSlug)?.sections.find((s) => s.slug === sectionSlug);

export const getTutorial = (
  clinicSlug?: string,
  sectionSlug?: string,
  tutorialSlug?: string,
) => getSection(clinicSlug, sectionSlug)?.tutorials.find((t) => t.slug === tutorialSlug);

export const countTutorials = (clinic: ClinicTutorialType) =>
  clinic.sections.reduce((total, section) => total + section.tutorials.length, 0);
