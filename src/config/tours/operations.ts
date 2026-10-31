import type { TourMap } from "@/components/dashboard/tour/types";

export const operationsTours: TourMap = {
  inventory: {
    title: "Inventory",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Inventory",
        body: "This page keeps track of every material and consumable your clinic keeps in stock.",
      },
      {
        target: '[data-tour="inventory-low-stock"]',
        title: "Low stock alerts",
        body: "Items that have fallen to or below their reorder level show up here so you can restock before you run out.",
      },
      {
        target: '[data-tour="inventory-add"]',
        title: "Add an item",
        body: "Click here to add a new stock item with its unit, cost, current quantity, and reorder level.",
      },
      {
        target: '[data-tour="inventory-table"]',
        title: "Your stock list",
        body: "Every item is listed here with how much is left and whether it needs attention.",
      },
      {
        target: '[data-tour="inventory-use"]',
        title: "Record usage",
        body: "When an item is used during treatment, log it here so the quantity in stock stays accurate.",
      },
      {
        target: '[data-tour="inventory-restock"]',
        title: "Restock an item",
        body: "After a delivery arrives, use this to add the new quantity back into stock.",
      },
      {
        target: '[data-tour="inventory-edit"]',
        title: "Edit item details",
        body: "Update an item's name, cost, or reorder level whenever things change.",
      },
    ],
  },
  suppliers: {
    title: "Suppliers",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Suppliers",
        body: "Keep the contact details of every vendor your clinic buys materials from in one place.",
      },
      {
        target: '[data-tour="suppliers-add"]',
        title: "Add a supplier",
        body: "Click here to register a new vendor you order from.",
      },
      {
        target: '[data-tour="suppliers-form"]',
        title: "Supplier details",
        body: "Fill in the company name, contact person, phone, email, and any notes about them.",
      },
      {
        target: '[data-tour="suppliers-table"]',
        title: "Your supplier list",
        body: "All saved suppliers appear here with their contact information.",
      },
      {
        target: '[data-tour="suppliers-status"]',
        title: "Active or inactive",
        body: "This shows whether you still order from a supplier, so old vendors don't clutter your choices.",
      },
      {
        target: '[data-tour="suppliers-delete"]',
        title: "Remove a supplier",
        body: "Delete a vendor you no longer work with.",
      },
    ],
  },
  "purchase-orders": {
    title: "Purchase Orders",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Purchase Orders",
        body: "Raise and track orders for the supplies your clinic needs, from request to delivery.",
      },
      {
        target: '[data-tour="purchase-orders-add"]',
        title: "Create an order",
        body: "Click here to start a new purchase order for a supplier.",
      },
      {
        target: '[data-tour="purchase-orders-form"]',
        title: "Order details",
        body: "Choose the supplier and add the items, quantities, and costs you want to order.",
      },
      {
        target: '[data-tour="purchase-orders-table"]',
        title: "All your orders",
        body: "Every purchase order is listed here with its supplier, total, and date.",
      },
      {
        target: '[data-tour="purchase-orders-status"]',
        title: "Order status",
        body: "See at a glance whether an order is still a draft, has been ordered, or has arrived.",
      },
      {
        target: '[data-tour="purchase-orders-mark-ordered"]',
        title: "Mark as ordered",
        body: "Once you've sent the order to the supplier, mark it here so everyone knows it's on the way.",
      },
      {
        target: '[data-tour="purchase-orders-received"]',
        title: "Mark as received",
        body: "When the delivery arrives, confirm it here and the stock quantities are updated for you.",
      },
    ],
  },
  "treatment-materials": {
    title: "Treatment Materials",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Treatment Materials",
        body: "Link the materials you use up to the treatments they belong to, so each procedure's real cost is known.",
      },
      {
        target: '[data-tour="treatment-materials-add"]',
        title: "Link a material",
        body: "Click here to attach a stock item to a treatment.",
      },
      {
        target: '[data-tour="treatment-materials-form"]',
        title: "Choose treatment and quantity",
        body: "Pick the treatment, the material used, and how much of it a single procedure consumes.",
      },
      {
        target: '[data-tour="treatment-materials-table"]',
        title: "Material breakdown",
        body: "See every treatment with its materials and what they cost per procedure.",
      },
      {
        target: '[data-tour="treatment-materials-delete"]',
        title: "Remove a link",
        body: "Delete a material from a treatment if it's no longer used.",
      },
    ],
  },
  staff: {
    title: "Staff",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Staff",
        body: "Manage everyone who works at your clinic and what they're allowed to do.",
      },
      {
        target: '[data-tour="staff-add"]',
        title: "Add a team member",
        body: "Click here to add a dentist, nurse, receptionist, or any other staff member.",
      },
      {
        target: '[data-tour="staff-grid"]',
        title: "Your team",
        body: "Each card shows a team member with their contact details and role.",
      },
      {
        target: '[data-tour="staff-role-badge"]',
        title: "Roles and access",
        body: "The role decides which parts of the system that person can open.",
      },
      {
        target: '[data-tour="staff-edit"]',
        title: "Edit a member",
        body: "Update someone's details or change their role at any time.",
      },
    ],
  },
  messages: {
    title: "Messages",
    steps: [
      {
        target: '[data-tour="page-header"]',
        title: "Welcome to Messages",
        body: "Chat with your team and keep patient-related conversations in one place.",
      },
      {
        target: '[data-tour="messages-new"]',
        title: "Start a conversation",
        body: "Click here to begin a new chat with a colleague.",
      },
      {
        target: '[data-tour="messages-search"]',
        title: "Find a conversation",
        body: "Search by name to jump straight to the chat you need.",
      },
      {
        target: '[data-tour="messages-conversations"]',
        title: "Your conversations",
        body: "All your chats are listed here, with the most recent at the top.",
      },
      {
        target: '[data-tour="messages-thread"]',
        title: "The conversation",
        body: "Read the full back-and-forth of the selected chat here.",
      },
      {
        target: '[data-tour="messages-composer"]',
        title: "Write a message",
        body: "Type your message here and press send.",
      },
      {
        target: '[data-tour="messages-attach"]',
        title: "Attach a file",
        body: "Share an image or document with the person you're chatting with.",
      },
    ],
  },
};
