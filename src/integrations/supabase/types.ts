export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          org_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          org_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          chair: string | null
          created_at: string
          id: string
          is_walk_in: boolean
          notes: string | null
          org_id: string
          patient_id: string
          staff_id: string
          status: string
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          chair?: string | null
          created_at?: string
          id?: string
          is_walk_in?: boolean
          notes?: string | null
          org_id: string
          patient_id: string
          staff_id: string
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          chair?: string | null
          created_at?: string
          id?: string
          is_walk_in?: boolean
          notes?: string | null
          org_id?: string
          patient_id?: string
          staff_id?: string
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      associate_contracts: {
        Row: {
          commission_rate: number
          compensation_basis: string
          contract_status: string
          created_at: string
          daily_minimum: number
          end_date: string | null
          id: string
          is_active: boolean
          lab_fee_share: number
          notes: string | null
          org_id: string
          payout_frequency: string
          staff_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          compensation_basis?: string
          contract_status?: string
          created_at?: string
          daily_minimum?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          lab_fee_share?: number
          notes?: string | null
          org_id: string
          payout_frequency?: string
          staff_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          compensation_basis?: string
          contract_status?: string
          created_at?: string
          daily_minimum?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          lab_fee_share?: number
          notes?: string | null
          org_id?: string
          payout_frequency?: string
          staff_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "associate_contracts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associate_contracts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          channel: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          message: string | null
          org_id: string
          patient_id: string | null
          sent_at: string
          status: string
          workflow_id: string | null
        }
        Insert: {
          channel?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          org_id: string
          patient_id?: string | null
          sent_at?: string
          status?: string
          workflow_id?: string | null
        }
        Update: {
          channel?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          org_id?: string
          patient_id?: string | null
          sent_at?: string
          status?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          channel: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          message_template: string
          name: string
          org_id: string
          timing_unit: string
          timing_value: number
          trigger_event: string | null
          updated_at: string
          workflow_type: string
        }
        Insert: {
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          message_template?: string
          name: string
          org_id: string
          timing_unit?: string
          timing_value?: number
          trigger_event?: string | null
          updated_at?: string
          workflow_type: string
        }
        Update: {
          channel?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          message_template?: string
          name?: string
          org_id?: string
          timing_unit?: string
          timing_value?: number
          trigger_event?: string | null
          updated_at?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          id: string
          invoice_id: string | null
          org_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          id?: string
          invoice_id?: string | null
          org_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          id?: string
          invoice_id?: string | null
          org_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          auto_generated: boolean
          body: Json
          category: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          prompt: string | null
          published_at: string | null
          read_minutes: number
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean
          body?: Json
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          prompt?: string | null
          published_at?: string | null
          read_minutes?: number
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean
          body?: Json
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          prompt?: string | null
          published_at?: string | null
          read_minutes?: number
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_autopilot: {
        Row: {
          cron_token: string
          enabled: boolean
          id: number
          last_result: string | null
          last_run_at: string | null
          locked_until: string | null
          paused_reason: string | null
          updated_at: string
        }
        Insert: {
          cron_token?: string
          enabled?: boolean
          id?: number
          last_result?: string | null
          last_run_at?: string | null
          locked_until?: string | null
          paused_reason?: string | null
          updated_at?: string
        }
        Update: {
          cron_token?: string
          enabled?: boolean
          id?: number
          last_result?: string | null
          last_run_at?: string | null
          locked_until?: string | null
          paused_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          org_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_chairs: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
          room: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
          room?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          room?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_chairs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_documents: {
        Row: {
          category: string | null
          created_at: string
          expiry_date: string | null
          file_type: string | null
          file_url: string
          id: string
          org_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          org_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          org_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          notes: string | null
          org_id: string
          payment_status: string
          plan_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          notes?: string | null
          org_id: string
          payment_status?: string
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          payment_status?: string
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_wallets: {
        Row: {
          balance: number
          org_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          org_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_wallets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_note_addenda: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          id: string
          note_id: string
          org_id: string
          reason: string
        }
        Insert: {
          author_id?: string
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          note_id: string
          org_id: string
          reason: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          note_id?: string
          org_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_note_addenda_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "clinical_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          created_at: string
          created_by: string | null
          id: string
          objective: string | null
          org_id: string
          patient_id: string
          plan: string | null
          signed_at: string | null
          signed_by: string | null
          subjective: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          objective?: string | null
          org_id: string
          patient_id: string
          plan?: string | null
          signed_at?: string | null
          signed_by?: string | null
          subjective?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          objective?: string | null
          org_id?: string
          patient_id?: string
          plan?: string | null
          signed_at?: string | null
          signed_by?: string | null
          subjective?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payout_items: {
        Row: {
          commission_rate: number
          created_at: string
          deduction_amount: number
          description: string
          earned_amount: number
          gross_amount: number
          id: string
          item_date: string | null
          item_type: string
          net_amount: number
          org_id: string
          patient_id: string | null
          payout_id: string
          source_id: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          deduction_amount?: number
          description: string
          earned_amount?: number
          gross_amount?: number
          id?: string
          item_date?: string | null
          item_type?: string
          net_amount?: number
          org_id: string
          patient_id?: string | null
          payout_id: string
          source_id?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          deduction_amount?: number
          description?: string
          earned_amount?: number
          gross_amount?: number
          id?: string
          item_date?: string | null
          item_type?: string
          net_amount?: number
          org_id?: string
          patient_id?: string | null
          payout_id?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payout_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payout_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "commission_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payouts: {
        Row: {
          calculated_amount: number
          created_at: string
          id: string
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          org_id: string
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          reference: string | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          calculated_amount?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          org_id: string
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          reference?: string | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          calculated_amount?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          org_id?: string
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          reference?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_form_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_form_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lens_fittings: {
        Row: {
          aftercare_date: string | null
          base_curve: number | null
          created_at: string
          diameter: number | null
          fit_assessment: string | null
          fitter_id: string | null
          fitting_date: string
          id: string
          lens_brand: string | null
          lens_type: string | null
          modality: string | null
          notes: string | null
          org_id: string
          patient_id: string
          power_od: number | null
          power_os: number | null
          status: string
          updated_at: string
        }
        Insert: {
          aftercare_date?: string | null
          base_curve?: number | null
          created_at?: string
          diameter?: number | null
          fit_assessment?: string | null
          fitter_id?: string | null
          fitting_date?: string
          id?: string
          lens_brand?: string | null
          lens_type?: string | null
          modality?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          power_od?: number | null
          power_os?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          aftercare_date?: string | null
          base_curve?: number | null
          created_at?: string
          diameter?: number | null
          fit_assessment?: string | null
          fitter_id?: string | null
          fitting_date?: string
          id?: string
          lens_brand?: string | null
          lens_type?: string | null
          modality?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          power_od?: number | null
          power_os?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_lens_fittings_fitter_id_fkey"
            columns: ["fitter_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_lens_fittings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_lens_fittings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_chart_entries: {
        Row: {
          condition: string | null
          created_at: string
          dentist_id: string | null
          entry_date: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          procedure: string
          surface: string | null
          tooth_number: string
          updated_at: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          dentist_id?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          procedure: string
          surface?: string | null
          tooth_number: string
          updated_at?: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          dentist_id?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          procedure?: string
          surface?: string | null
          tooth_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_chart_entries_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_chart_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_chart_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          org_id: string
          staff_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_available?: boolean
          org_id: string
          staff_id: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          org_id?: string
          staff_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentist_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          invoice_id: string | null
          is_recurring: boolean
          next_due_date: string | null
          org_id: string
          patient_id: string | null
          payment_method: string | null
          receipt_url: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          invoice_id?: string | null
          is_recurring?: boolean
          next_due_date?: string | null
          org_id: string
          patient_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          invoice_id?: string | null
          is_recurring?: boolean
          next_due_date?: string | null
          org_id?: string
          patient_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      eye_diagnostics: {
        Row: {
          created_at: string
          eye: string
          eye_exam_id: string | null
          file_name: string | null
          file_url: string | null
          findings: string | null
          id: string
          org_id: string
          patient_id: string
          performed_by: string | null
          study_date: string
          study_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          eye?: string
          eye_exam_id?: string | null
          file_name?: string | null
          file_url?: string | null
          findings?: string | null
          id?: string
          org_id: string
          patient_id: string
          performed_by?: string | null
          study_date?: string
          study_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          eye?: string
          eye_exam_id?: string | null
          file_name?: string | null
          file_url?: string | null
          findings?: string | null
          id?: string
          org_id?: string
          patient_id?: string
          performed_by?: string | null
          study_date?: string
          study_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eye_diagnostics_eye_exam_id_fkey"
            columns: ["eye_exam_id"]
            isOneToOne: false
            referencedRelation: "eye_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eye_diagnostics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eye_diagnostics_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eye_diagnostics_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      eye_exams: {
        Row: {
          anterior_segment_od: string | null
          anterior_segment_os: string | null
          appointment_id: string | null
          cd_ratio_od: number | null
          cd_ratio_os: number | null
          chief_complaint: string | null
          created_at: string
          diagnosis: string | null
          dilated: boolean
          exam_date: string
          examiner_id: string | null
          fundus_od: string | null
          fundus_os: string | null
          id: string
          iop_method: string | null
          iop_od: number | null
          iop_os: number | null
          notes: string | null
          org_id: string
          patient_id: string
          plan: string | null
          pupils_od: string | null
          pupils_os: string | null
          updated_at: string
          va_aided_od: string | null
          va_aided_os: string | null
          va_pinhole_od: string | null
          va_pinhole_os: string | null
          va_unaided_od: string | null
          va_unaided_os: string | null
        }
        Insert: {
          anterior_segment_od?: string | null
          anterior_segment_os?: string | null
          appointment_id?: string | null
          cd_ratio_od?: number | null
          cd_ratio_os?: number | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          dilated?: boolean
          exam_date?: string
          examiner_id?: string | null
          fundus_od?: string | null
          fundus_os?: string | null
          id?: string
          iop_method?: string | null
          iop_od?: number | null
          iop_os?: number | null
          notes?: string | null
          org_id: string
          patient_id: string
          plan?: string | null
          pupils_od?: string | null
          pupils_os?: string | null
          updated_at?: string
          va_aided_od?: string | null
          va_aided_os?: string | null
          va_pinhole_od?: string | null
          va_pinhole_os?: string | null
          va_unaided_od?: string | null
          va_unaided_os?: string | null
        }
        Update: {
          anterior_segment_od?: string | null
          anterior_segment_os?: string | null
          appointment_id?: string | null
          cd_ratio_od?: number | null
          cd_ratio_os?: number | null
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          dilated?: boolean
          exam_date?: string
          examiner_id?: string | null
          fundus_od?: string | null
          fundus_os?: string | null
          id?: string
          iop_method?: string | null
          iop_od?: number | null
          iop_os?: number | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          plan?: string | null
          pupils_od?: string | null
          pupils_os?: string | null
          updated_at?: string
          va_aided_od?: string | null
          va_aided_os?: string | null
          va_pinhole_od?: string | null
          va_pinhole_os?: string | null
          va_unaided_od?: string | null
          va_unaided_os?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eye_exams_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eye_exams_examiner_id_fkey"
            columns: ["examiner_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eye_exams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eye_exams_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      eye_frames: {
        Row: {
          brand: string
          colour: string | null
          cost_price: number | null
          created_at: string
          gender: string | null
          id: string
          material: string | null
          model: string | null
          org_id: string
          quantity: number
          reorder_level: number
          sell_price: number | null
          size: string | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          colour?: string | null
          cost_price?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          material?: string | null
          model?: string | null
          org_id: string
          quantity?: number
          reorder_level?: number
          sell_price?: number | null
          size?: string | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          colour?: string | null
          cost_price?: number | null
          created_at?: string
          gender?: string | null
          id?: string
          material?: string | null
          model?: string | null
          org_id?: string
          quantity?: number
          reorder_level?: number
          sell_price?: number | null
          size?: string | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eye_lens_stock: {
        Row: {
          coating: string | null
          cost_price: number | null
          created_at: string
          id: string
          lens_index: string | null
          lens_type: string
          org_id: string
          power_range: string | null
          quantity: number
          reorder_level: number
          sell_price: number | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          coating?: string | null
          cost_price?: number | null
          created_at?: string
          id?: string
          lens_index?: string | null
          lens_type: string
          org_id: string
          power_range?: string | null
          quantity?: number
          reorder_level?: number
          sell_price?: number | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          coating?: string | null
          cost_price?: number | null
          created_at?: string
          id?: string
          lens_index?: string | null
          lens_type?: string
          org_id?: string
          power_range?: string | null
          quantity?: number
          reorder_level?: number
          sell_price?: number | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eye_referrals: {
        Row: {
          contact: string | null
          created_at: string
          direction: string
          facility: string | null
          feedback: string | null
          id: string
          org_id: string
          patient_id: string
          practitioner: string | null
          reason: string | null
          referral_date: string
          specialty: string | null
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          direction?: string
          facility?: string | null
          feedback?: string | null
          id?: string
          org_id: string
          patient_id: string
          practitioner?: string | null
          reason?: string | null
          referral_date?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          direction?: string
          facility?: string | null
          feedback?: string | null
          id?: string
          org_id?: string
          patient_id?: string
          practitioner?: string | null
          reason?: string | null
          referral_date?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          target_org_ids: string[] | null
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          target_org_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          target_org_ids?: string[] | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          amount_claimed: number
          amount_paid: number
          claim_number: string | null
          created_at: string
          created_by: string | null
          id: string
          insurer_name: string
          invoice_id: string
          notes: string | null
          org_id: string
          paid_date: string | null
          patient_id: string | null
          policy_number: string | null
          status: string
          submitted_date: string | null
          updated_at: string
        }
        Insert: {
          amount_claimed?: number
          amount_paid?: number
          claim_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          insurer_name: string
          invoice_id: string
          notes?: string | null
          org_id: string
          paid_date?: string | null
          patient_id?: string | null
          policy_number?: string | null
          status?: string
          submitted_date?: string | null
          updated_at?: string
        }
        Update: {
          amount_claimed?: number
          amount_paid?: number
          claim_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          insurer_name?: string
          invoice_id?: string
          notes?: string | null
          org_id?: string
          paid_date?: string | null
          patient_id?: string | null
          policy_number?: string | null
          status?: string
          submitted_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          batch_no: string | null
          category: string
          created_at: string
          expiry_date: string | null
          id: string
          last_restocked: string | null
          location: string | null
          min_stock: number
          name: string
          org_id: string
          preferred_supplier_id: string | null
          quantity: number
          reorder_qty: number | null
          sku: string | null
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          batch_no?: string | null
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          location?: string | null
          min_stock?: number
          name: string
          org_id: string
          preferred_supplier_id?: string | null
          quantity?: number
          reorder_qty?: number | null
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          batch_no?: string | null
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          location?: string | null
          min_stock?: number
          name?: string
          org_id?: string
          preferred_supplier_id?: string | null
          quantity?: number
          reorder_qty?: number | null
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          appointment_id: string | null
          balance_after: number | null
          balance_before: number | null
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          notes: string | null
          org_id: string
          other_org_id: string | null
          patient_id: string | null
          po_id: string | null
          quantity: number
          reference: string | null
          total_cost: number | null
          transaction_type: string
          transfer_id: string | null
          treatment_id: string | null
          unit_cost: number | null
        }
        Insert: {
          appointment_id?: string | null
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          org_id: string
          other_org_id?: string | null
          patient_id?: string | null
          po_id?: string | null
          quantity: number
          reference?: string | null
          total_cost?: number | null
          transaction_type: string
          transfer_id?: string | null
          treatment_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          appointment_id?: string | null
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          org_id?: string
          other_org_id?: string | null
          patient_id?: string | null
          po_id?: string | null
          quantity?: number
          reference?: string | null
          total_cost?: number | null
          transaction_type?: string
          transfer_id?: string | null
          treatment_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_other_org_id_fkey"
            columns: ["other_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_adjustments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          kind: string
          org_id: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          kind?: string
          org_id: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          kind?: string
          org_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_adjustments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_adjustments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cdt_code: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          provider_id: string | null
          quantity: number
          secondary_provider_id: string | null
          split_ratio: number
          surfaces: string | null
          tooth_number: string | null
          treatment_id: string | null
          unit_price: number
        }
        Insert: {
          cdt_code?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          provider_id?: string | null
          quantity?: number
          secondary_provider_id?: string | null
          split_ratio?: number
          surfaces?: string | null
          tooth_number?: string | null
          treatment_id?: string | null
          unit_price?: number
        }
        Update: {
          cdt_code?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          provider_id?: string | null
          quantity?: number
          secondary_provider_id?: string | null
          split_ratio?: number
          surfaces?: string | null
          tooth_number?: string | null
          treatment_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_secondary_provider_id_fkey"
            columns: ["secondary_provider_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          discount: number
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          org_id: string
          patient_id: string | null
          payment_method: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          org_id: string
          patient_id?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          org_id?: string
          patient_id?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_allocation_rules: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          percentage: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          percentage: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_allocation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_case_history: {
        Row: {
          case_id: string
          changed_by: string | null
          created_at: string
          field_changed: string
          from_status: string | null
          id: string
          org_id: string
          reason: string | null
          to_status: string | null
        }
        Insert: {
          case_id: string
          changed_by?: string | null
          created_at?: string
          field_changed?: string
          from_status?: string | null
          id?: string
          org_id: string
          reason?: string | null
          to_status?: string | null
        }
        Update: {
          case_id?: string
          changed_by?: string | null
          created_at?: string
          field_changed?: string
          from_status?: string | null
          id?: string
          org_id?: string
          reason?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_case_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "lab_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_cases: {
        Row: {
          assigned_technician_id: string | null
          case_number: string | null
          client_type: string
          clinic_code: string | null
          clinic_doctor_name: string | null
          clinic_fee: number | null
          completed_date: string | null
          created_at: string
          delivered_date: string | null
          dentist_id: string | null
          discount: number
          due_date: string | null
          external_client_email: string | null
          external_client_name: string | null
          external_client_phone: string | null
          external_contact_person: string | null
          external_patient_name: string | null
          hold_at: string | null
          hold_days_total: number
          hold_reason: string | null
          id: string
          instructions: string | null
          is_paid: boolean
          is_urgent: boolean
          job_description: string | null
          job_instructions: string[] | null
          lab_fee: number | null
          labor_seconds_total: number
          material: string | null
          notes: string | null
          org_id: string
          parent_case_id: string | null
          patient_id: string | null
          qc_status: string | null
          remake_count: number
          remark: string | null
          shade: string | null
          shade_map: Json
          start_date: string | null
          status: string
          technician_id: string | null
          teeth: string[]
          tooth_roles: Json
          treatment_id: string | null
          updated_at: string
          urgency: string | null
          work_type: string
        }
        Insert: {
          assigned_technician_id?: string | null
          case_number?: string | null
          client_type?: string
          clinic_code?: string | null
          clinic_doctor_name?: string | null
          clinic_fee?: number | null
          completed_date?: string | null
          created_at?: string
          delivered_date?: string | null
          dentist_id?: string | null
          discount?: number
          due_date?: string | null
          external_client_email?: string | null
          external_client_name?: string | null
          external_client_phone?: string | null
          external_contact_person?: string | null
          external_patient_name?: string | null
          hold_at?: string | null
          hold_days_total?: number
          hold_reason?: string | null
          id?: string
          instructions?: string | null
          is_paid?: boolean
          is_urgent?: boolean
          job_description?: string | null
          job_instructions?: string[] | null
          lab_fee?: number | null
          labor_seconds_total?: number
          material?: string | null
          notes?: string | null
          org_id: string
          parent_case_id?: string | null
          patient_id?: string | null
          qc_status?: string | null
          remake_count?: number
          remark?: string | null
          shade?: string | null
          shade_map?: Json
          start_date?: string | null
          status?: string
          technician_id?: string | null
          teeth?: string[]
          tooth_roles?: Json
          treatment_id?: string | null
          updated_at?: string
          urgency?: string | null
          work_type: string
        }
        Update: {
          assigned_technician_id?: string | null
          case_number?: string | null
          client_type?: string
          clinic_code?: string | null
          clinic_doctor_name?: string | null
          clinic_fee?: number | null
          completed_date?: string | null
          created_at?: string
          delivered_date?: string | null
          dentist_id?: string | null
          discount?: number
          due_date?: string | null
          external_client_email?: string | null
          external_client_name?: string | null
          external_client_phone?: string | null
          external_contact_person?: string | null
          external_patient_name?: string | null
          hold_at?: string | null
          hold_days_total?: number
          hold_reason?: string | null
          id?: string
          instructions?: string | null
          is_paid?: boolean
          is_urgent?: boolean
          job_description?: string | null
          job_instructions?: string[] | null
          lab_fee?: number | null
          labor_seconds_total?: number
          material?: string | null
          notes?: string | null
          org_id?: string
          parent_case_id?: string | null
          patient_id?: string | null
          qc_status?: string | null
          remake_count?: number
          remark?: string | null
          shade?: string | null
          shade_map?: Json
          start_date?: string | null
          status?: string
          technician_id?: string | null
          teeth?: string[]
          tooth_roles?: Json
          treatment_id?: string | null
          updated_at?: string
          urgency?: string | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_cases_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_cases_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_cases_parent_case_id_fkey"
            columns: ["parent_case_id"]
            isOneToOne: false
            referencedRelation: "lab_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_cases_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_cases_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_invoices: {
        Row: {
          amount_paid: number
          clinic_code: string | null
          clinic_doctor_name: string | null
          created_at: string
          discount: number
          id: string
          invoice_date: string
          invoice_number: string
          lab_case_id: string | null
          notes: string | null
          org_id: string
          patient_name: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          clinic_code?: string | null
          clinic_doctor_name?: string | null
          created_at?: string
          discount?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          lab_case_id?: string | null
          notes?: string | null
          org_id: string
          patient_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          clinic_code?: string | null
          clinic_doctor_name?: string | null
          created_at?: string
          discount?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          lab_case_id?: string | null
          notes?: string | null
          org_id?: string
          patient_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_invoices_lab_case_id_fkey"
            columns: ["lab_case_id"]
            isOneToOne: false
            referencedRelation: "lab_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          created_at: string
          dentist_id: string
          due_date: string | null
          id: string
          lab_name: string
          lab_work_type: string
          notes: string | null
          org_id: string
          patient_id: string
          received_date: string | null
          sent_date: string | null
          status: string
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          due_date?: string | null
          id?: string
          lab_name: string
          lab_work_type: string
          notes?: string | null
          org_id: string
          patient_id: string
          received_date?: string | null
          sent_date?: string | null
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          due_date?: string | null
          id?: string
          lab_name?: string
          lab_work_type?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          received_date?: string | null
          sent_date?: string | null
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_records: {
        Row: {
          amount: number
          case_id: string | null
          created_at: string
          data: Json
          id: string
          kind: string
          org_id: string
          record_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          case_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind: string
          org_id: string
          record_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          case_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          org_id?: string
          record_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_records_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "lab_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_serial_counters: {
        Row: {
          kind: string
          last_number: number
          org_id: string
          year: number
        }
        Insert: {
          kind: string
          last_number?: number
          org_id: string
          year: number
        }
        Update: {
          kind?: string
          last_number?: number
          org_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "lab_serial_counters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_settings: {
        Row: {
          created_at: string
          daily_capacity: number
          holidays: string[]
          id: string
          org_id: string
          report_footer: string | null
          report_header: string | null
          require_approval: boolean
          serial_prefix: string
          sla_hours: number
          updated_at: string
          working_days: number[]
        }
        Insert: {
          created_at?: string
          daily_capacity?: number
          holidays?: string[]
          id?: string
          org_id: string
          report_footer?: string | null
          report_header?: string | null
          require_approval?: boolean
          serial_prefix?: string
          sla_hours?: number
          updated_at?: string
          working_days?: number[]
        }
        Update: {
          created_at?: string
          daily_capacity?: number
          holidays?: string[]
          id?: string
          org_id?: string
          report_footer?: string | null
          report_header?: string | null
          require_approval?: boolean
          serial_prefix?: string
          sla_hours?: number
          updated_at?: string
          working_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "lab_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          input_type: string
          is_active: boolean
          name: string
          options: Json
          org_id: string
          price: number
          reference_range: string | null
          sort_order: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          input_type?: string
          is_active?: boolean
          name: string
          options?: Json
          org_id: string
          price?: number
          reference_range?: string | null
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          input_type?: string
          is_active?: boolean
          name?: string
          options?: Json
          org_id?: string
          price?: number
          reference_range?: string | null
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "test_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          id: string
          is_read: boolean
          message_id: string
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          id?: string
          is_read?: boolean
          message_id: string
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          id?: string
          is_read?: boolean
          message_id?: string
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_urgent: boolean
          org_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_urgent?: boolean
          org_id: string
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_urgent?: boolean
          org_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          id: string
          lab_completion_alerts: boolean
          low_stock_alerts: boolean
          payment_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          id?: string
          lab_completion_alerts?: boolean
          low_stock_alerts?: boolean
          payment_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          id?: string
          lab_completion_alerts?: boolean
          low_stock_alerts?: boolean
          payment_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          org_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          org_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          org_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_dental_history: {
        Row: {
          amount_paid: number
          created_at: string
          dentist_id: string | null
          history_date: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          procedure: string
          treatment: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          dentist_id?: string | null
          history_date?: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          procedure: string
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          dentist_id?: string | null
          history_date?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          procedure?: string
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_dental_history_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_dental_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_dental_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_orders: {
        Row: {
          amount_paid: number
          created_at: string
          delivered_date: string | null
          frame_brand: string | null
          frame_model: string | null
          frame_price: number
          id: string
          lab_name: string | null
          lens_coatings: string | null
          lens_price: number
          lens_type: string | null
          notes: string | null
          notified_at: string | null
          order_date: string
          order_number: string | null
          org_id: string
          patient_id: string
          prescription_id: string | null
          promised_date: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          delivered_date?: string | null
          frame_brand?: string | null
          frame_model?: string | null
          frame_price?: number
          id?: string
          lab_name?: string | null
          lens_coatings?: string | null
          lens_price?: number
          lens_type?: string | null
          notes?: string | null
          notified_at?: string | null
          order_date?: string
          order_number?: string | null
          org_id: string
          patient_id: string
          prescription_id?: string | null
          promised_date?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          delivered_date?: string | null
          frame_brand?: string | null
          frame_model?: string | null
          frame_price?: number
          id?: string
          lab_name?: string | null
          lens_coatings?: string | null
          lens_price?: number
          lens_type?: string | null
          notes?: string | null
          notified_at?: string | null
          order_date?: string
          order_number?: string | null
          org_id?: string
          patient_id?: string
          prescription_id?: string | null
          promised_date?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optical_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "optical_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_prescriptions: {
        Row: {
          add_od: number | null
          add_os: number | null
          axis_od: number | null
          axis_os: number | null
          base_curve: number | null
          created_at: string
          cylinder_od: number | null
          cylinder_os: number | null
          diameter: number | null
          expiry_date: string | null
          eye_exam_id: string | null
          id: string
          issue_date: string
          lens_brand: string | null
          notes: string | null
          org_id: string
          patient_id: string
          pd: number | null
          prescriber_id: string | null
          prism_od: string | null
          prism_os: string | null
          rx_type: string
          sphere_od: number | null
          sphere_os: number | null
          updated_at: string
        }
        Insert: {
          add_od?: number | null
          add_os?: number | null
          axis_od?: number | null
          axis_os?: number | null
          base_curve?: number | null
          created_at?: string
          cylinder_od?: number | null
          cylinder_os?: number | null
          diameter?: number | null
          expiry_date?: string | null
          eye_exam_id?: string | null
          id?: string
          issue_date?: string
          lens_brand?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          pd?: number | null
          prescriber_id?: string | null
          prism_od?: string | null
          prism_os?: string | null
          rx_type?: string
          sphere_od?: number | null
          sphere_os?: number | null
          updated_at?: string
        }
        Update: {
          add_od?: number | null
          add_os?: number | null
          axis_od?: number | null
          axis_os?: number | null
          base_curve?: number | null
          created_at?: string
          cylinder_od?: number | null
          cylinder_os?: number | null
          diameter?: number | null
          expiry_date?: string | null
          eye_exam_id?: string | null
          id?: string
          issue_date?: string
          lens_brand?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          pd?: number | null
          prescriber_id?: string | null
          prism_od?: string | null
          prism_os?: string | null
          rx_type?: string
          sphere_od?: number | null
          sphere_os?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optical_prescriptions_eye_exam_id_fkey"
            columns: ["eye_exam_id"]
            isOneToOne: false
            referencedRelation: "eye_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_prescriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_prescriptions_prescriber_id_fkey"
            columns: ["prescriber_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          clinic_type: Database["public"]["Enums"]["clinic_type"]
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          parent_org_id: string | null
          phone: string | null
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"]
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          parent_org_id?: string | null
          phone?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_type?: Database["public"]["Enums"]["clinic_type"]
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          parent_org_id?: string | null
          phone?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_campaigns: {
        Row: {
          audience: Json
          bounced_count: number
          clicked_count: number
          complained_count: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          delivered_count: number
          failed_count: number
          from_email: string
          from_name: string
          html_content: string
          id: string
          name: string
          opened_count: number
          parent_campaign_id: string | null
          plain_text: string | null
          preview_text: string | null
          reply_to: string | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          total_recipients: number
          track_clicks: boolean
          track_opens: boolean
          unique_clicked_count: number
          unique_opened_count: number
          unsubscribed_count: number
          updated_at: string
        }
        Insert: {
          audience?: Json
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          from_email?: string
          from_name?: string
          html_content?: string
          id?: string
          name: string
          opened_count?: number
          parent_campaign_id?: string | null
          plain_text?: string | null
          preview_text?: string | null
          reply_to?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number
          track_clicks?: boolean
          track_opens?: boolean
          unique_clicked_count?: number
          unique_opened_count?: number
          unsubscribed_count?: number
          updated_at?: string
        }
        Update: {
          audience?: Json
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          from_email?: string
          from_name?: string
          html_content?: string
          id?: string
          name?: string
          opened_count?: number
          parent_campaign_id?: string | null
          plain_text?: string | null
          preview_text?: string | null
          reply_to?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number
          track_clicks?: boolean
          track_opens?: boolean
          unique_clicked_count?: number
          unique_opened_count?: number
          unsubscribed_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_campaigns_parent_campaign_id_fkey"
            columns: ["parent_campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_contacts: {
        Row: {
          city: string | null
          clicks: number
          clinic_name: string | null
          created_at: string
          created_by: string | null
          email: string
          emails_sent: number
          first_name: string | null
          id: string
          last_contacted_at: string | null
          last_engaged_at: string | null
          last_name: string | null
          notes: string | null
          opens: number
          phone: string | null
          specialty: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          city?: string | null
          clicks?: number
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          emails_sent?: number
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_engaged_at?: string | null
          last_name?: string | null
          notes?: string | null
          opens?: number
          phone?: string | null
          specialty?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          city?: string | null
          clicks?: number
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          emails_sent?: number
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_engaged_at?: string | null
          last_name?: string | null
          notes?: string | null
          opens?: number
          phone?: string | null
          specialty?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      outreach_cron_config: {
        Row: {
          created_at: string
          endpoint: string
          id: boolean
          secret: string
        }
        Insert: {
          created_at?: string
          endpoint?: string
          id?: boolean
          secret?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: boolean
          secret?: string
        }
        Relationships: []
      }
      outreach_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          occurred_at: string
          payload: Json | null
          recipient_id: string | null
          source: string
          target_url: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          occurred_at?: string
          payload?: Json | null
          recipient_id?: string | null
          source?: string
          target_url?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          occurred_at?: string
          payload?: Json | null
          recipient_id?: string | null
          source?: string
          target_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "outreach_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_recipients: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          click_count: number
          clicked_at: string | null
          clinic_id: string | null
          clinic_name: string | null
          contact_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          last_user_agent: string | null
          metadata: Json
          open_count: number
          recipient_email: string
          recipient_name: string | null
          resend_email_id: string | null
          sent_at: string | null
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          click_count?: number
          clicked_at?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          last_user_agent?: string | null
          metadata?: Json
          open_count?: number
          recipient_email: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          click_count?: number
          clicked_at?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          last_user_agent?: string | null
          metadata?: Json
          open_count?: number
          recipient_email?: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_recipients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outreach_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_suppressions: {
        Row: {
          campaign_id: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          notes: string | null
          reason: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          notes?: string | null
          reason?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          notes?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_suppressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consent_forms: {
        Row: {
          content: string | null
          created_at: string
          id: string
          org_id: string
          patient_id: string
          signed_by: string | null
          signed_date: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          org_id: string
          patient_id: string
          signed_by?: string | null
          signed_date?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          org_id?: string
          patient_id?: string
          signed_by?: string | null
          signed_date?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_consent_forms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consent_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consent_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "consent_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_credits: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          kind: string
          notes: string | null
          org_id: string
          patient_id: string
          payment_method: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          kind?: string
          notes?: string | null
          org_id: string
          patient_id: string
          payment_method?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          kind?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          payment_method?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_credits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_credits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          category: string | null
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          org_id: string
          patient_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          org_id: string
          patient_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          org_id?: string
          patient_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_images: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_type: string | null
          image_url: string
          org_id: string
          patient_id: string
          tooth_number: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_type?: string | null
          image_url: string
          org_id: string
          patient_id: string
          tooth_number?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_type?: string | null
          image_url?: string
          org_id?: string
          patient_id?: string
          tooth_number?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_images_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_recalls: {
        Row: {
          created_at: string
          due_date: string
          id: string
          last_contacted_at: string | null
          notes: string | null
          org_id: string
          patient_id: string
          recall_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          recall_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          recall_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_recalls_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_recalls_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          org_id: string
          patient_id: string | null
          rating: number
          staff_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          org_id: string
          patient_id?: string | null
          rating?: number
          staff_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          org_id?: string
          patient_id?: string | null
          rating?: number
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_history: string | null
          notes: string | null
          occupation: string | null
          org_id: string
          phone: string | null
          referral_source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_history?: string | null
          notes?: string | null
          occupation?: string | null
          org_id: string
          phone?: string | null
          referral_source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_history?: string | null
          notes?: string | null
          occupation?: string | null
          org_id?: string
          phone?: string | null
          referral_source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plan_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid_date: string | null
          payment_id: string | null
          plan_id: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid_date?: string | null
          payment_id?: string | null
          plan_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid_date?: string | null
          payment_id?: string | null
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_installments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          created_at: string
          frequency: string
          id: string
          installment_amount: number
          installment_count: number
          invoice_id: string
          notes: string | null
          org_id: string
          patient_id: string | null
          plan_name: string
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          installment_amount?: number
          installment_count?: number
          invoice_id: string
          notes?: string | null
          org_id: string
          patient_id?: string | null
          plan_name?: string
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          installment_amount?: number
          installment_count?: number
          invoice_id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string | null
          plan_name?: string
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          org_id: string
          payment_date: string
          payment_method: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          org_id: string
          payment_date?: string
          payment_method?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          org_id?: string
          payment_date?: string
          payment_method?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      perio_charts: {
        Row: {
          bop_percent: number | null
          created_at: string
          created_by: string | null
          exam_date: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          teeth: Json
          updated_at: string
        }
        Insert: {
          bop_percent?: number | null
          created_at?: string
          created_by?: string | null
          exam_date?: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          teeth?: Json
          updated_at?: string
        }
        Update: {
          bop_percent?: number | null
          created_at?: string
          created_by?: string | null
          exam_date?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          teeth?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perio_charts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perio_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_dispense_items: {
        Row: {
          created_at: string
          dispense_id: string
          drug_id: string | null
          drug_name: string
          id: string
          org_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          dispense_id: string
          drug_id?: string | null
          drug_name: string
          id?: string
          org_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          dispense_id?: string
          drug_id?: string | null
          drug_name?: string
          id?: string
          org_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_dispense_items_dispense_id_fkey"
            columns: ["dispense_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_dispenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_dispense_items_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_dispense_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_dispenses: {
        Row: {
          created_at: string
          dispensed_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          org_id: string
          patient_id: string | null
          patient_name: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispensed_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          org_id: string
          patient_id?: string | null
          patient_name: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispensed_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string | null
          patient_name?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_dispenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_dispenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_dispenses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_drugs: {
        Row: {
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          form: string | null
          generic_name: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          reorder_level: number
          stock_quantity: number
          strength: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          reorder_level?: number
          stock_quantity?: number
          strength?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          reorder_level?: number
          stock_quantity?: number
          strength?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_drugs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          published_at: string | null
          target_audience: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          published_at?: string | null
          target_audience?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          published_at?: string | null
          target_audience?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      prescription_medications: {
        Row: {
          created_at: string
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication_name: string
          prescription_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_name: string
          prescription_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dentist_id: string | null
          diagnosis: string | null
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          prescription_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dentist_id?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          prescription_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          prescription_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_id: string | null
          item_name: string
          po_id: string
          quantity: number
          received_qty: number
          total: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id?: string | null
          item_name: string
          po_id: string
          quantity?: number
          received_qty?: number
          total?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string | null
          item_name?: string
          po_id?: string
          quantity?: number
          received_qty?: number
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          org_id: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          org_id: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          org_id?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_messages: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          sent_count: number
          target_org_id: string | null
          target_type: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          sent_count?: number
          target_org_id?: string | null
          target_type?: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sent_count?: number
          target_org_id?: string | null
          target_type?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registration_fees: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string | null
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_fees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_fees_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      result_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          form_id: string | null
          id: string
          org_id: string
          reason: string | null
          serial: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          form_id?: string | null
          id?: string
          org_id: string
          reason?: string | null
          serial?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          form_id?: string | null
          id?: string
          org_id?: string
          reason?: string | null
          serial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "result_audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_allocation_rules: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          percentage: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          percentage: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_allocation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_allocations: {
        Row: {
          allocation_date: string
          amount: number
          category: string
          created_at: string
          id: string
          invoice_id: string | null
          org_id: string
          rule_id: string | null
        }
        Insert: {
          allocation_date?: string
          amount: number
          category: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          org_id: string
          rule_id?: string | null
        }
        Update: {
          allocation_date?: string
          amount?: number
          category?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          org_id?: string
          rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_allocations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "revenue_allocation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          org_id: string
          scan_id: string | null
          serial: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          org_id: string
          scan_id?: string | null
          serial?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          org_id?: string
          scan_id?: string | null
          serial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_appointments: {
        Row: {
          body_part: string | null
          created_at: string
          id: string
          modality: string
          notes: string | null
          org_id: string
          patient_name: string
          phone: string | null
          scan_patient_id: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          body_part?: string | null
          created_at?: string
          id?: string
          modality: string
          notes?: string | null
          org_id: string
          patient_name: string
          phone?: string | null
          scan_patient_id?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          body_part?: string | null
          created_at?: string
          id?: string
          modality?: string
          notes?: string | null
          org_id?: string
          patient_name?: string
          phone?: string | null
          scan_patient_id?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_appointments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_appointments_scan_patient_id_fkey"
            columns: ["scan_patient_id"]
            isOneToOne: false
            referencedRelation: "scan_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          org_id: string
          scan_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          org_id: string
          scan_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          org_id?: string
          scan_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_images_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_images_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_patients: {
        Row: {
          address: string | null
          age: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          mrn: string
          notes: string | null
          org_id: string
          phone: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          age?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          mrn: string
          notes?: string | null
          org_id: string
          phone?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mrn?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_patients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body_part: string | null
          clinical_indication: string | null
          created_at: string
          created_by: string | null
          findings: string | null
          id: string
          impression: string | null
          invoice_id: string | null
          is_urgent: boolean
          modality: string
          org_id: string
          price: number
          recommendation: string | null
          referring_doctor: string | null
          reported_at: string | null
          reported_by: string | null
          scan_patient_id: string | null
          serial: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body_part?: string | null
          clinical_indication?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          impression?: string | null
          invoice_id?: string | null
          is_urgent?: boolean
          modality: string
          org_id: string
          price?: number
          recommendation?: string | null
          referring_doctor?: string | null
          reported_at?: string | null
          reported_by?: string | null
          scan_patient_id?: string | null
          serial: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body_part?: string | null
          clinical_indication?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          impression?: string | null
          invoice_id?: string | null
          is_urgent?: boolean
          modality?: string
          org_id?: string
          price?: number
          recommendation?: string | null
          referring_doctor?: string | null
          reported_at?: string | null
          reported_by?: string | null
          scan_patient_id?: string | null
          serial?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_scan_patient_id_fkey"
            columns: ["scan_patient_id"]
            isOneToOne: false
            referencedRelation: "scan_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          org_id: string
          payment_method: string | null
          payment_status: string
          shipping_address: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          org_id: string
          payment_method?: string | null
          payment_status?: string
          shipping_address?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          org_id?: string
          payment_method?: string | null
          payment_status?: string
          shipping_address?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          category: string
          compare_at_price: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          name: string
          org_id: string
          price: number
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          name: string
          org_id: string
          price?: number
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          name?: string
          org_id?: string
          price?: number
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          allowed_chairs: string[]
          created_at: string
          email: string | null
          full_name: string
          id: string
          org_id: string
          phone: string | null
          provider_type: string
          role: string
          specialty: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          allowed_chairs?: string[]
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          org_id: string
          phone?: string | null
          provider_type?: string
          role?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          allowed_chairs?: string[]
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          org_id?: string
          phone?: string | null
          provider_type?: string
          role?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_allocation_rules: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          percentage: number
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          percentage: number
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          percentage?: number
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_allocation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_allocation_rules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_revenue_allocations: {
        Row: {
          allocation_date: string
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          org_id: string
          rule_id: string | null
          staff_id: string | null
        }
        Insert: {
          allocation_date?: string
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          org_id: string
          rule_id?: string | null
          staff_id?: string | null
        }
        Update: {
          allocation_date?: string
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          org_id?: string
          rule_id?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_revenue_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_revenue_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_revenue_allocations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "staff_allocation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_revenue_allocations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean
          max_patients: number | null
          max_staff: number | null
          max_storage_mb: number | null
          name: string
          price_monthly: number
          price_yearly: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          max_patients?: number | null
          max_staff?: number | null
          max_storage_mb?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          max_patients?: number | null
          max_staff?: number | null
          max_storage_mb?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          categories: string[] | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          payment_terms: string | null
          phone: string | null
          rating: number | null
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_staff_reply: boolean
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          org_id: string | null
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          org_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          org_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_bookings: {
        Row: {
          biometry_notes: string | null
          consent_signed: boolean
          created_at: string
          eye: string
          id: string
          iol_model: string | null
          iol_power: number | null
          org_id: string
          outcome_notes: string | null
          patient_id: string
          postop_checklist: Json
          postop_notes: string | null
          preop_checklist: Json
          procedure_name: string
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          surgeon_id: string | null
          theatre: string | null
          updated_at: string
        }
        Insert: {
          biometry_notes?: string | null
          consent_signed?: boolean
          created_at?: string
          eye?: string
          id?: string
          iol_model?: string | null
          iol_power?: number | null
          org_id: string
          outcome_notes?: string | null
          patient_id: string
          postop_checklist?: Json
          postop_notes?: string | null
          preop_checklist?: Json
          procedure_name: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          surgeon_id?: string | null
          theatre?: string | null
          updated_at?: string
        }
        Update: {
          biometry_notes?: string | null
          consent_signed?: boolean
          created_at?: string
          eye?: string
          id?: string
          iol_model?: string | null
          iol_power?: number | null
          org_id?: string
          outcome_notes?: string | null
          patient_id?: string
          postop_checklist?: Json
          postop_notes?: string | null
          preop_checklist?: Json
          procedure_name?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          surgeon_id?: string | null
          theatre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgery_bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_bookings_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      test_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_form_items: {
        Row: {
          category_name: string | null
          created_at: string
          form_id: string
          id: string
          org_id: string
          price: number
          sort_order: number
          test_id: string | null
          test_name: string
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          form_id: string
          id?: string
          org_id: string
          price?: number
          sort_order?: number
          test_id?: string | null
          test_name: string
        }
        Update: {
          category_name?: string | null
          created_at?: string
          form_id?: string
          id?: string
          org_id?: string
          price?: number
          sort_order?: number
          test_id?: string | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_form_items_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "test_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_form_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_form_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_forms: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          billing_entity: string | null
          billing_type: string
          clinical_notes: string | null
          collected_at: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          is_locked: boolean
          org_id: string
          patient_age: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          patient_sex: string | null
          referring_doctor: string | null
          referring_institution: string | null
          serial: string
          specimen: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          billing_entity?: string | null
          billing_type?: string
          clinical_notes?: string | null
          collected_at?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          is_locked?: boolean
          org_id: string
          patient_age?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          patient_sex?: string | null
          referring_doctor?: string | null
          referring_institution?: string | null
          serial: string
          specimen?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          billing_entity?: string | null
          billing_type?: string
          clinical_notes?: string | null
          collected_at?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          is_locked?: boolean
          org_id?: string
          patient_age?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          patient_sex?: string | null
          referring_doctor?: string | null
          referring_institution?: string | null
          serial?: string
          specimen?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_forms_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_forms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          comment: string | null
          created_at: string
          entered_by: string | null
          form_id: string
          id: string
          item_id: string | null
          org_id: string
          test_name: string
          updated_at: string
          values: Json
        }
        Insert: {
          comment?: string | null
          created_at?: string
          entered_by?: string | null
          form_id: string
          id?: string
          item_id?: string | null
          org_id: string
          test_name: string
          updated_at?: string
          values?: Json
        }
        Update: {
          comment?: string | null
          created_at?: string
          entered_by?: string | null
          form_id?: string
          id?: string
          item_id?: string | null
          org_id?: string
          test_name?: string
          updated_at?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "test_results_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "test_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "test_form_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          line_total: number
          quantity: number
          treatment_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          id?: string
          line_total?: number
          quantity?: number
          treatment_id?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          line_total?: number
          quantity?: number
          treatment_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "treatment_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_estimate_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_estimates: {
        Row: {
          converted_invoice_id: string | null
          created_at: string
          created_by: string | null
          discount: number
          estimate_date: string
          estimate_number: string
          id: string
          insurance_amount: number
          insurer_name: string | null
          notes: string | null
          org_id: string
          patient_id: string
          signature_data: string | null
          signed_at: string | null
          signed_name: string | null
          status: string
          subtotal: number
          total: number
          treatment_plan_id: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          estimate_date?: string
          estimate_number: string
          id?: string
          insurance_amount?: number
          insurer_name?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          signature_data?: string | null
          signed_at?: string | null
          signed_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          treatment_plan_id?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          converted_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          estimate_date?: string
          estimate_number?: string
          id?: string
          insurance_amount?: number
          insurer_name?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          treatment_plan_id?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_estimates_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_estimates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_estimates_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_estimates_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_materials: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          notes: string | null
          org_id: string
          quantity_used: number
          treatment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          notes?: string | null
          org_id: string
          quantity_used?: number
          treatment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          org_id?: string
          quantity_used?: number
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_materials_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_materials_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plan_items: {
        Row: {
          cdt_code: string | null
          completed_date: string | null
          created_at: string
          description: string
          estimated_cost: number
          id: string
          insurance_amount: number
          notes: string | null
          phase: number | null
          plan_id: string
          scheduled_date: string | null
          status: string
          surfaces: string | null
          tooth_number: string | null
          treatment_id: string | null
          updated_at: string
          visit_number: number
        }
        Insert: {
          cdt_code?: string | null
          completed_date?: string | null
          created_at?: string
          description: string
          estimated_cost?: number
          id?: string
          insurance_amount?: number
          notes?: string | null
          phase?: number | null
          plan_id: string
          scheduled_date?: string | null
          status?: string
          surfaces?: string | null
          tooth_number?: string | null
          treatment_id?: string | null
          updated_at?: string
          visit_number?: number
        }
        Update: {
          cdt_code?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string
          estimated_cost?: number
          id?: string
          insurance_amount?: number
          notes?: string | null
          phase?: number | null
          plan_id?: string
          scheduled_date?: string | null
          status?: string
          surfaces?: string | null
          tooth_number?: string | null
          treatment_id?: string | null
          updated_at?: string
          visit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          acceptance_status: string
          coverage_percent: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          insurer_name: string | null
          option_group: string | null
          option_label: string | null
          org_id: string
          patient_id: string
          plan_name: string
          priority: string
          start_date: string | null
          status: string
          target_end_date: string | null
          total_estimated_cost: number
          updated_at: string
        }
        Insert: {
          acceptance_status?: string
          coverage_percent?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          insurer_name?: string | null
          option_group?: string | null
          option_label?: string | null
          org_id: string
          patient_id: string
          plan_name: string
          priority?: string
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          total_estimated_cost?: number
          updated_at?: string
        }
        Update: {
          acceptance_status?: string
          coverage_percent?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          insurer_name?: string | null
          option_group?: string | null
          option_label?: string | null
          org_id?: string
          patient_id?: string
          plan_name?: string
          priority?: string
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          total_estimated_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          category: string | null
          cdt_code: string | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          name: string
          org_id: string
          patient_name: string | null
          price: number
          site_scope: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cdt_code?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          name: string
          org_id: string
          patient_name?: string | null
          price?: number
          site_scope?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cdt_code?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          name?: string
          org_id?: string
          patient_name?: string | null
          price?: number
          site_scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          current_path: string | null
          device_type: string | null
          id: string
          ip: string | null
          is_pwa: boolean
          last_seen_at: string
          org_slug: string | null
          os: string | null
          region: string | null
          session_key: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          current_path?: string | null
          device_type?: string | null
          id?: string
          ip?: string | null
          is_pwa?: boolean
          last_seen_at?: string
          org_slug?: string | null
          os?: string | null
          region?: string | null
          session_key: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          current_path?: string | null
          device_type?: string | null
          id?: string
          ip?: string | null
          is_pwa?: boolean
          last_seen_at?: string
          org_slug?: string | null
          os?: string | null
          region?: string | null
          session_key?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          path: string | null
          session_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          path?: string | null
          session_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          session_id?: string
          visitor_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          cpu_cores: number | null
          device_memory_gb: number | null
          device_type: string | null
          duration_seconds: number
          exit_page: string | null
          fingerprint_hash: string | null
          gpu_renderer: string | null
          id: string
          ip: string | null
          is_bounced: boolean
          is_pwa: boolean
          landing_page: string | null
          last_seen_at: string
          locale: string | null
          os: string | null
          page_views_count: number
          pixel_ratio: string | null
          referrer_name: string | null
          referrer_url: string | null
          region: string | null
          screen_resolution: string | null
          session_id: string
          started_at: string
          timezone: string | null
          touch_points: number | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          cpu_cores?: number | null
          device_memory_gb?: number | null
          device_type?: string | null
          duration_seconds?: number
          exit_page?: string | null
          fingerprint_hash?: string | null
          gpu_renderer?: string | null
          id?: string
          ip?: string | null
          is_bounced?: boolean
          is_pwa?: boolean
          landing_page?: string | null
          last_seen_at?: string
          locale?: string | null
          os?: string | null
          page_views_count?: number
          pixel_ratio?: string | null
          referrer_name?: string | null
          referrer_url?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id: string
          started_at?: string
          timezone?: string | null
          touch_points?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          cpu_cores?: number | null
          device_memory_gb?: number | null
          device_type?: string | null
          duration_seconds?: number
          exit_page?: string | null
          fingerprint_hash?: string | null
          gpu_renderer?: string | null
          id?: string
          ip?: string | null
          is_bounced?: boolean
          is_pwa?: boolean
          landing_page?: string | null
          last_seen_at?: string
          locale?: string | null
          os?: string | null
          page_views_count?: number
          pixel_ratio?: string | null
          referrer_name?: string | null
          referrer_url?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string
          started_at?: string
          timezone?: string | null
          touch_points?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      waiting_list: {
        Row: {
          appointment_id: string | null
          called_time: string | null
          chair: string | null
          check_in_time: string
          completed_time: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          patient_id: string
          priority: number
          seen_time: string | null
          stage: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          called_time?: string | null
          chair?: string | null
          check_in_time?: string
          completed_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          patient_id: string
          priority?: number
          seen_time?: string | null
          stage?: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          called_time?: string | null
          chair?: string | null
          check_in_time?: string
          completed_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          priority?: number
          seen_time?: string | null
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          org_id: string
          patient_id: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          org_id: string
          patient_id?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          org_id?: string
          patient_id?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      war_chest_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          entry_date: string
          id: string
          org_id: string
          source: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          org_id: string
          source?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          org_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "war_chest_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_topup_wallet: {
        Args: { p_credits: number; p_note?: string; p_org_id: string }
        Returns: number
      }
      create_branch: {
        Args: {
          p_address?: string
          p_email?: string
          p_name: string
          p_parent_org_id: string
          p_phone?: string
          p_slug: string
        }
        Returns: string
      }
      create_org_for_new_user: {
        Args: {
          p_clinic_name: string
          p_clinic_type: Database["public"]["Enums"]["clinic_type"]
          p_slug: string
          p_user_id: string
        }
        Returns: string
      }
      create_visit_invoice: {
        Args: {
          p_lines: Json
          p_note?: string
          p_org_id: string
          p_patient_id: string
          p_plan_item_ids?: string[]
        }
        Returns: string
      }
      ensure_case_credit: {
        Args: {
          p_is_visit: boolean
          p_org: string
          p_patient: string
          p_ref: string
        }
        Returns: undefined
      }
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      get_public_result: { Args: { _serial: string }; Returns: Json }
      get_public_scan: { Args: { _serial: string }; Returns: Json }
      get_resend_api_key: { Args: never; Returns: string }
      get_staff_id_for_user: {
        Args: { _org_id: string; _user_id: string }
        Returns: string
      }
      has_org_access: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["platform_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_lab_manager: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_dentist: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      lab_batch_move: { Args: { p_moves: Json }; Returns: number }
      lab_log_labor: {
        Args: { p_case_id: string; p_seconds: number; p_stage: string }
        Returns: undefined
      }
      lab_override_qc_move: {
        Args: { p_case_id: string; p_reason: string; p_status: string }
        Returns: undefined
      }
      lab_return_stock_lot: { Args: { p_usage_id: string }; Returns: undefined }
      lab_submit_qc: {
        Args: {
          p_case_id: string
          p_data: Json
          p_qc_status: string
          p_record_status: string
          p_status: string
        }
        Returns: string
      }
      lab_use_stock_lot: {
        Args: { p_case_id: string; p_stock_id: string; p_units: number }
        Returns: string
      }
      list_org_branches: {
        Args: { p_org_id: string }
        Returns: {
          address: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          slug: string
        }[]
      }
      next_lab_serial: {
        Args: { _kind: string; _org_id: string; _prefix: string }
        Returns: string
      }
      outreach_increment_campaign: {
        Args: { p_by?: number; p_campaign_id: string; p_field: string }
        Returns: undefined
      }
      receive_purchase_order: {
        Args: { p_lines: Json; p_po_id: string }
        Returns: string
      }
      record_inventory_movement: {
        Args: {
          p_inventory_id: string
          p_notes?: string
          p_org_id: string
          p_quantity: number
          p_reference?: string
          p_type: string
          p_unit_cost?: number
        }
        Returns: string
      }
      seed_lab_allocation_rules: {
        Args: { _org_id: string }
        Returns: undefined
      }
      transfer_inventory_stock: {
        Args: {
          p_inventory_id: string
          p_notes?: string
          p_quantity: number
          p_source_org_id: string
          p_target_org_id: string
        }
        Returns: string
      }
    }
    Enums: {
      clinic_type:
        | "dental"
        | "eye"
        | "dermatology"
        | "orthopedic"
        | "pediatric"
        | "general"
        | "cardiology"
        | "ent"
        | "diagnostic"
        | "dental_lab"
      org_role:
        | "owner"
        | "admin"
        | "dentist"
        | "receptionist"
        | "hygienist"
        | "assistant"
        | "accountant"
        | "lab_technician"
        | "lab_assistant"
        | "manager"
        | "procurement_officer"
        | "nurse"
      platform_role: "super_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      clinic_type: [
        "dental",
        "eye",
        "dermatology",
        "orthopedic",
        "pediatric",
        "general",
        "cardiology",
        "ent",
        "diagnostic",
        "dental_lab",
      ],
      org_role: [
        "owner",
        "admin",
        "dentist",
        "receptionist",
        "hygienist",
        "assistant",
        "accountant",
        "lab_technician",
        "lab_assistant",
        "manager",
        "procurement_officer",
        "nurse",
      ],
      platform_role: ["super_admin", "user"],
    },
  },
} as const
