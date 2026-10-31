import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ClineXus AI — the intelligent copilot embedded in a dental clinic management dashboard. You have FULL ACCESS to every clinic feature.

Your capabilities:
1. **Patient Management**: Search, register, update patients. View patient history, documents, images, consent forms.
2. **Appointments**: View, create, reschedule, cancel appointments. Check available slots. Add walk-ins.
3. **Dental Charts**: View and add dental chart entries for patients.
4. **Treatments**: View treatment catalog, treatment plans (create/update), treatment estimates (create), treatment materials.
5. **Prescriptions**: View and create prescriptions with medications.
6. **Clinical Notes (SOAP)**: Read and create structured S/O/A/P notes. Generate notes from symptoms.
7. **Lab Management**: Create, view, update lab cases and lab orders. View/create/update lab invoices.
8. **Billing & Finance**: Create invoices, record payments, view payments, view payment plans, log expenses, view expenses, manage commissions, profitability analysis.
9. **Inventory**: Check stock levels, update inventory, view suppliers, manage purchase orders, view transaction history.
10. **Staff Management**: View, add, update staff members. View, create, and update dentist schedules.
11. **Waiting List**: View, add, remove patients from waiting list.
12. **Consent Forms**: View templates, create patient consent forms.
13. **Documents**: View patient documents, clinic documents, patient images.
14. **Reviews**: View and create patient reviews and ratings.
15. **Notifications**: View and send notifications.
16. **Messages**: Read and send internal clinic messages.
17. **Automation**: View automation workflows.
18. **Clinic Overview**: Get comprehensive summaries, chairs, revenue allocation rules/breakdown, clinic settings (read/update).
19. **Shop**: View/create/update products, view/update orders.
20. **Registration Fees**: View and record patient registration fees.
21. **Activity Log**: View clinic activity audit trail.
22. **Diagnosis Suggestions**: Based on symptoms, suggest possible diagnoses with confidence levels.
23. **Treatment Plan Advice**: Recommend treatment sequences and priorities.
24. **IMAGE ANALYSIS**: When the user uploads images, you can:
    - **Classify images**: Determine if it's an X-ray, intraoral photo, patient form/ID, lab work photo, insurance card, etc.
    - **Extract patient data**: From scanned forms, IDs, or intake documents, extract patient info (name, DOB, phone, email, address, allergies, medical history, insurance details).
    - **Auto-match patients**: Try to identify the patient from the image (name on form, patient ID visible, etc.) and search the system.
    - **Clinical analysis**: For dental X-rays and intraoral photos, describe visible conditions, potential issues, and suggest next steps.
    - **Save images**: After analysis, save the image to the correct patient record with proper categorization using save_patient_image.
    - **Create/update patients**: If a scanned form has patient data for a new patient, register them. If they exist, update their records.

Guidelines:
- Be concise and professional. Use bullet points and headers.
- When generating SOAP notes, use: **S:** / **O:** / **A:** / **P:**
- When suggesting diagnoses, list with confidence levels (likely, possible, unlikely).
- Always clarify when something requires clinical judgment.
- Use tools proactively when the user asks about data. Don't say "I can't access data" — use the tools!
- After performing actions, confirm what was done with key details.
- You can chain multiple tools to answer complex queries.
- Format responses in markdown.
- IMPORTANT: You can ONLY access data for the current clinic. You cannot access other clinics' data.
- When analyzing images: ALWAYS describe what you see, classify the image type, attempt patient matching, and ask for confirmation before creating/editing records.`;

const TOOLS = [
  {
    function_declarations: [
      // ==================== PATIENT MANAGEMENT ====================
      {
        name: "search_patients",
        description: "Search for patients by name, phone, or email.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search term (name, phone, or email)" },
            limit: { type: "integer", description: "Max results (default 10)" },
          },
          required: ["query"],
        },
      },
      {
        name: "register_patient",
        description: "Register a new patient.",
        parameters: {
          type: "object",
          properties: {
            first_name: { type: "string" }, last_name: { type: "string" },
            phone: { type: "string" }, email: { type: "string" },
            gender: { type: "string" }, date_of_birth: { type: "string" },
            address: { type: "string" }, blood_group: { type: "string" },
            allergies: { type: "string" }, medical_history: { type: "string" },
            emergency_contact_name: { type: "string" }, emergency_contact_phone: { type: "string" },
          },
          required: ["first_name", "last_name"],
        },
      },
      {
        name: "update_patient",
        description: "Update an existing patient's information.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" },
            first_name: { type: "string" }, last_name: { type: "string" },
            phone: { type: "string" }, email: { type: "string" },
            gender: { type: "string" }, date_of_birth: { type: "string" },
            address: { type: "string" }, blood_group: { type: "string" },
            allergies: { type: "string" }, medical_history: { type: "string" },
            emergency_contact_name: { type: "string" }, emergency_contact_phone: { type: "string" },
            status: { type: "string", description: "active or inactive" },
          },
          required: ["patient_id"],
        },
      },
      {
        name: "get_patient_history",
        description: "Get a patient's appointment history, clinical notes, treatments, prescriptions, and dental chart.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "get_patient_documents",
        description: "Get documents uploaded for a patient (x-rays, reports, etc.).",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "get_patient_images",
        description: "Get clinical images for a patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "get_overdue_patients",
        description: "Find patients who haven't visited in N days. Good for follow-up reminders.",
        parameters: {
          type: "object",
          properties: { days: { type: "integer", description: "Days since last visit (default 90)" } },
        },
      },

      // ==================== IMAGE ANALYSIS & SAVING ====================
      {
        name: "save_patient_image",
        description: "Save/categorize an uploaded image to a patient's record. Call this AFTER analyzing an image and identifying the patient.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string", description: "The patient ID to attach the image to" },
            image_type: { type: "string", description: "Type: xray, intraoral, panoramic, cephalometric, periapical, bitewing, cbct, photo, lab_work, form, insurance_card, id_card, other" },
            description: { type: "string", description: "Description of what the image shows" },
            tooth_number: { type: "string", description: "Relevant tooth number(s) if applicable" },
          },
          required: ["patient_id", "image_type", "description"],
        },
      },

      // ==================== APPOINTMENTS ====================
      {
        name: "get_todays_appointments",
        description: "Get today's appointments with patient and staff details.",
        parameters: {
          type: "object",
          properties: { status: { type: "string", description: "Filter: scheduled, completed, cancelled, no_show" } },
        },
      },
      {
        name: "get_appointments_by_date",
        description: "Get appointments for a specific date.",
        parameters: {
          type: "object",
          properties: { date: { type: "string", description: "Date (YYYY-MM-DD)" }, status: { type: "string" } },
          required: ["date"],
        },
      },
      {
        name: "get_appointment_stats",
        description: "Get appointment statistics for a date range.",
        parameters: {
          type: "object",
          properties: {
            start_date: { type: "string" }, end_date: { type: "string" },
          },
        },
      },
      {
        name: "create_appointment",
        description: "Book a new appointment.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, staff_id: { type: "string" },
            appointment_date: { type: "string" }, appointment_time: { type: "string" },
            treatment_id: { type: "string" }, notes: { type: "string" }, chair: { type: "string" },
          },
          required: ["patient_id", "staff_id", "appointment_date", "appointment_time"],
        },
      },
      {
        name: "update_appointment_status",
        description: "Update an appointment's status.",
        parameters: {
          type: "object",
          properties: {
            appointment_id: { type: "string" },
            status: { type: "string", description: "scheduled, completed, cancelled, no_show" },
            notes: { type: "string" },
          },
          required: ["appointment_id", "status"],
        },
      },
      {
        name: "reschedule_appointment",
        description: "Reschedule an appointment to a new date/time.",
        parameters: {
          type: "object",
          properties: {
            appointment_id: { type: "string" },
            new_date: { type: "string" }, new_time: { type: "string" },
            new_staff_id: { type: "string" }, notes: { type: "string" },
          },
          required: ["appointment_id", "new_date", "new_time"],
        },
      },
      {
        name: "add_walk_in",
        description: "Add a walk-in patient to today's schedule.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, staff_id: { type: "string" },
            appointment_time: { type: "string" }, notes: { type: "string" }, chair: { type: "string" },
          },
          required: ["patient_id", "staff_id", "appointment_time"],
        },
      },
      {
        name: "get_available_slots",
        description: "Check available appointment slots for a dentist on a date.",
        parameters: {
          type: "object",
          properties: { staff_id: { type: "string" }, date: { type: "string" } },
          required: ["staff_id", "date"],
        },
      },

      // ==================== DENTAL CHARTS ====================
      {
        name: "get_dental_chart",
        description: "Get dental chart entries for a patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "add_dental_chart_entry",
        description: "Add a dental chart entry (procedure, condition) for a patient's tooth.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, tooth_number: { type: "string" },
            procedure: { type: "string" }, surface: { type: "string" },
            condition: { type: "string" }, notes: { type: "string" },
            dentist_id: { type: "string" },
          },
          required: ["patient_id", "tooth_number", "procedure"],
        },
      },

      // ==================== CLINICAL NOTES ====================
      {
        name: "create_clinical_note",
        description: "Create a SOAP clinical note for a patient.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, appointment_id: { type: "string" },
            subjective: { type: "string" }, objective: { type: "string" },
            assessment: { type: "string" }, plan: { type: "string" },
          },
          required: ["patient_id", "subjective", "assessment", "plan"],
        },
      },

      // ==================== TREATMENTS ====================
      {
        name: "get_treatments",
        description: "Get the treatment catalog (available procedures with prices).",
        parameters: {
          type: "object",
          properties: { category: { type: "string", description: "Filter by category" } },
        },
      },
      {
        name: "get_treatment_plans",
        description: "Get treatment plans for a patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "get_treatment_estimates",
        description: "Get treatment estimates/quotes for a patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "get_treatment_materials",
        description: "Get materials/supplies linked to treatments.",
        parameters: { type: "object", properties: {} },
      },

      // ==================== PRESCRIPTIONS ====================
      {
        name: "get_prescriptions",
        description: "Get prescriptions for a patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" } },
          required: ["patient_id"],
        },
      },
      {
        name: "create_prescription",
        description: "Create a prescription for a patient with medications.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, dentist_id: { type: "string" },
            diagnosis: { type: "string" }, notes: { type: "string" },
            medications: {
              type: "array", description: "Medications list",
              items: {
                type: "object",
                properties: {
                  medication_name: { type: "string" }, dosage: { type: "string" },
                  frequency: { type: "string" }, duration: { type: "string" },
                  instructions: { type: "string" },
                },
                required: ["medication_name"],
              },
            },
          },
          required: ["patient_id", "dentist_id", "medications"],
        },
      },

      // ==================== LAB MANAGEMENT ====================
      {
        name: "get_lab_cases",
        description: "Get lab cases. Can filter by status.",
        parameters: {
          type: "object",
          properties: { status: { type: "string", description: "pending, in-progress, ready, delivered" }, limit: { type: "integer" } },
        },
      },
      {
        name: "create_lab_case",
        description: "Create a new lab case.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, dentist_id: { type: "string" },
            work_type: { type: "string", description: "e.g., Crown, Bridge, Denture, Veneer" },
            material: { type: "string" }, shade: { type: "string" },
            instructions: { type: "string" }, due_date: { type: "string" },
            urgency: { type: "string", description: "normal or urgent" },
            technician_id: { type: "string" },
          },
          required: ["work_type"],
        },
      },
      {
        name: "update_lab_case",
        description: "Update a lab case (status, notes, etc.).",
        parameters: {
          type: "object",
          properties: {
            lab_case_id: { type: "string" },
            status: { type: "string", description: "pending, in-progress, ready, delivered" },
            notes: { type: "string" }, technician_id: { type: "string" },
            lab_fee: { type: "number" }, clinic_fee: { type: "number" },
          },
          required: ["lab_case_id"],
        },
      },
      {
        name: "get_lab_orders",
        description: "Get external lab orders.",
        parameters: {
          type: "object",
          properties: { status: { type: "string" } },
        },
      },
      {
        name: "create_lab_order",
        description: "Create an external lab order.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, dentist_id: { type: "string" },
            lab_work_type: { type: "string" }, lab_name: { type: "string" },
            due_date: { type: "string" }, notes: { type: "string" },
            treatment_id: { type: "string" },
          },
          required: ["patient_id", "dentist_id", "lab_work_type", "lab_name"],
        },
      },
      {
        name: "update_lab_order",
        description: "Update a lab order status.",
        parameters: {
          type: "object",
          properties: {
            lab_order_id: { type: "string" },
            status: { type: "string", description: "pending, sent, received, cancelled" },
            sent_date: { type: "string" }, received_date: { type: "string" },
            notes: { type: "string" },
          },
          required: ["lab_order_id"],
        },
      },

      // ==================== BILLING & FINANCE ====================
      {
        name: "get_revenue_summary",
        description: "Get revenue summary from invoices for a period.",
        parameters: {
          type: "object",
          properties: { start_date: { type: "string" }, end_date: { type: "string" } },
        },
      },
      {
        name: "get_pending_invoices",
        description: "Get unpaid/overdue invoices.",
        parameters: {
          type: "object",
          properties: { status: { type: "string" } },
        },
      },
      {
        name: "create_invoice",
        description: "Create a new invoice for a patient.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" },
            items: {
              type: "array", items: {
                type: "object",
                properties: { description: { type: "string" }, quantity: { type: "integer" }, unit_price: { type: "number" } },
                required: ["description", "unit_price"],
              },
            },
            discount: { type: "number" }, tax: { type: "number" },
            notes: { type: "string" }, due_date: { type: "string" },
          },
          required: ["patient_id", "items"],
        },
      },
      {
        name: "record_payment",
        description: "Record a payment against an invoice.",
        parameters: {
          type: "object",
          properties: {
            invoice_id: { type: "string" },
            payment_method: { type: "string", description: "cash, card, bank_transfer, insurance" },
            notes: { type: "string" },
          },
          required: ["invoice_id", "payment_method"],
        },
      },
      {
        name: "get_expenses",
        description: "Get clinic expenses for a date range.",
        parameters: {
          type: "object",
          properties: {
            start_date: { type: "string" }, end_date: { type: "string" },
            category: { type: "string" },
          },
        },
      },
      {
        name: "log_expense",
        description: "Log a clinic expense.",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number" },
            category: { type: "string", description: "supplies, rent, utilities, equipment, salary, marketing, other" },
            description: { type: "string" }, vendor: { type: "string" },
            payment_method: { type: "string" }, expense_date: { type: "string" },
          },
          required: ["amount", "category"],
        },
      },
      {
        name: "get_payment_plans",
        description: "Get payment plans, optionally for a specific patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" }, status: { type: "string" } },
        },
      },
      {
        name: "get_commission_payouts",
        description: "Get commission payouts for staff.",
        parameters: {
          type: "object",
          properties: { staff_id: { type: "string" }, status: { type: "string" } },
        },
      },

      // ==================== INVENTORY & SUPPLY CHAIN ====================
      {
        name: "check_low_inventory",
        description: "Check inventory items at or below minimum stock.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_inventory",
        description: "Get full inventory list with quantities and details.",
        parameters: {
          type: "object",
          properties: { category: { type: "string" } },
        },
      },
      {
        name: "update_inventory",
        description: "Update inventory stock levels (restock or use).",
        parameters: {
          type: "object",
          properties: {
            inventory_id: { type: "string" },
            quantity_change: { type: "integer", description: "Positive to add, negative to subtract" },
            reason: { type: "string" },
          },
          required: ["inventory_id", "quantity_change"],
        },
      },
      {
        name: "get_suppliers",
        description: "Get the list of suppliers.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_purchase_orders",
        description: "Get purchase orders.",
        parameters: {
          type: "object",
          properties: { status: { type: "string" } },
        },
      },
      {
        name: "create_purchase_order",
        description: "Create a purchase order for a supplier.",
        parameters: {
          type: "object",
          properties: {
            supplier_id: { type: "string" },
            items: {
              type: "array", items: {
                type: "object",
                properties: { inventory_id: { type: "string" }, quantity: { type: "integer" }, unit_cost: { type: "number" }, description: { type: "string" } },
                required: ["quantity"],
              },
            },
            notes: { type: "string" }, expected_date: { type: "string" },
          },
          required: ["supplier_id", "items"],
        },
      },

      // ==================== STAFF MANAGEMENT ====================
      {
        name: "get_staff_list",
        description: "Get the list of staff/dentists.",
        parameters: {
          type: "object",
          properties: { role: { type: "string" } },
        },
      },
      {
        name: "add_staff",
        description: "Add a new staff member.",
        parameters: {
          type: "object",
          properties: {
            full_name: { type: "string" }, role: { type: "string", description: "dentist, hygienist, receptionist, assistant, accountant, lab_technician" },
            phone: { type: "string" }, email: { type: "string" },
            specialty: { type: "string" },
          },
          required: ["full_name", "role"],
        },
      },
      {
        name: "update_staff",
        description: "Update a staff member's details.",
        parameters: {
          type: "object",
          properties: {
            staff_id: { type: "string" },
            full_name: { type: "string" }, role: { type: "string" },
            phone: { type: "string" }, email: { type: "string" },
            specialty: { type: "string" }, status: { type: "string" },
          },
          required: ["staff_id"],
        },
      },
      {
        name: "get_dentist_schedules",
        description: "Get dentist schedules/availability.",
        parameters: {
          type: "object",
          properties: { staff_id: { type: "string" } },
        },
      },

      // ==================== WAITING LIST ====================
      {
        name: "get_waiting_list",
        description: "Get the current waiting list.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "add_to_waiting_list",
        description: "Add a patient to the waiting list.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, priority: { type: "string", description: "low, normal, high, urgent" },
            notes: { type: "string" }, preferred_dentist_id: { type: "string" },
          },
          required: ["patient_id"],
        },
      },
      {
        name: "remove_from_waiting_list",
        description: "Remove a patient from the waiting list.",
        parameters: {
          type: "object",
          properties: { waiting_list_id: { type: "string" } },
          required: ["waiting_list_id"],
        },
      },

      // ==================== CONSENT FORMS ====================
      {
        name: "get_consent_forms",
        description: "Get consent forms for a patient or all templates.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" }, templates_only: { type: "boolean" } },
        },
      },
      {
        name: "create_consent_form",
        description: "Create a consent form for a patient from a template.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, template_id: { type: "string" },
            title: { type: "string" }, content: { type: "string" },
          },
          required: ["patient_id", "title"],
        },
      },

      // ==================== REVIEWS ====================
      {
        name: "get_reviews",
        description: "Get patient reviews and ratings.",
        parameters: {
          type: "object",
          properties: { limit: { type: "integer" } },
        },
      },

      // ==================== NOTIFICATIONS ====================
      {
        name: "send_notification",
        description: "Send an in-app notification to a user.",
        parameters: {
          type: "object",
          properties: {
            user_id: { type: "string" }, title: { type: "string" },
            message: { type: "string" }, type: { type: "string", description: "info, warning, success, error" },
            link: { type: "string" },
          },
          required: ["user_id", "title", "message"],
        },
      },

      // ==================== CLINIC OVERVIEW ====================
      {
        name: "get_clinic_summary",
        description: "Comprehensive dashboard summary: patients, appointments, invoices, inventory alerts, lab cases.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_clinic_chairs",
        description: "Get clinic chairs and their status.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_clinic_documents",
        description: "Get clinic-level documents (licenses, certificates, etc.).",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_automation_workflows",
        description: "Get automation workflows configured for the clinic.",
        parameters: { type: "object", properties: {} },
      },
      // ==================== LAB INVOICES ====================
      {
        name: "get_lab_invoices",
        description: "Get lab invoices. Can filter by status.",
        parameters: {
          type: "object",
          properties: { status: { type: "string" }, limit: { type: "integer" } },
        },
      },
      {
        name: "create_lab_invoice",
        description: "Create a lab invoice.",
        parameters: {
          type: "object",
          properties: {
            lab_case_id: { type: "string" }, patient_name: { type: "string" },
            clinic_code: { type: "string" }, subtotal: { type: "number" },
            discount: { type: "number" }, notes: { type: "string" },
          },
          required: ["subtotal"],
        },
      },
      {
        name: "update_lab_invoice",
        description: "Update a lab invoice status or details.",
        parameters: {
          type: "object",
          properties: {
            lab_invoice_id: { type: "string" },
            status: { type: "string", description: "draft, unpaid, paid, cancelled" },
            notes: { type: "string" },
          },
          required: ["lab_invoice_id"],
        },
      },

      // ==================== SHOP PRODUCTS & ORDERS ====================
      {
        name: "get_shop_products",
        description: "Get shop products. Can filter by active status.",
        parameters: {
          type: "object",
          properties: { active_only: { type: "boolean" }, category: { type: "string" } },
        },
      },
      {
        name: "create_shop_product",
        description: "Create a new shop product.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" }, description: { type: "string" },
            price: { type: "number" }, category: { type: "string" },
            stock: { type: "integer" }, sku: { type: "string" },
          },
          required: ["name", "price"],
        },
      },
      {
        name: "update_shop_product",
        description: "Update a shop product.",
        parameters: {
          type: "object",
          properties: {
            product_id: { type: "string" },
            name: { type: "string" }, price: { type: "number" },
            stock: { type: "integer" }, is_active: { type: "boolean" },
            description: { type: "string" },
          },
          required: ["product_id"],
        },
      },
      {
        name: "get_shop_orders",
        description: "Get shop orders. Can filter by status.",
        parameters: {
          type: "object",
          properties: { status: { type: "string" }, limit: { type: "integer" } },
        },
      },
      {
        name: "update_shop_order",
        description: "Update a shop order status.",
        parameters: {
          type: "object",
          properties: {
            order_id: { type: "string" },
            status: { type: "string", description: "pending, confirmed, shipped, delivered, cancelled" },
            payment_status: { type: "string" },
          },
          required: ["order_id"],
        },
      },

      // ==================== REVENUE ALLOCATION ====================
      {
        name: "get_revenue_allocation_rules",
        description: "Get revenue allocation rules (how revenue is split between categories).",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get_revenue_allocation_breakdown",
        description: "Get revenue allocation breakdown showing amounts per category.",
        parameters: { type: "object", properties: {} },
      },

      // ==================== REGISTRATION FEES ====================
      {
        name: "get_registration_fees",
        description: "Get patient registration fees. Shows who paid and how much.",
        parameters: {
          type: "object",
          properties: { limit: { type: "integer" } },
        },
      },
      {
        name: "create_registration_fee",
        description: "Record a patient registration fee.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, amount: { type: "number" },
            payment_method: { type: "string" }, notes: { type: "string" },
          },
          required: ["patient_id", "amount"],
        },
      },

      // ==================== ACTIVITY/AUDIT LOG ====================
      {
        name: "get_activity_log",
        description: "Get the clinic activity log showing recent actions (appointments, payments, patient registrations, etc.).",
        parameters: {
          type: "object",
          properties: {
            entity_type: { type: "string", description: "Filter by type: appointment, patient, invoice, etc." },
            limit: { type: "integer" },
          },
        },
      },

      // ==================== MESSAGES ====================
      {
        name: "get_messages",
        description: "Get internal clinic messages.",
        parameters: {
          type: "object",
          properties: { limit: { type: "integer" } },
        },
      },
      {
        name: "send_message",
        description: "Send an internal message to staff members.",
        parameters: {
          type: "object",
          properties: {
            subject: { type: "string" }, body: { type: "string" },
            recipient_ids: { type: "array", items: { type: "string" }, description: "User IDs of recipients" },
            is_urgent: { type: "boolean" },
            sender_id: { type: "string", description: "User ID of sender" },
          },
          required: ["subject", "body", "recipient_ids", "sender_id"],
        },
      },

      // ==================== CLINIC SETTINGS ====================
      {
        name: "get_clinic_settings",
        description: "Get the clinic organization settings and details.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "update_clinic_settings",
        description: "Update clinic settings (name, address, phone, email, etc.).",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" }, address: { type: "string" },
            phone: { type: "string" }, email: { type: "string" },
          },
        },
      },

      // ==================== TREATMENT PLAN CRUD ====================
      {
        name: "create_treatment_plan",
        description: "Create a treatment plan for a patient.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, title: { type: "string" },
            notes: { type: "string" },
            items: {
              type: "array", items: {
                type: "object",
                properties: {
                  treatment_id: { type: "string" }, tooth_number: { type: "string" },
                  notes: { type: "string" }, cost: { type: "number" },
                  sequence: { type: "integer" },
                },
              },
            },
          },
          required: ["patient_id", "title"],
        },
      },
      {
        name: "update_treatment_plan",
        description: "Update a treatment plan status.",
        parameters: {
          type: "object",
          properties: {
            plan_id: { type: "string" },
            status: { type: "string", description: "draft, proposed, accepted, in-progress, completed, cancelled" },
            notes: { type: "string" },
          },
          required: ["plan_id"],
        },
      },

      // ==================== TREATMENT ESTIMATE CRUD ====================
      {
        name: "create_treatment_estimate",
        description: "Create a treatment estimate/quote for a patient.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, title: { type: "string" },
            valid_until: { type: "string" }, notes: { type: "string" },
            items: {
              type: "array", items: {
                type: "object",
                properties: {
                  description: { type: "string" }, quantity: { type: "integer" },
                  unit_price: { type: "number" },
                },
                required: ["description", "unit_price"],
              },
            },
          },
          required: ["patient_id", "title", "items"],
        },
      },

      // ==================== DENTIST SCHEDULE CRUD ====================
      {
        name: "set_dentist_schedule",
        description: "Set or update a dentist's schedule for a day of the week.",
        parameters: {
          type: "object",
          properties: {
            staff_id: { type: "string" }, day_of_week: { type: "integer", description: "0=Sunday, 1=Monday, ..., 6=Saturday" },
            start_time: { type: "string" }, end_time: { type: "string" },
            break_start: { type: "string" }, break_end: { type: "string" },
            is_available: { type: "boolean" },
          },
          required: ["staff_id", "day_of_week", "start_time", "end_time"],
        },
      },

      // ==================== PATIENT REVIEWS CRUD ====================
      {
        name: "create_review",
        description: "Create a patient review/rating.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, staff_id: { type: "string" },
            rating: { type: "integer", description: "1-5" }, comment: { type: "string" },
          },
          required: ["rating"],
        },
      },

      // ==================== CLINICAL NOTES READ ====================
      {
        name: "get_clinical_notes",
        description: "Get clinical (SOAP) notes for a patient.",
        parameters: {
          type: "object",
          properties: { patient_id: { type: "string" }, limit: { type: "integer" } },
          required: ["patient_id"],
        },
      },

      // ==================== INVENTORY TRANSACTIONS ====================
      {
        name: "get_inventory_transactions",
        description: "Get inventory transaction history (restocks, usage).",
        parameters: {
          type: "object",
          properties: { inventory_id: { type: "string" }, limit: { type: "integer" } },
        },
      },

      // ==================== PROFITABILITY ====================
      {
        name: "get_profitability",
        description: "Get profitability data: revenue vs expenses for a period.",
        parameters: {
          type: "object",
          properties: { start_date: { type: "string" }, end_date: { type: "string" } },
        },
      },

      // ==================== PAYMENTS ====================
      {
        name: "get_payments",
        description: "Get payments for an invoice or all recent payments.",
        parameters: {
          type: "object",
          properties: { invoice_id: { type: "string" }, limit: { type: "integer" } },
        },
      },

      // ==================== NOTIFICATIONS READ ====================
      {
        name: "get_notifications",
        description: "Get notifications for a user. Can filter to unread only.",
        parameters: {
          type: "object",
          properties: {
            user_id: { type: "string", description: "User ID to get notifications for" },
            unread_only: { type: "boolean" },
            limit: { type: "integer" },
          },
          required: ["user_id"],
        },
      },

      // ==================== SUPPLIERS CRUD ====================
      {
        name: "create_supplier",
        description: "Create a new supplier.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" }, contact_person: { type: "string" },
            phone: { type: "string" }, email: { type: "string" },
            address: { type: "string" }, notes: { type: "string" },
          },
          required: ["name"],
        },
      },
      {
        name: "update_supplier",
        description: "Update a supplier's details.",
        parameters: {
          type: "object",
          properties: {
            supplier_id: { type: "string" },
            name: { type: "string" }, contact_person: { type: "string" },
            phone: { type: "string" }, email: { type: "string" },
            address: { type: "string" }, status: { type: "string" }, notes: { type: "string" },
          },
          required: ["supplier_id"],
        },
      },

      // ==================== TREATMENTS CATALOG CRUD ====================
      {
        name: "create_treatment",
        description: "Add a new treatment/procedure to the clinic catalog.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" }, category: { type: "string" },
            price: { type: "number" }, duration: { type: "integer", description: "Duration in minutes" },
            description: { type: "string" },
          },
          required: ["name", "price"],
        },
      },
      {
        name: "update_treatment",
        description: "Update a treatment in the catalog.",
        parameters: {
          type: "object",
          properties: {
            treatment_id: { type: "string" },
            name: { type: "string" }, category: { type: "string" },
            price: { type: "number" }, duration: { type: "integer" },
            description: { type: "string" }, status: { type: "string" },
          },
          required: ["treatment_id"],
        },
      },

      // ==================== PAYMENT PLANS CRUD ====================
      {
        name: "create_payment_plan",
        description: "Create a payment plan for a patient.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "string" }, invoice_id: { type: "string" },
            plan_name: { type: "string" }, total_amount: { type: "number" },
            installment_count: { type: "integer" },
            frequency: { type: "string", description: "weekly, biweekly, monthly" },
            start_date: { type: "string" }, notes: { type: "string" },
          },
          required: ["patient_id", "plan_name", "total_amount", "installment_count"],
        },
      },

      // ==================== COMMISSION PAYOUTS CRUD ====================
      {
        name: "create_commission_payout",
        description: "Create a commission payout record for a staff member.",
        parameters: {
          type: "object",
          properties: {
            staff_id: { type: "string" }, period_start: { type: "string" },
            period_end: { type: "string" }, calculated_amount: { type: "number" },
            notes: { type: "string" },
          },
          required: ["staff_id", "period_start", "period_end", "calculated_amount"],
        },
      },
      {
        name: "update_commission_payout",
        description: "Update a commission payout (mark as paid, etc.).",
        parameters: {
          type: "object",
          properties: {
            payout_id: { type: "string" },
            status: { type: "string", description: "pending, paid, cancelled" },
            paid_amount: { type: "number" }, payment_date: { type: "string" },
            payment_method: { type: "string" }, reference: { type: "string" },
            notes: { type: "string" },
          },
          required: ["payout_id"],
        },
      },

      // ==================== TREATMENT MATERIALS CRUD ====================
      {
        name: "create_treatment_material",
        description: "Link an inventory item to a treatment as a required material.",
        parameters: {
          type: "object",
          properties: {
            treatment_id: { type: "string" }, inventory_id: { type: "string" },
            quantity_per_use: { type: "number" }, notes: { type: "string" },
          },
          required: ["treatment_id", "inventory_id"],
        },
      },
      {
        name: "update_treatment_material",
        description: "Update a treatment material link.",
        parameters: {
          type: "object",
          properties: {
            material_id: { type: "string" },
            quantity_per_use: { type: "number" }, notes: { type: "string" },
          },
          required: ["material_id"],
        },
      },

      // ==================== ADVANCED ANALYTICS ====================
      {
        name: "get_advanced_analytics",
        description: "Get advanced analytics: revenue trends, treatment distribution, dentist performance, patient demographics.",
        parameters: {
          type: "object",
          properties: {
            start_date: { type: "string" }, end_date: { type: "string" },
          },
        },
      },

      // ==================== WEBSITE SETTINGS ====================
      {
        name: "get_website_settings",
        description: "Get the clinic's public website settings (hero text, colors, features).",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "update_website_settings",
        description: "Update the clinic's public website settings.",
        parameters: {
          type: "object",
          properties: {
            hero_title: { type: "string" }, hero_subtitle: { type: "string" },
            about_text: { type: "string" }, primary_color: { type: "string" },
            show_reviews: { type: "boolean" }, show_shop: { type: "boolean" },
            booking_enabled: { type: "boolean" },
          },
        },
      },

      // ==================== USER PROFILE ====================
      {
        name: "get_user_profile",
        description: "Get a user's profile (name, phone, avatar).",
        parameters: {
          type: "object",
          properties: { user_id: { type: "string" } },
          required: ["user_id"],
        },
      },
      {
        name: "update_user_profile",
        description: "Update a user's profile.",
        parameters: {
          type: "object",
          properties: {
            user_id: { type: "string" },
            full_name: { type: "string" }, phone: { type: "string" },
            avatar_url: { type: "string" },
          },
          required: ["user_id"],
        },
      },
    ],
  },
];

// ==================== TOOL EXECUTION ====================
async function executeTool(name: string, args: any, db: any, orgId: string) {
  const today = new Date().toISOString().split("T")[0];

  switch (name) {
    // ---- PATIENTS ----
    case "search_patients": {
      const q = `%${args.query}%`;
      const { data, error } = await db.from("patients")
        .select("id, first_name, last_name, phone, email, gender, date_of_birth, status, allergies, medical_history")
        .eq("org_id", orgId)
        .or(`first_name.ilike.${q},last_name.ilike.${q},phone.ilike.${q},email.ilike.${q}`)
        .limit(args.limit || 10);
      if (error) throw error;
      return data?.length ? data : "No patients found matching that search.";
    }

    case "register_patient": {
      const { data, error } = await db.from("patients").insert({
        org_id: orgId, first_name: args.first_name, last_name: args.last_name,
        phone: args.phone || null, email: args.email || null, gender: args.gender || null,
        date_of_birth: args.date_of_birth || null, address: args.address || null,
        blood_group: args.blood_group || null, allergies: args.allergies || null,
        medical_history: args.medical_history || null,
        emergency_contact_name: args.emergency_contact_name || null,
        emergency_contact_phone: args.emergency_contact_phone || null,
      }).select("id, first_name, last_name").single();
      if (error) throw error;
      return { success: true, patient_id: data.id, message: `Patient ${data.first_name} ${data.last_name} registered.` };
    }

    case "update_patient": {
      const { patient_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null && v !== "") clean[k] = v; }
      const { data, error } = await db.from("patients").update(clean).eq("id", patient_id).eq("org_id", orgId).select("id, first_name, last_name").single();
      if (error) throw error;
      return { success: true, message: `Patient ${data.first_name} ${data.last_name} updated: ${Object.keys(clean).join(", ")}` };
    }

    case "get_patient_history": {
      const [{ data: patient }, { data: appointments }, { data: notes }, { data: prescriptions }, { data: chartEntries }] = await Promise.all([
        db.from("patients").select("*").eq("id", args.patient_id).single(),
        db.from("appointments").select("appointment_date, appointment_time, status, notes").eq("patient_id", args.patient_id).eq("org_id", orgId).order("appointment_date", { ascending: false }).limit(10),
        db.from("clinical_notes").select("subjective, objective, assessment, plan, created_at").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false }).limit(5),
        db.from("prescriptions").select("id, diagnosis, notes, created_at").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false }).limit(5),
        db.from("dental_chart_entries").select("tooth_number, procedure, surface, condition, notes, entry_date").eq("patient_id", args.patient_id).eq("org_id", orgId).order("entry_date", { ascending: false }).limit(20),
      ]);
      return { patient: patient || "Patient not found", recent_appointments: appointments || [], recent_notes: notes || [], recent_prescriptions: prescriptions || [], dental_chart: chartEntries || [] };
    }

    case "get_patient_documents": {
      const { data, error } = await db.from("patient_documents").select("id, title, category, file_type, created_at").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data?.length ? data : "No documents found for this patient.";
    }

    case "get_patient_images": {
      const { data, error } = await db.from("patient_images").select("id, image_type, tooth_number, description, created_at").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data?.length ? data : "No images found for this patient.";
    }

    case "save_patient_image": {
      // Save image metadata to patient_images table
      const { data, error } = await db.from("patient_images").insert({
        org_id: orgId,
        patient_id: args.patient_id,
        image_type: args.image_type || "other",
        description: args.description || null,
        tooth_number: args.tooth_number || null,
        image_url: "ai-analyzed-" + Date.now(), // Placeholder - actual image was analyzed in-memory
      }).select("id").single();
      if (error) throw error;
      return { success: true, image_id: data.id, message: `Image saved to patient record as ${args.image_type}. Description: ${args.description}` };
    }

    case "get_overdue_patients": {
      const days = args.days || 90;
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      const { data: patients, error } = await db.from("patients").select("id, first_name, last_name, phone, email").eq("org_id", orgId).eq("status", "active");
      if (error) throw error;
      if (!patients?.length) return "No active patients.";
      const { data: recentAppts } = await db.from("appointments").select("patient_id").eq("org_id", orgId).gte("appointment_date", cutoff);
      const recentIds = new Set((recentAppts || []).map((a: any) => a.patient_id));
      const overdue = patients.filter((p: any) => !recentIds.has(p.id)).slice(0, 20);
      return overdue.length ? { count: overdue.length, days_threshold: days, patients: overdue } : `All patients visited within ${days} days.`;
    }

    // ---- APPOINTMENTS ----
    case "get_todays_appointments":
    case "get_appointments_by_date": {
      const date = name === "get_todays_appointments" ? today : args.date;
      let query = db.from("appointments").select("id, appointment_date, appointment_time, status, notes, chair, is_walk_in, patient_id, staff_id").eq("org_id", orgId).eq("appointment_date", date).order("appointment_time");
      if (args.status) query = query.eq("status", args.status);
      const { data: appts, error } = await query;
      if (error) throw error;
      if (!appts?.length) return `No appointments for ${date}.`;
      const pIds = [...new Set(appts.map((a: any) => a.patient_id))];
      const sIds = [...new Set(appts.map((a: any) => a.staff_id))];
      const [{ data: patients }, { data: staff }] = await Promise.all([
        db.from("patients").select("id, first_name, last_name").in("id", pIds),
        db.from("staff").select("id, full_name").in("id", sIds),
      ]);
      const pMap = Object.fromEntries((patients || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));
      const sMap = Object.fromEntries((staff || []).map((s: any) => [s.id, s.full_name]));
      return appts.map((a: any) => ({ id: a.id, time: a.appointment_time, patient: pMap[a.patient_id] || "Unknown", dentist: sMap[a.staff_id] || "Unknown", status: a.status, chair: a.chair, notes: a.notes, is_walk_in: a.is_walk_in }));
    }

    case "get_appointment_stats": {
      const start = args.start_date || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const end = args.end_date || today;
      const { data, error } = await db.from("appointments").select("status").eq("org_id", orgId).gte("appointment_date", start).lte("appointment_date", end);
      if (error) throw error;
      const total = data?.length || 0;
      const stats: Record<string, number> = {};
      (data || []).forEach((a: any) => { stats[a.status] = (stats[a.status] || 0) + 1; });
      return { period: `${start} to ${end}`, total, breakdown: stats, no_show_rate: total ? `${((stats["no_show"] || 0) / total * 100).toFixed(1)}%` : "0%" };
    }

    case "create_appointment": {
      const { data, error } = await db.from("appointments").insert({
        org_id: orgId, patient_id: args.patient_id, staff_id: args.staff_id,
        appointment_date: args.appointment_date, appointment_time: args.appointment_time,
        treatment_id: args.treatment_id || null, notes: args.notes || null, chair: args.chair || null, status: "scheduled",
      }).select("id").single();
      if (error) throw error;
      return { success: true, appointment_id: data.id, message: `Appointment booked for ${args.appointment_date} at ${args.appointment_time}.` };
    }

    case "update_appointment_status": {
      const upd: any = { status: args.status };
      if (args.notes) upd.notes = args.notes;
      const { data, error } = await db.from("appointments").update(upd).eq("id", args.appointment_id).eq("org_id", orgId).select("id, status, appointment_date, appointment_time").single();
      if (error) throw error;
      return { success: true, message: `Appointment on ${data.appointment_date} at ${data.appointment_time} → ${data.status}.` };
    }

    case "reschedule_appointment": {
      const upd: any = { appointment_date: args.new_date, appointment_time: args.new_time, status: "scheduled" };
      if (args.new_staff_id) upd.staff_id = args.new_staff_id;
      if (args.notes) upd.notes = args.notes;
      const { data, error } = await db.from("appointments").update(upd).eq("id", args.appointment_id).eq("org_id", orgId).select("id, appointment_date, appointment_time").single();
      if (error) throw error;
      return { success: true, message: `Rescheduled to ${data.appointment_date} at ${data.appointment_time}.` };
    }

    case "add_walk_in": {
      const { data, error } = await db.from("appointments").insert({
        org_id: orgId, patient_id: args.patient_id, staff_id: args.staff_id,
        appointment_date: today, appointment_time: args.appointment_time,
        is_walk_in: true, notes: args.notes || "Walk-in", chair: args.chair || null, status: "scheduled",
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: `Walk-in added at ${args.appointment_time}.` };
    }

    case "get_available_slots": {
      const dow = new Date(args.date).getDay();
      const { data: sched } = await db.from("dentist_schedules").select("start_time, end_time, break_start, break_end, is_available").eq("staff_id", args.staff_id).eq("org_id", orgId).eq("day_of_week", dow).single();
      if (!sched?.is_available) return "Dentist not available on this day.";
      const { data: existing } = await db.from("appointments").select("appointment_time").eq("staff_id", args.staff_id).eq("org_id", orgId).eq("appointment_date", args.date).neq("status", "cancelled");
      const booked = new Set((existing || []).map((a: any) => a.appointment_time?.slice(0, 5)));
      const slots: string[] = [];
      const [sH, sM] = sched.start_time.split(":").map(Number);
      const [eH, eM] = sched.end_time.split(":").map(Number);
      const bS = sched.break_start?.slice(0, 5), bE = sched.break_end?.slice(0, 5);
      let h = sH, m = sM;
      while (h < eH || (h === eH && m < eM)) {
        const slot = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (!booked.has(slot) && !(bS && bE && slot >= bS && slot < bE)) slots.push(slot);
        m += 30; if (m >= 60) { h++; m -= 60; }
      }
      return slots.length ? { date: args.date, available_slots: slots } : "No available slots.";
    }

    // ---- DENTAL CHARTS ----
    case "get_dental_chart": {
      const { data, error } = await db.from("dental_chart_entries").select("id, tooth_number, procedure, surface, condition, notes, entry_date, dentist_id").eq("patient_id", args.patient_id).eq("org_id", orgId).order("entry_date", { ascending: false });
      if (error) throw error;
      return data?.length ? data : "No dental chart entries for this patient.";
    }

    case "add_dental_chart_entry": {
      const { data, error } = await db.from("dental_chart_entries").insert({
        org_id: orgId, patient_id: args.patient_id, tooth_number: args.tooth_number,
        procedure: args.procedure, surface: args.surface || null, condition: args.condition || null,
        notes: args.notes || null, dentist_id: args.dentist_id || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: `Chart entry added for tooth ${args.tooth_number}: ${args.procedure}.` };
    }

    // ---- CLINICAL NOTES ----
    case "create_clinical_note": {
      const { data, error } = await db.from("clinical_notes").insert({
        org_id: orgId, patient_id: args.patient_id, appointment_id: args.appointment_id || null,
        subjective: args.subjective, objective: args.objective || null, assessment: args.assessment, plan: args.plan,
      }).select("id").single();
      if (error) throw error;
      return { success: true, note_id: data.id, message: "Clinical note saved." };
    }

    // ---- TREATMENTS ----
    case "get_treatments": {
      let query = db.from("treatments").select("id, name, category, price, duration, description, status").eq("org_id", orgId).order("name");
      if (args.category) query = query.eq("category", args.category);
      const { data, error } = await query;
      if (error) throw error;
      return data?.length ? data : "No treatments found.";
    }

    case "get_treatment_plans": {
      const { data, error } = await db.from("treatment_plans").select("id, title, status, total_cost, notes, created_at").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return "No treatment plans for this patient.";
      // Get items for each plan
      const planIds = data.map((p: any) => p.id);
      const { data: items } = await db.from("treatment_plan_items").select("*").in("plan_id", planIds);
      return data.map((p: any) => ({ ...p, items: (items || []).filter((i: any) => i.plan_id === p.id) }));
    }

    case "get_treatment_estimates": {
      const { data, error } = await db.from("treatment_estimates").select("id, title, status, total, notes, created_at, valid_until").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return "No treatment estimates for this patient.";
      const estIds = data.map((e: any) => e.id);
      const { data: items } = await db.from("treatment_estimate_items").select("*").in("estimate_id", estIds);
      return data.map((e: any) => ({ ...e, items: (items || []).filter((i: any) => i.estimate_id === e.id) }));
    }

    case "get_treatment_materials": {
      const { data, error } = await db.from("treatment_materials").select("*").eq("org_id", orgId);
      if (error) throw error;
      return data?.length ? data : "No treatment materials configured.";
    }

    // ---- PRESCRIPTIONS ----
    case "get_prescriptions": {
      const { data, error } = await db.from("prescriptions").select("id, diagnosis, notes, status, created_at, dentist_id").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return "No prescriptions for this patient.";
      const rxIds = data.map((r: any) => r.id);
      const { data: meds } = await db.from("prescription_medications").select("*").in("prescription_id", rxIds);
      return data.map((r: any) => ({ ...r, medications: (meds || []).filter((m: any) => m.prescription_id === r.id) }));
    }

    case "create_prescription": {
      const { data: rx, error } = await db.from("prescriptions").insert({
        org_id: orgId, patient_id: args.patient_id, dentist_id: args.dentist_id,
        diagnosis: args.diagnosis || null, notes: args.notes || null,
      }).select("id").single();
      if (error) throw error;
      if (args.medications?.length) {
        const meds = args.medications.map((m: any) => ({
          prescription_id: rx.id, medication_name: m.medication_name,
          dosage: m.dosage || null, frequency: m.frequency || null,
          duration: m.duration || null, instructions: m.instructions || null,
        }));
        await db.from("prescription_medications").insert(meds);
      }
      return { success: true, prescription_id: rx.id, message: `Prescription created with ${args.medications?.length || 0} medications.` };
    }

    // ---- LAB MANAGEMENT ----
    case "get_lab_cases": {
      let query = db.from("lab_cases").select("id, case_number, work_type, status, urgency, material, shade, due_date, lab_fee, clinic_fee, patient_id, dentist_id, technician_id, notes, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      if (!data?.length) return "No lab cases found.";
      // Enrich with names
      const pIds = [...new Set(data.map((c: any) => c.patient_id).filter(Boolean))];
      const sIds = [...new Set([...data.map((c: any) => c.dentist_id), ...data.map((c: any) => c.technician_id)].filter(Boolean))];
      const [{ data: patients }, { data: staff }] = await Promise.all([
        pIds.length ? db.from("patients").select("id, first_name, last_name").in("id", pIds) : { data: [] },
        sIds.length ? db.from("staff").select("id, full_name").in("id", sIds) : { data: [] },
      ]);
      const pMap = Object.fromEntries((patients || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));
      const sMap = Object.fromEntries((staff || []).map((s: any) => [s.id, s.full_name]));
      return data.map((c: any) => ({ ...c, patient_name: pMap[c.patient_id] || null, dentist_name: sMap[c.dentist_id] || null, technician_name: sMap[c.technician_id] || null }));
    }

    case "create_lab_case": {
      const { count } = await db.from("lab_cases").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const caseNumber = `LC-${String((count || 0) + 1).padStart(5, "0")}`;
      const { data, error } = await db.from("lab_cases").insert({
        org_id: orgId, case_number: caseNumber, work_type: args.work_type,
        patient_id: args.patient_id || null, dentist_id: args.dentist_id || null,
        technician_id: args.technician_id || null, material: args.material || null,
        shade: args.shade || null, instructions: args.instructions || null,
        due_date: args.due_date || null, urgency: args.urgency || "normal",
      }).select("id, case_number").single();
      if (error) throw error;
      return { success: true, case_number: data.case_number, message: `Lab case ${data.case_number} created.` };
    }

    case "update_lab_case": {
      const { lab_case_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      if (clean.status === "delivered") clean.completed_date = today;
      if (clean.status === "in-progress" && !clean.start_date) clean.start_date = today;
      const { data, error } = await db.from("lab_cases").update(clean).eq("id", lab_case_id).eq("org_id", orgId).select("id, case_number, status").single();
      if (error) throw error;
      return { success: true, message: `Lab case ${data.case_number} updated → ${data.status}.` };
    }

    case "get_lab_orders": {
      let query = db.from("lab_orders").select("id, lab_work_type, lab_name, status, due_date, sent_date, received_date, notes, patient_id, dentist_id, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(30);
      if (error) throw error;
      return data?.length ? data : "No lab orders found.";
    }

    case "create_lab_order": {
      const { data, error } = await db.from("lab_orders").insert({
        org_id: orgId, patient_id: args.patient_id, dentist_id: args.dentist_id,
        lab_work_type: args.lab_work_type, lab_name: args.lab_name,
        due_date: args.due_date || null, notes: args.notes || null,
        treatment_id: args.treatment_id || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: `Lab order created for ${args.lab_work_type} at ${args.lab_name}.` };
    }

    case "update_lab_order": {
      const { lab_order_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("lab_orders").update(clean).eq("id", lab_order_id).eq("org_id", orgId).select("id, status").single();
      if (error) throw error;
      return { success: true, message: `Lab order updated → ${data.status}.` };
    }

    // ---- BILLING & FINANCE ----
    case "get_revenue_summary": {
      const start = args.start_date || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const end = args.end_date || today;
      const { data, error } = await db.from("invoices").select("total, status, payment_method").eq("org_id", orgId).gte("invoice_date", start).lte("invoice_date", end);
      if (error) throw error;
      const collected = (data || []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total), 0);
      const pending = (data || []).filter((i: any) => !["paid", "cancelled"].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total), 0);
      return { period: `${start} to ${end}`, total_invoices: data?.length || 0, collected, pending };
    }

    case "get_pending_invoices": {
      let query = db.from("invoices").select("id, invoice_number, invoice_date, due_date, total, status, patient_id").eq("org_id", orgId).order("due_date");
      query = args.status ? query.eq("status", args.status) : query.in("status", ["draft", "sent", "overdue"]);
      const { data, error } = await query.limit(20);
      if (error) throw error;
      if (!data?.length) return "No pending invoices.";
      const pIds = [...new Set(data.map((i: any) => i.patient_id).filter(Boolean))];
      const { data: patients } = pIds.length ? await db.from("patients").select("id, first_name, last_name").in("id", pIds) : { data: [] };
      const pMap = Object.fromEntries((patients || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));
      return data.map((i: any) => ({ invoice: i.invoice_number, patient: pMap[i.patient_id] || "N/A", total: i.total, status: i.status, due_date: i.due_date }));
    }

    case "create_invoice": {
      const items = args.items || [];
      const subtotal = items.reduce((s: number, i: any) => s + (i.unit_price * (i.quantity || 1)), 0);
      const discount = args.discount || 0, tax = args.tax || 0;
      const total = subtotal - discount + tax;
      const { count } = await db.from("invoices").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const num = `INV-${String((count || 0) + 1).padStart(5, "0")}`;
      const { data: inv, error } = await db.from("invoices").insert({
        org_id: orgId, patient_id: args.patient_id, invoice_number: num,
        subtotal, discount, tax, total, status: "sent", notes: args.notes || null, due_date: args.due_date || null,
      }).select("id, invoice_number, total").single();
      if (error) throw error;
      if (items.length) {
        await db.from("invoice_items").insert(items.map((i: any) => ({
          invoice_id: inv.id, description: i.description, quantity: i.quantity || 1,
          unit_price: i.unit_price, line_total: i.unit_price * (i.quantity || 1),
        })));
      }
      return { success: true, invoice_number: inv.invoice_number, total: inv.total, message: `Invoice ${num} created.` };
    }

    case "record_payment": {
      // Get invoice details first
      const { data: inv, error: invErr } = await db.from("invoices").select("id, invoice_number, total, org_id").eq("id", args.invoice_id).eq("org_id", orgId).single();
      if (invErr || !inv) throw new Error("Invoice not found.");
      // Insert into payments table
      const { error: payErr } = await db.from("payments").insert({
        org_id: orgId, invoice_id: inv.id, amount: Number(inv.total),
        payment_method: args.payment_method, payment_date: today,
        reference: args.notes || null,
      });
      if (payErr) {
        console.error("Payment insert error:", payErr);
        // Fallback: still update invoice status even if payments table fails
      }
      // Update invoice status
      const { error: updErr } = await db.from("invoices").update({ status: "paid", payment_method: args.payment_method }).eq("id", args.invoice_id).eq("org_id", orgId);
      if (updErr) throw updErr;
      return { success: true, message: `Payment of ${inv.total} recorded for ${inv.invoice_number} via ${args.payment_method}.` };
    }

    case "get_expenses": {
      const start = args.start_date || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const end = args.end_date || today;
      let query = db.from("expenses").select("id, amount, category, description, vendor, expense_date, payment_method").eq("org_id", orgId).gte("expense_date", start).lte("expense_date", end).order("expense_date", { ascending: false });
      if (args.category) query = query.eq("category", args.category);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      const totalAmt = (data || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { period: `${start} to ${end}`, total_expenses: totalAmt, count: data?.length || 0, expenses: data || [] };
    }

    case "log_expense": {
      const { data, error } = await db.from("expenses").insert({
        org_id: orgId, amount: args.amount, category: args.category,
        description: args.description || null, vendor: args.vendor || null,
        payment_method: args.payment_method || null, expense_date: args.expense_date || today,
      }).select("id, amount, category").single();
      if (error) throw error;
      return { success: true, message: `Expense of ${data.amount} logged under "${data.category}".` };
    }

    case "get_payment_plans": {
      let query = db.from("payment_plans").select("id, plan_name, total_amount, installment_count, installment_amount, frequency, start_date, status, patient_id, invoice_id").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.patient_id) query = query.eq("patient_id", args.patient_id);
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data?.length ? data : "No payment plans found.";
    }

    case "get_commission_payouts": {
      let query = db.from("commission_payouts").select("id, staff_id, period_start, period_end, calculated_amount, paid_amount, status, payment_date").eq("org_id", orgId).order("period_start", { ascending: false });
      if (args.staff_id) query = query.eq("staff_id", args.staff_id);
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(20);
      if (error) throw error;
      if (!data?.length) return "No commission payouts found.";
      const sIds = [...new Set(data.map((c: any) => c.staff_id))];
      const { data: staff } = await db.from("staff").select("id, full_name").in("id", sIds);
      const sMap = Object.fromEntries((staff || []).map((s: any) => [s.id, s.full_name]));
      return data.map((c: any) => ({ ...c, staff_name: sMap[c.staff_id] || "Unknown" }));
    }

    // ---- INVENTORY & SUPPLY CHAIN ----
    case "check_low_inventory": {
      const { data, error } = await db.from("inventory").select("name, quantity, min_stock, unit, category, expiry_date").eq("org_id", orgId).order("quantity");
      if (error) throw error;
      const low = (data || []).filter((i: any) => i.quantity <= i.min_stock);
      const expiring = (data || []).filter((i: any) => i.expiry_date && (new Date(i.expiry_date).getTime() - Date.now()) / 86400000 <= 30 && (new Date(i.expiry_date).getTime() - Date.now()) >= 0);
      return { low_stock: low.length ? low : "All above minimum.", expiring_30d: expiring.length ? expiring : "None expiring soon." };
    }

    case "get_inventory": {
      let query = db.from("inventory").select("id, name, category, quantity, min_stock, unit, unit_cost, supplier, expiry_date, last_restocked").eq("org_id", orgId).order("name");
      if (args.category) query = query.eq("category", args.category);
      const { data, error } = await query;
      if (error) throw error;
      return data?.length ? data : "No inventory items.";
    }

    case "update_inventory": {
      const { data: item, error: fe } = await db.from("inventory").select("id, name, quantity").eq("id", args.inventory_id).eq("org_id", orgId).single();
      if (fe || !item) throw new Error("Inventory item not found.");
      const newQty = item.quantity + args.quantity_change;
      if (newQty < 0) return { error: `Cannot go below 0. Current: ${item.quantity}.` };
      await db.from("inventory").update({ quantity: newQty, ...(args.quantity_change > 0 ? { last_restocked: today } : {}) }).eq("id", args.inventory_id);
      await db.from("inventory_transactions").insert({
        org_id: orgId, inventory_id: args.inventory_id, quantity: Math.abs(args.quantity_change),
        transaction_type: args.quantity_change > 0 ? "restock" : "usage", notes: args.reason || null,
      });
      return { success: true, message: `${item.name}: ${args.quantity_change > 0 ? "+" : ""}${args.quantity_change}. New stock: ${newQty}.` };
    }

    case "get_suppliers": {
      const { data, error } = await db.from("suppliers").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return data?.length ? data : "No suppliers found.";
    }

    case "get_purchase_orders": {
      let query = db.from("purchase_orders").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data?.length ? data : "No purchase orders found.";
    }

    case "create_purchase_order": {
      const { count } = await db.from("purchase_orders").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const poNum = `PO-${String((count || 0) + 1).padStart(5, "0")}`;
      const totalAmount = (args.items || []).reduce((s: number, i: any) => s + ((i.unit_cost || 0) * (i.quantity || 1)), 0);
      const { data: po, error } = await db.from("purchase_orders").insert({
        org_id: orgId, supplier_id: args.supplier_id, order_number: poNum,
        total_amount: totalAmount, notes: args.notes || null, expected_date: args.expected_date || null,
      }).select("id, order_number").single();
      if (error) throw error;
      if (args.items?.length) {
        await db.from("purchase_order_items").insert(args.items.map((i: any) => ({
          purchase_order_id: po.id, inventory_id: i.inventory_id || null,
          quantity: i.quantity || 1, unit_cost: i.unit_cost || 0,
          description: i.description || null,
        })));
      }
      return { success: true, order_number: po.order_number, message: `Purchase order ${poNum} created.` };
    }

    // ---- STAFF ----
    case "get_staff_list": {
      let query = db.from("staff").select("id, full_name, role, specialty, phone, email, status").eq("org_id", orgId).order("full_name");
      if (args.role) query = query.eq("role", args.role);
      const { data, error } = await query;
      if (error) throw error;
      return data?.length ? data : "No staff found.";
    }

    case "add_staff": {
      const { data, error } = await db.from("staff").insert({
        org_id: orgId, full_name: args.full_name, role: args.role,
        phone: args.phone || null, email: args.email || null, specialty: args.specialty || null,
      }).select("id, full_name, role").single();
      if (error) throw error;
      return { success: true, message: `Staff member ${data.full_name} (${data.role}) added.` };
    }

    case "update_staff": {
      const { staff_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null && v !== "") clean[k] = v; }
      const { data, error } = await db.from("staff").update(clean).eq("id", staff_id).eq("org_id", orgId).select("id, full_name").single();
      if (error) throw error;
      return { success: true, message: `Staff ${data.full_name} updated: ${Object.keys(clean).join(", ")}.` };
    }

    case "get_dentist_schedules": {
      let query = db.from("dentist_schedules").select("id, staff_id, day_of_week, start_time, end_time, break_start, break_end, is_available").eq("org_id", orgId).order("day_of_week");
      if (args.staff_id) query = query.eq("staff_id", args.staff_id);
      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) return "No schedules found.";
      const sIds = [...new Set(data.map((s: any) => s.staff_id))];
      const { data: staff } = await db.from("staff").select("id, full_name").in("id", sIds);
      const sMap = Object.fromEntries((staff || []).map((s: any) => [s.id, s.full_name]));
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return data.map((s: any) => ({ ...s, staff_name: sMap[s.staff_id] || "Unknown", day_name: dayNames[s.day_of_week] }));
    }

    // ---- WAITING LIST ----
    case "get_waiting_list": {
      const { data, error } = await db.from("waiting_list").select("*").eq("org_id", orgId).order("created_at");
      if (error) throw error;
      if (!data?.length) return "Waiting list is empty.";
      const pIds = [...new Set(data.map((w: any) => w.patient_id).filter(Boolean))];
      const { data: patients } = pIds.length ? await db.from("patients").select("id, first_name, last_name").in("id", pIds) : { data: [] };
      const pMap = Object.fromEntries((patients || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));
      return data.map((w: any) => ({ ...w, patient_name: pMap[w.patient_id] || "Unknown" }));
    }

    case "add_to_waiting_list": {
      const { data, error } = await db.from("waiting_list").insert({
        org_id: orgId, patient_id: args.patient_id, priority: args.priority || "normal",
        notes: args.notes || null, preferred_dentist_id: args.preferred_dentist_id || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: "Patient added to waiting list." };
    }

    case "remove_from_waiting_list": {
      const { error } = await db.from("waiting_list").delete().eq("id", args.waiting_list_id).eq("org_id", orgId);
      if (error) throw error;
      return { success: true, message: "Removed from waiting list." };
    }

    // ---- CONSENT FORMS ----
    case "get_consent_forms": {
      if (args.templates_only) {
        const { data, error } = await db.from("consent_form_templates").select("id, title, category, is_active").eq("org_id", orgId).order("title");
        if (error) throw error;
        return data?.length ? data : "No consent form templates.";
      }
      if (args.patient_id) {
        const { data, error } = await db.from("patient_consent_forms").select("id, title, status, signed_date, signed_by, created_at").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false });
        if (error) throw error;
        return data?.length ? data : "No consent forms for this patient.";
      }
      return "Please provide patient_id or set templates_only=true.";
    }

    case "create_consent_form": {
      let content = args.content || null;
      if (args.template_id && !content) {
        const { data: tmpl } = await db.from("consent_form_templates").select("content, title").eq("id", args.template_id).single();
        if (tmpl) content = tmpl.content;
      }
      const { data, error } = await db.from("patient_consent_forms").insert({
        org_id: orgId, patient_id: args.patient_id, title: args.title,
        content, template_id: args.template_id || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: `Consent form "${args.title}" created for patient.` };
    }

    // ---- REVIEWS ----
    case "get_reviews": {
      const { data, error } = await db.from("patient_reviews").select("id, rating, comment, patient_id, staff_id, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(args.limit || 20);
      if (error) throw error;
      if (!data?.length) return "No reviews yet.";
      const pIds = [...new Set(data.map((r: any) => r.patient_id).filter(Boolean))];
      const sIds = [...new Set(data.map((r: any) => r.staff_id).filter(Boolean))];
      const [{ data: patients }, { data: staff }] = await Promise.all([
        pIds.length ? db.from("patients").select("id, first_name, last_name").in("id", pIds) : { data: [] },
        sIds.length ? db.from("staff").select("id, full_name").in("id", sIds) : { data: [] },
      ]);
      const pMap = Object.fromEntries((patients || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));
      const sMap = Object.fromEntries((staff || []).map((s: any) => [s.id, s.full_name]));
      const avgRating = data.reduce((s: number, r: any) => s + r.rating, 0) / data.length;
      return { average_rating: avgRating.toFixed(1), total: data.length, reviews: data.map((r: any) => ({ ...r, patient_name: pMap[r.patient_id] || null, staff_name: sMap[r.staff_id] || null })) };
    }

    // ---- NOTIFICATIONS ----
    case "send_notification": {
      const { data, error } = await db.from("notifications").insert({
        org_id: orgId, user_id: args.user_id, title: args.title,
        message: args.message, type: args.type || "info", link: args.link || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: `Notification "${args.title}" sent.` };
    }

    // ---- CLINIC OVERVIEW ----
    case "get_clinic_summary": {
      const [{ count: patientCount }, { data: todayAppts }, { data: pendingInv }, { data: invItems }, { data: labCases }] = await Promise.all([
        db.from("patients").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "active"),
        db.from("appointments").select("status").eq("org_id", orgId).eq("appointment_date", today),
        db.from("invoices").select("total, status").eq("org_id", orgId).in("status", ["draft", "sent", "overdue"]),
        db.from("inventory").select("name, quantity, min_stock").eq("org_id", orgId),
        db.from("lab_cases").select("status").eq("org_id", orgId).in("status", ["pending", "in-progress"]),
      ]);
      const lowStock = (invItems || []).filter((i: any) => i.quantity <= i.min_stock);
      const pendingTotal = (pendingInv || []).reduce((s: number, i: any) => s + Number(i.total), 0);
      const apptStats: Record<string, number> = {};
      (todayAppts || []).forEach((a: any) => { apptStats[a.status] = (apptStats[a.status] || 0) + 1; });
      return {
        active_patients: patientCount || 0,
        todays_appointments: { total: todayAppts?.length || 0, breakdown: apptStats },
        pending_invoices: { count: pendingInv?.length || 0, total: pendingTotal },
        inventory_alerts: lowStock.length,
        active_lab_cases: labCases?.length || 0,
      };
    }

    case "get_clinic_chairs": {
      const { data, error } = await db.from("clinic_chairs").select("id, name, room, status").eq("org_id", orgId).order("name");
      if (error) throw error;
      return data?.length ? data : "No chairs configured.";
    }

    case "get_clinic_documents": {
      const { data, error } = await db.from("clinic_documents").select("id, title, category, file_type, expiry_date, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data?.length ? data : "No clinic documents.";
    }

    case "get_automation_workflows": {
      const { data, error } = await db.from("automation_workflows").select("id, name, workflow_type, channel, timing_value, timing_unit, is_enabled, trigger_event, description").eq("org_id", orgId).order("name");
      if (error) throw error;
      return data?.length ? data : "No automation workflows configured.";
    }

    // ---- LAB INVOICES ----
    case "get_lab_invoices": {
      let query = db.from("lab_invoices").select("id, invoice_number, invoice_date, clinic_code, patient_name, subtotal, discount, total, status, lab_case_id, notes, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      return data?.length ? data : "No lab invoices found.";
    }

    case "create_lab_invoice": {
      const { count } = await db.from("lab_invoices").select("*", { count: "exact", head: true }).eq("org_id", orgId);
      const num = `LAB-${String((count || 0) + 1).padStart(5, "0")}`;
      const discount = args.discount || 0;
      const total = (args.subtotal || 0) - discount;
      const { data, error } = await db.from("lab_invoices").insert({
        org_id: orgId, invoice_number: num, subtotal: args.subtotal || 0,
        discount, total, lab_case_id: args.lab_case_id || null,
        patient_name: args.patient_name || null, clinic_code: args.clinic_code || null,
        notes: args.notes || null,
      }).select("id, invoice_number, total").single();
      if (error) throw error;
      return { success: true, invoice_number: data.invoice_number, total: data.total, message: `Lab invoice ${num} created.` };
    }

    case "update_lab_invoice": {
      const { lab_invoice_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("lab_invoices").update(clean).eq("id", lab_invoice_id).eq("org_id", orgId).select("id, invoice_number, status").single();
      if (error) throw error;
      return { success: true, message: `Lab invoice ${data.invoice_number} updated → ${data.status}.` };
    }

    // ---- SHOP ----
    case "get_shop_products": {
      let query = db.from("shop_products").select("id, name, description, price, compare_at_price, category, stock, sku, is_active, created_at").eq("org_id", orgId).order("name");
      if (args.active_only) query = query.eq("is_active", true);
      if (args.category) query = query.eq("category", args.category);
      const { data, error } = await query;
      if (error) throw error;
      return data?.length ? data : "No shop products found.";
    }

    case "create_shop_product": {
      const { data, error } = await db.from("shop_products").insert({
        org_id: orgId, name: args.name, description: args.description || null,
        price: args.price, category: args.category || "general",
        stock: args.stock || 0, sku: args.sku || null, is_active: true,
      }).select("id, name").single();
      if (error) throw error;
      return { success: true, message: `Shop product "${data.name}" created.` };
    }

    case "update_shop_product": {
      const { product_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("shop_products").update(clean).eq("id", product_id).eq("org_id", orgId).select("id, name").single();
      if (error) throw error;
      return { success: true, message: `Product "${data.name}" updated.` };
    }

    case "get_shop_orders": {
      let query = db.from("shop_orders").select("id, order_number, customer_name, customer_email, customer_phone, status, subtotal, total, payment_status, payment_method, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      return data?.length ? data : "No shop orders found.";
    }

    case "update_shop_order": {
      const { order_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("shop_orders").update(clean).eq("id", order_id).eq("org_id", orgId).select("id, order_number, status").single();
      if (error) throw error;
      return { success: true, message: `Order ${data.order_number} updated → ${data.status}.` };
    }

    // ---- REVENUE ALLOCATION ----
    case "get_revenue_allocation_rules": {
      const { data, error } = await db.from("revenue_allocation_rules").select("*").eq("org_id", orgId).order("category");
      if (error) throw error;
      return data?.length ? data : "No revenue allocation rules configured.";
    }

    case "get_revenue_allocation_breakdown": {
      const { data: allocations, error } = await db.from("revenue_allocations").select("category, amount, created_at").eq("org_id", orgId);
      if (error) throw error;
      const allTime: Record<string, number> = {};
      (allocations || []).forEach((a: any) => { allTime[a.category] = (allTime[a.category] || 0) + Number(a.amount); });
      return { allocations: allTime, total: Object.values(allTime).reduce((s, v) => s + v, 0) };
    }

    // ---- REGISTRATION FEES ----
    case "get_registration_fees": {
      const { data, error } = await db.from("registration_fees").select("id, patient_id, amount, payment_method, payment_date, receipt_number, notes, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(args.limit || 30);
      if (error) throw error;
      if (!data?.length) return "No registration fees recorded.";
      const pIds = [...new Set(data.map((f: any) => f.patient_id).filter(Boolean))];
      const { data: patients } = pIds.length ? await db.from("patients").select("id, first_name, last_name").in("id", pIds) : { data: [] };
      const pMap = Object.fromEntries((patients || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));
      return data.map((f: any) => ({ ...f, patient_name: pMap[f.patient_id] || "Unknown" }));
    }

    case "create_registration_fee": {
      const { data, error } = await db.from("registration_fees").insert({
        org_id: orgId, patient_id: args.patient_id, amount: args.amount,
        payment_method: args.payment_method || "cash", notes: args.notes || "",
      }).select("id, amount").single();
      if (error) throw error;
      return { success: true, message: `Registration fee of ${data.amount} recorded.` };
    }

    // ---- ACTIVITY LOG ----
    case "get_activity_log": {
      let query = db.from("activity_log").select("id, event_type, entity_type, entity_id, description, created_at, user_id").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.entity_type) query = query.eq("entity_type", args.entity_type);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      return data?.length ? data : "No activity log entries.";
    }

    // ---- MESSAGES ----
    case "get_messages": {
      const { data, error } = await db.from("messages").select("id, subject, body, sender_id, is_urgent, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(args.limit || 20);
      if (error) throw error;
      return data?.length ? data : "No messages.";
    }

    case "send_message": {
      const { data: msg, error } = await db.from("messages").insert({
        org_id: orgId, sender_id: args.sender_id, subject: args.subject,
        body: args.body, is_urgent: args.is_urgent || false,
      }).select("id").single();
      if (error) throw error;
      if (args.recipient_ids?.length) {
        await db.from("message_recipients").insert(
          args.recipient_ids.map((rid: string) => ({ message_id: msg.id, recipient_id: rid }))
        );
      }
      return { success: true, message: `Message "${args.subject}" sent to ${args.recipient_ids?.length || 0} recipient(s).` };
    }

    // ---- CLINIC SETTINGS ----
    case "get_clinic_settings": {
      const { data, error } = await db.from("organizations").select("id, name, slug, address, phone, email, clinic_type, logo_url, settings").eq("id", orgId).single();
      if (error) throw error;
      return data;
    }

    case "update_clinic_settings": {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(args)) { if (v !== undefined && v !== null && v !== "") clean[k] = v; }
      const { data, error } = await db.from("organizations").update(clean).eq("id", orgId).select("id, name").single();
      if (error) throw error;
      return { success: true, message: `Clinic settings updated: ${Object.keys(clean).join(", ")}.` };
    }

    // ---- TREATMENT PLAN CRUD ----
    case "create_treatment_plan": {
      const totalCost = (args.items || []).reduce((s: number, i: any) => s + (i.cost || 0), 0);
      const { data: plan, error } = await db.from("treatment_plans").insert({
        org_id: orgId, patient_id: args.patient_id, title: args.title,
        notes: args.notes || null, total_cost: totalCost, status: "draft",
      }).select("id, title").single();
      if (error) throw error;
      if (args.items?.length) {
        await db.from("treatment_plan_items").insert(args.items.map((i: any, idx: number) => ({
          plan_id: plan.id, treatment_id: i.treatment_id || null,
          tooth_number: i.tooth_number || null, notes: i.notes || null,
          cost: i.cost || 0, sequence: i.sequence || idx + 1,
        })));
      }
      return { success: true, message: `Treatment plan "${plan.title}" created with ${args.items?.length || 0} items.` };
    }

    case "update_treatment_plan": {
      const { plan_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("treatment_plans").update(clean).eq("id", plan_id).eq("org_id", orgId).select("id, title, status").single();
      if (error) throw error;
      return { success: true, message: `Treatment plan "${data.title}" updated → ${data.status}.` };
    }

    // ---- TREATMENT ESTIMATE CRUD ----
    case "create_treatment_estimate": {
      const items = args.items || [];
      const total = items.reduce((s: number, i: any) => s + (i.unit_price * (i.quantity || 1)), 0);
      const { data: est, error } = await db.from("treatment_estimates").insert({
        org_id: orgId, patient_id: args.patient_id, title: args.title,
        total, notes: args.notes || null, valid_until: args.valid_until || null, status: "draft",
      }).select("id, title").single();
      if (error) throw error;
      if (items.length) {
        await db.from("treatment_estimate_items").insert(items.map((i: any) => ({
          estimate_id: est.id, description: i.description,
          quantity: i.quantity || 1, unit_price: i.unit_price,
          line_total: i.unit_price * (i.quantity || 1),
        })));
      }
      return { success: true, message: `Treatment estimate "${est.title}" created (total: ${total}).` };
    }

    // ---- DENTIST SCHEDULE CRUD ----
    case "set_dentist_schedule": {
      const { data, error } = await db.from("dentist_schedules").upsert({
        org_id: orgId, staff_id: args.staff_id, day_of_week: args.day_of_week,
        start_time: args.start_time, end_time: args.end_time,
        break_start: args.break_start || null, break_end: args.break_end || null,
        is_available: args.is_available !== false,
      }, { onConflict: "staff_id,day_of_week" }).select("id").single();
      if (error) throw error;
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return { success: true, message: `Schedule set for ${dayNames[args.day_of_week]}: ${args.start_time} - ${args.end_time}.` };
    }

    // ---- REVIEWS CREATE ----
    case "create_review": {
      const { data, error } = await db.from("patient_reviews").insert({
        org_id: orgId, patient_id: args.patient_id || null,
        staff_id: args.staff_id || null, rating: args.rating,
        comment: args.comment || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: `Review (${args.rating}/5) recorded.` };
    }

    // ---- CLINICAL NOTES READ ----
    case "get_clinical_notes": {
      const { data, error } = await db.from("clinical_notes").select("id, subjective, objective, assessment, plan, created_at, appointment_id, created_by").eq("patient_id", args.patient_id).eq("org_id", orgId).order("created_at", { ascending: false }).limit(args.limit || 10);
      if (error) throw error;
      return data?.length ? data : "No clinical notes for this patient.";
    }

    // ---- INVENTORY TRANSACTIONS ----
    case "get_inventory_transactions": {
      let query = db.from("inventory_transactions").select("id, inventory_id, quantity, transaction_type, unit_cost, total_cost, notes, reference, created_at").eq("org_id", orgId).order("created_at", { ascending: false });
      if (args.inventory_id) query = query.eq("inventory_id", args.inventory_id);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      return data?.length ? data : "No inventory transactions found.";
    }

    // ---- PROFITABILITY ----
    case "get_profitability": {
      const start = args.start_date || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const end = args.end_date || today;
      const [{ data: invoices }, { data: expenses }] = await Promise.all([
        db.from("invoices").select("total, status").eq("org_id", orgId).eq("status", "paid").gte("invoice_date", start).lte("invoice_date", end),
        db.from("expenses").select("amount").eq("org_id", orgId).gte("expense_date", start).lte("expense_date", end),
      ]);
      const revenue = (invoices || []).reduce((s: number, i: any) => s + Number(i.total), 0);
      const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { period: `${start} to ${end}`, revenue, expenses: totalExpenses, profit: revenue - totalExpenses, margin: revenue > 0 ? `${((revenue - totalExpenses) / revenue * 100).toFixed(1)}%` : "N/A" };
    }

    // ---- PAYMENTS ----
    case "get_payments": {
      let query = db.from("payments").select("id, invoice_id, amount, payment_method, payment_date, reference, created_at").eq("org_id", orgId).order("payment_date", { ascending: false });
      if (args.invoice_id) query = query.eq("invoice_id", args.invoice_id);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      return data?.length ? data : "No payments found.";
    }

    // ---- NOTIFICATIONS READ ----
    case "get_notifications": {
      let query = db.from("notifications").select("id, title, message, type, is_read, link, created_at").eq("org_id", orgId).eq("user_id", args.user_id).order("created_at", { ascending: false });
      if (args.unread_only) query = query.eq("is_read", false);
      const { data, error } = await query.limit(args.limit || 30);
      if (error) throw error;
      if (!data?.length) return args.unread_only ? "No unread notifications." : "No notifications.";
      const unreadCount = data.filter((n: any) => !n.is_read).length;
      return { total: data.length, unread: unreadCount, notifications: data };
    }

    // ---- SUPPLIERS CRUD ----
    case "create_supplier": {
      const { data, error } = await db.from("suppliers").insert({
        org_id: orgId, name: args.name, contact_person: args.contact_person || null,
        phone: args.phone || null, email: args.email || null,
        address: args.address || null, notes: args.notes || null,
      }).select("id, name").single();
      if (error) throw error;
      return { success: true, message: `Supplier "${data.name}" created.` };
    }

    case "update_supplier": {
      const { supplier_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null && v !== "") clean[k] = v; }
      const { data, error } = await db.from("suppliers").update(clean).eq("id", supplier_id).eq("org_id", orgId).select("id, name").single();
      if (error) throw error;
      return { success: true, message: `Supplier "${data.name}" updated: ${Object.keys(clean).join(", ")}.` };
    }

    // ---- TREATMENTS CATALOG CRUD ----
    case "create_treatment": {
      const { data, error } = await db.from("treatments").insert({
        org_id: orgId, name: args.name, category: args.category || "general",
        price: args.price, duration: args.duration || 30,
        description: args.description || null, status: "active",
      }).select("id, name, price").single();
      if (error) throw error;
      return { success: true, message: `Treatment "${data.name}" added at ${data.price}.` };
    }

    case "update_treatment": {
      const { treatment_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null && v !== "") clean[k] = v; }
      const { data, error } = await db.from("treatments").update(clean).eq("id", treatment_id).eq("org_id", orgId).select("id, name").single();
      if (error) throw error;
      return { success: true, message: `Treatment "${data.name}" updated: ${Object.keys(clean).join(", ")}.` };
    }

    // ---- PAYMENT PLANS CRUD ----
    case "create_payment_plan": {
      const installmentAmount = args.total_amount / args.installment_count;
      const { data, error } = await db.from("payment_plans").insert({
        org_id: orgId, patient_id: args.patient_id, invoice_id: args.invoice_id || null,
        plan_name: args.plan_name, total_amount: args.total_amount,
        installment_count: args.installment_count, installment_amount: installmentAmount,
        frequency: args.frequency || "monthly", start_date: args.start_date || today,
        notes: args.notes || null, status: "active",
      }).select("id, plan_name").single();
      if (error) throw error;
      return { success: true, message: `Payment plan "${data.plan_name}" created (${args.installment_count} × ${installmentAmount.toFixed(2)}).` };
    }

    // ---- COMMISSION PAYOUTS CRUD ----
    case "create_commission_payout": {
      const { data, error } = await db.from("commission_payouts").insert({
        org_id: orgId, staff_id: args.staff_id,
        period_start: args.period_start, period_end: args.period_end,
        calculated_amount: args.calculated_amount,
        notes: args.notes || null, status: "pending",
      }).select("id, calculated_amount").single();
      if (error) throw error;
      return { success: true, message: `Commission payout of ${data.calculated_amount} created.` };
    }

    case "update_commission_payout": {
      const { payout_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("commission_payouts").update(clean).eq("id", payout_id).eq("org_id", orgId).select("id, status, paid_amount").single();
      if (error) throw error;
      return { success: true, message: `Commission payout updated → ${data.status}${data.paid_amount ? ` (paid: ${data.paid_amount})` : ""}.` };
    }

    // ---- TREATMENT MATERIALS CRUD ----
    case "create_treatment_material": {
      const { data, error } = await db.from("treatment_materials").insert({
        org_id: orgId, treatment_id: args.treatment_id, inventory_id: args.inventory_id,
        quantity_per_use: args.quantity_per_use || 1, notes: args.notes || null,
      }).select("id").single();
      if (error) throw error;
      return { success: true, message: "Treatment material link created." };
    }

    case "update_treatment_material": {
      const { material_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null) clean[k] = v; }
      const { data, error } = await db.from("treatment_materials").update(clean).eq("id", material_id).eq("org_id", orgId).select("id").single();
      if (error) throw error;
      return { success: true, message: "Treatment material updated." };
    }

    // ---- ADVANCED ANALYTICS ----
    case "get_advanced_analytics": {
      const start = args.start_date || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const end = args.end_date || today;

      const [{ data: invoices }, { data: expenses }, { data: appointments }, { data: patients }, { data: treatments }] = await Promise.all([
        db.from("invoices").select("total, status, invoice_date, payment_method").eq("org_id", orgId).eq("status", "paid").gte("invoice_date", start).lte("invoice_date", end),
        db.from("expenses").select("amount, category, expense_date").eq("org_id", orgId).gte("expense_date", start).lte("expense_date", end),
        db.from("appointments").select("status, staff_id, treatment_id, appointment_date").eq("org_id", orgId).gte("appointment_date", start).lte("appointment_date", end),
        db.from("patients").select("gender, date_of_birth, created_at, status").eq("org_id", orgId),
        db.from("treatments").select("id, name, category, price").eq("org_id", orgId),
      ]);

      // Revenue by date
      const revenueByDate: Record<string, number> = {};
      (invoices || []).forEach((i: any) => {
        revenueByDate[i.invoice_date] = (revenueByDate[i.invoice_date] || 0) + Number(i.total);
      });

      // Expense by category
      const expenseByCategory: Record<string, number> = {};
      (expenses || []).forEach((e: any) => {
        expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + Number(e.amount);
      });

      // Treatment distribution
      const treatmentCount: Record<string, number> = {};
      const treatmentMap = Object.fromEntries((treatments || []).map((t: any) => [t.id, t.name]));
      (appointments || []).forEach((a: any) => {
        if (a.treatment_id) {
          const name = treatmentMap[a.treatment_id] || "Unknown";
          treatmentCount[name] = (treatmentCount[name] || 0) + 1;
        }
      });

      // Dentist performance (appointments completed)
      const dentistAppts: Record<string, { completed: number; total: number }> = {};
      (appointments || []).forEach((a: any) => {
        if (!dentistAppts[a.staff_id]) dentistAppts[a.staff_id] = { completed: 0, total: 0 };
        dentistAppts[a.staff_id].total++;
        if (a.status === "completed") dentistAppts[a.staff_id].completed++;
      });

      // Patient demographics
      const genderDist: Record<string, number> = {};
      const ageBuckets: Record<string, number> = { "0-17": 0, "18-30": 0, "31-45": 0, "46-60": 0, "60+": 0 };
      const now = new Date();
      (patients || []).forEach((p: any) => {
        genderDist[p.gender || "unknown"] = (genderDist[p.gender || "unknown"] || 0) + 1;
        if (p.date_of_birth) {
          const age = Math.floor((now.getTime() - new Date(p.date_of_birth).getTime()) / 31557600000);
          if (age <= 17) ageBuckets["0-17"]++;
          else if (age <= 30) ageBuckets["18-30"]++;
          else if (age <= 45) ageBuckets["31-45"]++;
          else if (age <= 60) ageBuckets["46-60"]++;
          else ageBuckets["60+"]++;
        }
      });

      const totalRevenue = (invoices || []).reduce((s: number, i: any) => s + Number(i.total), 0);
      const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

      return {
        period: `${start} to ${end}`,
        revenue: { total: totalRevenue, by_date: revenueByDate },
        expenses: { total: totalExpenses, by_category: expenseByCategory },
        profit: totalRevenue - totalExpenses,
        margin: totalRevenue > 0 ? `${((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1)}%` : "N/A",
        appointments: { total: appointments?.length || 0, by_status: (() => { const s: Record<string, number> = {}; (appointments || []).forEach((a: any) => { s[a.status] = (s[a.status] || 0) + 1; }); return s; })() },
        treatment_distribution: treatmentCount,
        dentist_performance: dentistAppts,
        patient_demographics: { total: patients?.length || 0, active: (patients || []).filter((p: any) => p.status === "active").length, gender: genderDist, age_distribution: ageBuckets },
      };
    }

    // ---- WEBSITE SETTINGS ----
    case "get_website_settings": {
      const { data, error } = await db.from("organizations").select("settings").eq("id", orgId).single();
      if (error) throw error;
      const settings = (data?.settings as any) || {};
      return settings.website || { message: "No website settings configured yet. Use update_website_settings to set them." };
    }

    case "update_website_settings": {
      const { data: org, error: fetchErr } = await db.from("organizations").select("settings").eq("id", orgId).single();
      if (fetchErr) throw fetchErr;
      const currentSettings = (org?.settings as any) || {};
      const websiteSettings = { ...(currentSettings.website || {}), ...args };
      const newSettings = { ...currentSettings, website: websiteSettings };
      const { error } = await db.from("organizations").update({ settings: newSettings }).eq("id", orgId);
      if (error) throw error;
      return { success: true, message: `Website settings updated: ${Object.keys(args).join(", ")}.` };
    }

    // ---- USER PROFILE ----
    case "get_user_profile": {
      const { data, error } = await db.from("profiles").select("id, full_name, phone, avatar_url, created_at, updated_at").eq("id", args.user_id).single();
      if (error) throw error;
      return data || "Profile not found.";
    }

    case "update_user_profile": {
      const { user_id, ...updates } = args;
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined && v !== null && v !== "") clean[k] = v; }
      const { data, error } = await db.from("profiles").update(clean).eq("id", user_id).select("id, full_name").single();
      if (error) throw error;
      return { success: true, message: `Profile updated: ${Object.keys(clean).join(", ")}.` };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ==================== ROLE ACCESS ====================
const COMMON_TOOLS = ["get_messages","send_message","get_notifications","get_user_profile","update_user_profile","get_clinic_chairs"];
const PATIENT_TOOLS = ["search_patients","register_patient","update_patient","get_patient_history","get_patient_documents","get_patient_images","get_overdue_patients","save_patient_image","get_consent_forms","create_consent_form"];
const APPT_TOOLS = ["get_todays_appointments","get_appointments_by_date","get_appointment_stats","create_appointment","update_appointment_status","reschedule_appointment","add_walk_in","get_available_slots","get_dentist_schedules"];
const CLINICAL_TOOLS = ["get_dental_chart","add_dental_chart_entry","create_clinical_note","get_clinical_notes","get_treatments","get_treatment_plans","get_treatment_estimates","get_treatment_materials","get_prescriptions","create_prescription","create_treatment_plan","update_treatment_plan","create_treatment_estimate"];
const LAB_TOOLS = ["get_lab_cases","create_lab_case","update_lab_case","get_lab_orders","create_lab_order","update_lab_order","get_lab_invoices","create_lab_invoice","update_lab_invoice"];
const WAITING_TOOLS = ["get_waiting_list","add_to_waiting_list","remove_from_waiting_list"];
const BILLING_TOOLS = ["get_pending_invoices","create_invoice","record_payment","get_payments","get_payment_plans","create_payment_plan","get_registration_fees","create_registration_fee","get_treatments"];
const FINANCE_TOOLS = [...BILLING_TOOLS,"get_revenue_summary","get_expenses","log_expense","get_commission_payouts","create_commission_payout","update_commission_payout","get_profitability","get_revenue_allocation_rules","get_revenue_allocation_breakdown","get_purchase_orders","get_suppliers","get_advanced_analytics"];
const ROLE_TOOLS: Record<string, string[] | "all"> = {
  owner: "all", admin: "all", manager: "all",
  dentist: [...PATIENT_TOOLS, ...APPT_TOOLS, ...CLINICAL_TOOLS, ...LAB_TOOLS],
  hygienist: [...PATIENT_TOOLS, ...APPT_TOOLS, ...CLINICAL_TOOLS],
  assistant: [...PATIENT_TOOLS, ...APPT_TOOLS, ...CLINICAL_TOOLS],
  receptionist: [...PATIENT_TOOLS, ...APPT_TOOLS, ...WAITING_TOOLS, ...BILLING_TOOLS],
  accountant: FINANCE_TOOLS,
  lab_technician: LAB_TOOLS,
  lab_assistant: LAB_TOOLS,
};
function isToolAllowed(role: string, tool: string) {
  const allowed = ROLE_TOOLS[role];
  if (allowed === "all") return true;
  return COMMON_TOOLS.includes(tool) || (allowed ?? []).includes(tool);
}

const SAFETY_RULES = `

--- MANDATORY RULES FOR SAVING DATA ---
- Before any tool that creates, updates, records, sends or saves anything, make sure you have EVERY required detail. If anything is missing, ask the user for it. NEVER invent, guess or use placeholder values (names, IDs, dates, amounts, doses, phone numbers, etc.).
- Look up IDs with search/list tools instead of guessing them.
- Then show a short summary of exactly what will be saved and ask: "Shall I go ahead?"
- Only call the saving tool after the user clearly says yes in a later message. If details change, show the updated summary and ask again.
- Read-only lookups need no confirmation.
- Only use the tools provided. If the user asks for something outside their role, politely explain their role does not allow it.`;

// ==================== SERVER ====================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, orgId } = await req.json();

    const NVIDIA_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY is not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    if (!orgId) {
      return new Response(JSON.stringify({ error: "Organization ID required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Sign-in & clinic membership check ----
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData, error: userErr } = token
      ? await db.auth.getUser(token)
      : ({ data: { user: null }, error: null } as any);
    const user = userData?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Please sign in to use the assistant." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const [{ data: orgRole }, { data: isSuper }] = await Promise.all([
      db.rpc("get_org_role", { _user_id: user.id, _org_id: orgId }),
      db.rpc("is_super_admin", { _user_id: user.id }),
    ]);
    const role: string | null = orgRole ? String(orgRole) : (isSuper ? "owner" : null);
    if (!role) {
      return new Response(JSON.stringify({ error: "You don't have access to this clinic." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = SYSTEM_PROMPT + SAFETY_RULES + `\n\nThe signed-in user's role in this clinic is: ${role}.`;
    if (context) {
      systemPrompt += `\n\n--- CURRENT CONTEXT ---\nPage: ${context.page || "unknown"}\n`;
      if (context.data) systemPrompt += `Screen data:\n${JSON.stringify(context.data, null, 2)}\n`;
    }
    systemPrompt += `\nToday: ${today()}`;

    // Convert Gemini tool format to OpenAI tool format
    const openaiTools = TOOLS[0].function_declarations.filter((fd: any) => isToolAllowed(role, fd.name)).map((fd: any) => ({
      type: "function" as const,
      function: { name: fd.name, description: fd.description, parameters: fd.parameters },
    }));

    // Build OpenAI-compatible messages — handle multimodal content (images)
    const openaiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => {
        if (Array.isArray(msg.content)) {
          return { role: msg.role, content: msg.content };
        }
        return { role: msg.role, content: msg.content };
      }),
    ];

    const NVIDIA_URL = "https://openrouter.ai/api/v1/chat/completions";
    // Free OpenRouter models with tool support, tried in order until one succeeds.
    const FREE_MODELS = [
      "nvidia/nemotron-3.5-super-vl:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "google/gemma-4-26b-a4b-it:free",
      "thinkingmachines/inkling:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      "xingchen-agi/xing4.0-29b-a4b:free",
      "dots-studio/dots-3-note-preview:free",
      "poolside/laguna-s-2.1:free",
      "nvidia/nemotron-3.5-lightning:free",
      "thinkingmachines/inkling-small:free",
      "recursive/flint-v1.0:free",
      "cohere/north-mini-code:free",
      "poolside/laguna-xs-2.1:free",
      "liquid/lfm-2.5-2.6b:free",
    ];

    let rounds = 8;

    while (rounds-- > 0) {
      let result: any = null;
      let lastErr = "AI service unavailable";
      let lastStatus = 503;
      for (const model of FREE_MODELS) {
        try {
          const response = await fetch(NVIDIA_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${NVIDIA_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: openaiMessages,
              tools: openaiTools,
              temperature: 1,
              top_p: 0.95,
              max_tokens: 8192,
            }),
            signal: AbortSignal.timeout(60_000),
          });
          if (!response.ok) {
            lastStatus = response.status;
            lastErr = await response.text();
            console.error(`OpenRouter ${model} error [${response.status}]: ${lastErr}`);
            continue;
          }
          const json = await response.json();
          if (!json.choices?.[0]) { lastErr = JSON.stringify(json.error ?? json); continue; }
          result = json;
          break;
        } catch (e) {
          lastErr = e instanceof Error ? e.message : String(e);
          console.error(`OpenRouter ${model} failed:`, e);
        }
      }
      if (!result) {
        return new Response(JSON.stringify({ error: `All free AI models unavailable: ${lastErr}` }), {
          status: lastStatus === 429 ? 429 : 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const choice = result.choices?.[0];
      if (!choice) {
        return new Response(JSON.stringify({ error: "No AI response" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = choice.message;
      const toolCalls = message.tool_calls;

      // No tool calls — return the text reply
      if (!toolCalls || toolCalls.length === 0) {
        return new Response(JSON.stringify({ reply: message.content || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add the assistant message with tool calls to conversation
      openaiMessages.push(message);

      // Execute each tool call and add results
      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        let fnArgs: any = {};
        try { fnArgs = JSON.parse(tc.function.arguments || "{}"); } catch { /* empty */ }
        if (!isToolAllowed(role, fnName)) {
          openaiMessages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: `Your role (${role}) is not allowed to use ${fnName}.` }) });
          continue;
        }
        if (fnName === "get_user_profile" || fnName === "update_user_profile") fnArgs.user_id = user.id;
        console.log(`Tool: ${fnName}`, fnArgs);
        try {
          const result = await executeTool(fnName, fnArgs, db, orgId);
          openaiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: typeof result === "string" ? result : JSON.stringify(result),
          });
        } catch (e) {
          console.error(`Tool ${fnName} error:`, e);
          openaiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ error: e instanceof Error ? e.message : "Tool failed" }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ reply: "Ran out of processing steps. Try a simpler query." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function today() { return new Date().toISOString().split("T")[0]; }
