import type { TourMap } from "@/components/dashboard/tour/types";

export const financeTours: TourMap = {
  billing: {
    title: "Billing & Payments",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Billing & Payments",
        body: "This page is where you create invoices and keep track of what patients owe and have paid.",
      },
      {
        target: '[data-tour="billing-stats"]',
        title: "Money at a glance",
        body: "These cards show cash collected today, how much is still owed, and how many invoices are overdue.",
      },
      {
        target: '[data-tour="billing-create-invoice"]',
        title: "Create an invoice",
        body: "Click here to bill a patient. Pick the patient and add the treatments they received.",
      },
      {
        target: '[data-tour="billing-statement"]',
        title: "Client statement",
        body: "Generate a summary of all invoices and payments for one patient over a date range.",
      },
      {
        target: '[data-tour="billing-search"]',
        title: "Find an invoice",
        body: "Search by patient name or invoice number to quickly locate a bill.",
      },
      {
        target: '[data-tour="billing-filters"]',
        title: "Filter by status",
        body: "Narrow the list down to only Paid, Pending, or Partial invoices.",
      },
      {
        target: '[data-tour="billing-table"]',
        title: "Invoice list",
        body: "Click any invoice row to view its details and record a payment against it.",
      },
    ],
  },

  estimates: {
    title: "Treatment Estimates",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Treatment Estimates",
        body: "Use estimates to give patients a cost breakdown before they commit to treatment.",
      },
      {
        target: '[data-tour="estimates-stats"]',
        title: "Estimate overview",
        body: "See how many estimates you've created, how much value is still pending, and your acceptance rate.",
      },
      {
        target: '[data-tour="estimates-new"]',
        title: "Create an estimate",
        body: "Click here to start a new estimate for a patient and add the treatments they're considering.",
      },
      {
        target: '[data-tour="estimates-search"]',
        title: "Search estimates",
        body: "Look up an estimate by patient name or estimate number.",
      },
      {
        target: '[data-tour="estimates-table"]',
        title: "Estimate list",
        body: "All estimates appear here with their current status, from draft to accepted or declined.",
      },
      {
        target: '[data-tour="estimates-actions"]',
        title: "Move estimates forward",
        body: "Send an estimate to the patient, mark it accepted or declined, or convert an accepted one straight into an invoice.",
      },
    ],
  },

  "payment-plans": {
    title: "Payment Plans",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Payment Plans",
        body: "Set up installment schedules for patients who need to pay for treatment over time.",
      },
      {
        target: '[data-tour="payment-plans-stats"]',
        title: "Plan overview",
        body: "See how many plans are active, how much is still outstanding, and how many plans are fully paid off.",
      },
      {
        target: '[data-tour="payment-plans-create"]',
        title: "Create a plan",
        body: "Click here to link an existing invoice to a new installment schedule for a patient.",
      },
      {
        target: '[data-tour="payment-plans-list"]',
        title: "All payment plans",
        body: "Click on any plan in this list to see its installment schedule and payment history.",
      },
      {
        target: '[data-tour="payment-plans-installments"]',
        title: "Track installments",
        body: "Once a plan is selected, mark each installment as paid here as the patient pays.",
      },
    ],
  },

  expenses: {
    title: "Expenses",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Expenses",
        body: "Record everything the clinic spends money on, from supplies to salaries.",
      },
      {
        target: '[data-tour="expenses-stats"]',
        title: "Spending summary",
        body: "These cards show your total expenses and how much you've spent so far this month.",
      },
      {
        target: '[data-tour="expenses-add"]',
        title: "Add an expense",
        body: "Click here to log a new expense with its vendor, category, amount, and date.",
      },
      {
        target: '[data-tour="expenses-search"]',
        title: "Search expenses",
        body: "Find an expense quickly by vendor name or description.",
      },
      {
        target: '[data-tour="expenses-category-filter"]',
        title: "Filter by category",
        body: "View only expenses from a specific category, like rent or supplies.",
      },
      {
        target: '[data-tour="expenses-table"]',
        title: "Expense history",
        body: "All recorded expenses appear here, sorted with the most recent first.",
      },
    ],
  },

  "revenue-allocation": {
    title: "Revenue Allocation",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Revenue Allocation",
        body: "This page controls how every payment received is automatically split across operations, staff, savings, and reserves.",
      },
      {
        target: '[data-tour="revenue-allocation-toggle"]',
        title: "Turn the system on or off",
        body: "Use this switch to enable or disable automatic revenue splitting for new payments.",
      },
      {
        target: '[data-tour="revenue-allocation-summary"]',
        title: "Revenue snapshot",
        body: "See total revenue, this month's revenue, and how much has built up in the War Chest reserve.",
      },
      {
        target: '[data-tour="revenue-allocation-rules"]',
        title: "Set allocation percentages",
        body: "Adjust what percentage of each payment goes to categories like operations, savings, and investors. The percentages must add up to 100%.",
      },
      {
        target: '[data-tour="revenue-allocation-staff"]',
        title: "Split staff operations",
        body: "Decide how the operations budget is further divided among staff roles.",
      },
      {
        target: '[data-tour="revenue-allocation-warchest"]',
        title: "War Chest reserve",
        body: "This is a savings fund built from excess payments, kept aside for emergencies or pro-bono care.",
      },
    ],
  },

  reports: {
    title: "Reports",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Reports",
        body: "Explore your clinic's performance — revenue, patients, and staff — over any time period.",
      },
      {
        target: '[data-tour="reports-date-range"]',
        title: "Choose a date range",
        body: "Pick a From and To month to focus all the charts and numbers on a specific period.",
      },
      {
        target: '[data-tour="reports-export"]',
        title: "Export data",
        body: "Download the revenue figures as a CSV file to share or analyse further.",
      },
      {
        target: '[data-tour="reports-kpis"]',
        title: "Key numbers",
        body: "These cards summarise the most important metrics for your selected period at a glance.",
      },
      {
        target: '[data-tour="reports-revenue-trend"]',
        title: "Revenue over time",
        body: "This chart shows how revenue has moved month by month, helping you spot busy and slow periods.",
      },
      {
        target: '[data-tour="reports-treatment-mix"]',
        title: "Popular treatments",
        body: "See which procedures are performed most often and bring in the most revenue.",
      },
      {
        target: '[data-tour="reports-dentist-performance"]',
        title: "Staff performance",
        body: "Compare how many appointments and how much revenue each dentist generated.",
      },
    ],
  },
};
