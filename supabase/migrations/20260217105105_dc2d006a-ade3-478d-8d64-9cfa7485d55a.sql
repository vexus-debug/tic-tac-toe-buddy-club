
-- Automation workflows: configurable triggers per org
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  trigger_event TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  message_template TEXT NOT NULL DEFAULT '',
  timing_value INTEGER NOT NULL DEFAULT 1,
  timing_unit TEXT NOT NULL DEFAULT 'hours',
  channel TEXT NOT NULL DEFAULT 'in_app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view workflows"
  ON public.automation_workflows FOR SELECT
  USING (public.has_org_access(auth.uid(), org_id));

CREATE POLICY "Owners/admins can manage workflows"
  ON public.automation_workflows FOR ALL
  USING (public.get_org_role(auth.uid(), org_id) IN ('owner', 'admin'))
  WITH CHECK (public.get_org_role(auth.uid(), org_id) IN ('owner', 'admin'));

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Automation logs: track every notification/action sent
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.automation_workflows(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id UUID,
  channel TEXT NOT NULL DEFAULT 'in_app',
  status TEXT NOT NULL DEFAULT 'sent',
  message TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view automation logs"
  ON public.automation_logs FOR SELECT
  USING (public.has_org_access(auth.uid(), org_id));

CREATE POLICY "System can insert automation logs"
  ON public.automation_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_automation_logs_sent_at ON public.automation_logs(org_id, sent_at);
CREATE INDEX idx_automation_workflows_org_type ON public.automation_workflows(org_id, workflow_type);
