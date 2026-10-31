import { PageSkeleton } from "@/components/dashboard/PageSkeleton";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { Bot, Clock, Bell, CalendarClock, AlertTriangle, Heart, Zap, History, MessageSquare } from "lucide-react";
import {
  useAutomationWorkflows,
  useInitializeWorkflows,
  useUpdateWorkflow,
  useAutomationLogs,
  type AutomationWorkflow,
} from "@/hooks/useAutomationWorkflows";
import { format } from "date-fns";

const WORKFLOW_ICONS: Record<string, any> = {
  appointment_reminder: CalendarClock,
  recall: Clock,
  missed_appointment: AlertTriangle,
  invoice_alert: Bell,
  treatment_followup: Heart,
  event_triggered: Zap,
};

const WORKFLOW_COLORS: Record<string, string> = {
  appointment_reminder: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  recall: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  missed_appointment: "bg-red-500/10 text-red-500 border-red-500/20",
  invoice_alert: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  treatment_followup: "bg-green-500/10 text-green-500 border-green-500/20",
  event_triggered: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

// TODO: WhatsApp integration will be added later. For now, only in-app notifications are supported.
// When WhatsApp is integrated, add 'whatsapp' as a channel option in the workflow settings.

export default function AutomationPage() {
  const { data: workflows = [], isLoading } = useAutomationWorkflows();
  const initWorkflows = useInitializeWorkflows();
  const updateWorkflow = useUpdateWorkflow();
  const { data: logs = [] } = useAutomationLogs();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Automation" description="Automated workflows and reminders" />
        <PageSkeleton />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Automation" description="Automated workflows and reminders" />
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Configured</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Set up automated reminders, recall systems, and follow-ups. Initialize with default templates to get started.
            </p>
            <Button
              className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
              onClick={() => initWorkflows.mutate()}
              disabled={initWorkflows.isPending}
            >
              <Zap className="mr-2 h-4 w-4" />
              {initWorkflows.isPending ? "Setting up..." : "Initialize Workflows"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation"
        description="Manage automated workflows, reminders, and follow-ups"
        tutorial={{
          title: "Automation — How to Use",
          description: "Set up automatic messages and reminders so patients are always informed without manual effort.",
          steps: [
            {
              title: "What is automation?",
              description: "Automation workflows are rules that automatically send messages (SMS or WhatsApp) to patients when certain events happen — like appointment reminders, birthday greetings, or follow-ups after treatment.",
              tip: "Well-timed reminders significantly reduce no-shows. Aim to send a reminder 24 hours before every appointment.",
            },
            {
              title: "View existing workflows",
              description: "The Workflows tab lists all configured automations with their name, trigger, timing, and whether they are currently enabled or disabled.",
            },
            {
              title: "Create a new workflow",
              description: "Click 'New Workflow'. Choose a trigger event (e.g. Appointment Booked, Appointment Due, Post-Visit), set the timing (e.g. 1 day before, 2 hours after), and write the message template.",
            },
            {
              title: "Personalise message templates",
              description: "Use template variables like {patient_name}, {appointment_date}, and {clinic_name} in your message. These are automatically replaced with real data when the message is sent.",
            },
            {
              title: "Enable or disable workflows",
              description: "Toggle any workflow on or off using the switch. Disabled workflows will not send messages but are preserved for future use.",
            },
            {
              title: "View automation history",
              description: "Switch to the 'Logs' tab to see a history of all automated messages sent, including delivery status and any errors. Use this to verify automation is working correctly.",
            },
          ],
        }}
      >
        <Badge variant="outline" className="text-xs border-border/50">
          {workflows.filter((w) => w.is_enabled).length} active
        </Badge>
      </PageHeader>

      <Tabs defaultValue="workflows">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="workflows">
            <Bot className="mr-1.5 h-3.5 w-3.5" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="mr-1.5 h-3.5 w-3.5" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-4">
          <motion.div
            className="grid gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                isEditing={editingId === wf.id}
                onEdit={() => setEditingId(editingId === wf.id ? null : wf.id)}
                onUpdate={(updates) => {
                  updateWorkflow.mutate({ id: wf.id, ...updates });
                  setEditingId(null);
                }}
                onToggle={(enabled) => updateWorkflow.mutate({ id: wf.id, is_enabled: enabled })}
              />
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Notifications sent by automated workflows</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No automation activity yet. Enable workflows and they'll run daily.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/50 hover:bg-accent/20 transition-colors"
                    >
                      <div className={`mt-0.5 p-1.5 rounded-md ${log.status === "sent" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {log.status === "sent" ? (
                          <Bell className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{log.message || "Notification sent"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.entity_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(log.sent_at), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                      </div>
                      <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[10px] shrink-0">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowCard({
  workflow,
  isEditing,
  onEdit,
  onUpdate,
  onToggle,
}: {
  workflow: AutomationWorkflow;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<AutomationWorkflow>) => void;
  onToggle: (enabled: boolean) => void;
}) {
  const [template, setTemplate] = useState(workflow.message_template);
  const [timingValue, setTimingValue] = useState(workflow.timing_value);
  const [timingUnit, setTimingUnit] = useState(workflow.timing_unit);

  const Icon = WORKFLOW_ICONS[workflow.workflow_type] || Bot;
  const colorClass = WORKFLOW_COLORS[workflow.workflow_type] || "bg-muted text-muted-foreground";

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
      <Card className={`glass-card transition-all ${workflow.is_enabled ? "" : "opacity-60"}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl border ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold">{workflow.name}</h3>
                {workflow.trigger_event && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
                    {workflow.trigger_event}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
                  {workflow.channel === "in_app" ? "In-App" : workflow.channel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{workflow.description}</p>

              {!isEditing && workflow.workflow_type !== "event_triggered" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Timing: {workflow.timing_value} {workflow.timing_unit}
                </p>
              )}

              {isEditing && (
                <div className="mt-4 space-y-3 border-t border-border/30 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Message Template</Label>
                    <Textarea
                      className="bg-muted/30 border-border/40 text-sm min-h-[60px]"
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      placeholder="Use {patient_name}, {date}, {time}, {amount}, {invoice_number}"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Variables: {"{patient_name}"}, {"{date}"}, {"{time}"}, {"{amount}"}, {"{invoice_number}"}
                    </p>
                  </div>

                  {workflow.workflow_type !== "event_triggered" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Timing Value</Label>
                        <Input
                          type="number"
                          min={0}
                          className="bg-muted/30 border-border/40"
                          value={timingValue}
                          onChange={(e) => setTimingValue(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Timing Unit</Label>
                        <Select value={timingUnit} onValueChange={setTimingUnit}>
                          <SelectTrigger className="bg-muted/30 border-border/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-secondary hover:bg-secondary/90 text-xs"
                      onClick={() =>
                        onUpdate({
                          message_template: template,
                          timing_value: timingValue,
                          timing_unit: timingUnit,
                        })
                      }
                    >
                      Save Changes
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={onEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!isEditing && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={onEdit}>
                  Edit
                </Button>
              )}
              <Switch checked={workflow.is_enabled} onCheckedChange={onToggle} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
