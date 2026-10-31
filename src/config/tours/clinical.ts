import type { TourMap } from "@/components/dashboard/tour/types";

export const clinicalTours: TourMap = {
  dashboard: {
    title: "Dashboard",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to your dashboard",
        body: "This is your home screen. It gives you a quick snapshot of what's happening in the clinic today.",
      },
      {
        target: '[data-tour="dashboard-quick-actions"]',
        title: "Quick actions",
        body: "Jump straight into common tasks like registering a patient, booking an appointment, or creating an invoice.",
      },
      {
        target: '[data-tour="dashboard-kpi-cards"]',
        title: "Key numbers at a glance",
        body: "See your total patients, today's appointments, pending payments, and monthly revenue in one row.",
      },
      {
        target: '[data-tour="dashboard-insight-widgets"]',
        title: "Today's insights",
        body: "Check who's up next, how today's appointments are progressing, and how revenue is tracking this month.",
      },
      {
        target: '[data-tour="dashboard-revenue-chart"]',
        title: "Revenue trend",
        body: "This chart shows how your revenue has changed over recent months, so you can spot patterns.",
      },
      {
        target: '[data-tour="dashboard-treatment-breakdown"]',
        title: "Popular treatments",
        body: "See which treatments are most common at your clinic right now.",
      },
      {
        target: '[data-tour="dashboard-today-schedule"]',
        title: "Today's schedule",
        body: "A running list of today's appointments, so you always know who's coming in next.",
      },
      {
        target: '[data-tour="dashboard-activity-feed"]',
        title: "Recent activity",
        body: "Keep track of the latest actions across the clinic, like new patients, payments, and prescriptions.",
      },
    ],
  },

  patients: {
    title: "Patients",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Manage your patients",
        body: "This page lists everyone registered at your clinic. From here you can search, filter, and add new patients.",
      },
      {
        target: '[data-tour="page-actions"]',
        title: "Add a new patient",
        body: "Click here to register a new patient. Fill in their basic details to get started.",
      },
      {
        target: '[data-tour="patients-search"]',
        title: "Search patients",
        body: "Type a name, ID, or phone number here to quickly find a specific patient.",
      },
      {
        target: '[data-tour="patients-filters"]',
        title: "Filter and sort",
        body: "Narrow the list down by status, or change how patients are ordered.",
      },
      {
        target: '[data-tour="patients-view-toggle"]',
        title: "Switch views",
        body: "Choose between a table view for details or a grid view for a quick visual scan.",
      },
      {
        target: '[data-tour="patients-list"]',
        title: "Patient list",
        body: "Click on any patient to open their full profile and see their history, appointments, and billing.",
      },
    ],
  },

  "patients/detail": {
    title: "Patient Profile",
    steps: [
      {
        target: '[data-tour="patients-detail-header"]',
        title: "Patient overview",
        body: "This is the patient's full profile, showing their name and current status at a glance.",
      },
      {
        target: '[data-tour="patients-detail-edit"]',
        title: "Edit patient details",
        body: "Click here to update the patient's personal information whenever it changes.",
      },
      {
        target: '[data-tour="patients-detail-balance"]',
        title: "Outstanding balance",
        body: "If the patient owes money, it will be shown here so you can follow up on payment.",
      },
      {
        target: '[data-tour="patients-detail-tabs"]',
        title: "Browse patient sections",
        body: "Switch between tabs to see dental history, treatment plans, billing, prescriptions, and more.",
      },
      {
        target: '[data-tour="patients-detail-overview"]',
        title: "Personal and medical info",
        body: "This tab shows core details like contact information, allergies, and medical history.",
      },
      {
        target: '[data-tour="patients-detail-notes"]',
        title: "Clinical notes",
        body: "Dentists can record SOAP notes here to track diagnosis and treatment over time.",
      },
    ],
  },

  appointments: {
    title: "Appointments",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Manage appointments",
        body: "This calendar shows all scheduled visits so you can plan the clinic's day, week, or month.",
      },
      {
        target: '[data-tour="page-actions"]',
        title: "Book or walk in a patient",
        body: "Use these buttons to book a new appointment or register a walk-in patient who has just arrived.",
      },
      {
        target: '[data-tour="appointments-tabs"]',
        title: "Schedule or list view",
        body: "Switch between a visual schedule and a simple list of appointments for the selected date.",
      },
      {
        target: '[data-tour="appointments-view-toggle"]',
        title: "Change the time range",
        body: "Pick Day, Week, or Month to see appointments over a different period.",
      },
      {
        target: '[data-tour="appointments-nav"]',
        title: "Move between dates",
        body: "Use these arrows, or the date picker, to jump to a different day, week, or month.",
      },
      {
        target: '[data-tour="appointments-calendar"]',
        title: "View appointment details",
        body: "Click on any appointment to see more details or update its status.",
      },
      {
        target: '[data-tour="appointments-status-legend"]',
        title: "Understand appointment colors",
        body: "Each color shows a different status, like scheduled, in progress, completed, or cancelled.",
      },
    ],
  },

  "waiting-list": {
    title: "Waiting List",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Track who's waiting",
        body: "This page shows patients who are currently at the clinic waiting to be seen.",
      },
      {
        target: '[data-tour="waiting-list-checkin"]',
        title: "Check in a patient",
        body: "Click here when a patient arrives to add them to the waiting queue.",
      },
      {
        target: '[data-tour="waiting-list-stats"]',
        title: "Queue summary",
        body: "See at a glance how many patients are waiting, being called, in progress, or completed today.",
      },
      {
        target: '[data-tour="waiting-list-queue"]',
        title: "The waiting queue",
        body: "This list shows everyone waiting, along with how long they've been here.",
      },
      {
        target: '[data-tour="waiting-list-call-next"]',
        title: "Call the next patient",
        body: "When a chair is free, click Call to move a patient forward in the process.",
      },
    ],
  },

  schedules: {
    title: "Staff Schedules",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Set staff availability",
        body: "This page controls when each dentist or hygienist is available for appointments.",
      },
      {
        target: '[data-tour="schedules-staff-select"]',
        title: "Choose a staff member",
        body: "Pick who you want to set a schedule for. Each person has their own weekly hours.",
      },
      {
        target: '[data-tour="schedules-week-grid"]',
        title: "Weekly overview",
        body: "This shows every day of the week for the selected staff member, so you can set their working pattern.",
      },
      {
        target: '[data-tour="schedules-day-toggle"]',
        title: "Turn a day on or off",
        body: "Toggle a day to mark it as working or a day off. Days that are off won't allow bookings.",
      },
      {
        target: '[data-tour="schedules-time-range"]',
        title: "Set working hours",
        body: "Enter the start and end times for the working day so appointments only fall within those hours.",
      },
      {
        target: '[data-tour="schedules-break"]',
        title: "Add a break",
        body: "Block out lunch or a break period so no appointments get booked during that time.",
      },
    ],
  },
};
