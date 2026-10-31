import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDentistSchedules, useUpsertSchedule, DAY_NAMES } from "@/hooks/useDentistSchedules";
import { useStaff } from "@/hooks/useStaff";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export default function SchedulesPage() {
  const { data: staff = [] } = useStaff();
  const dentists = staff.filter((s) => s.role === "dentist" || s.role === "hygienist");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const { data: schedules = [], isLoading } = useDentistSchedules(selectedStaff || undefined);
  const upsert = useUpsertSchedule();

  const handleToggle = async (dayOfWeek: number, current: any) => {
    if (!selectedStaff) return;
    await upsert.mutateAsync({
      staff_id: selectedStaff,
      day_of_week: dayOfWeek,
      start_time: current?.start_time || "09:00",
      end_time: current?.end_time || "17:00",
      break_start: current?.break_start || null,
      break_end: current?.break_end || null,
      is_available: !current?.is_available,
    });
  };

  const handleTimeChange = async (dayOfWeek: number, field: string, value: string, current: any) => {
    if (!selectedStaff) return;
    await upsert.mutateAsync({
      staff_id: selectedStaff,
      day_of_week: dayOfWeek,
      start_time: field === "start_time" ? value : current?.start_time || "09:00",
      end_time: field === "end_time" ? value : current?.end_time || "17:00",
      break_start: field === "break_start" ? (value || null) : current?.break_start || null,
      break_end: field === "break_end" ? (value || null) : current?.break_end || null,
      is_available: current?.is_available ?? true,
    });
  };

  const getScheduleForDay = (day: number) => schedules.find((s) => s.day_of_week === day);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Schedules"
        description="Manage working hours and availability"
        tutorial={{
          title: "Schedules — How to Use",
          description: "Configure each dentist's and hygienist's weekly working hours so the appointment system knows when they are available.",
          steps: [
            {
              title: "Select a staff member",
              description: "Use the dropdown at the top to choose which staff member's schedule you want to view or edit. Each staff member has their own independent weekly schedule.",
            },
            {
              title: "Set working days",
              description: "Toggle each day of the week on or off. Days that are toggled off mean the staff member is not available and appointments cannot be booked for them on those days.",
              tip: "Remember to configure schedules for all dentists before enabling online or staff bookings.",
            },
            {
              title: "Set start and end times",
              description: "For each working day, set the start time (when the dentist begins seeing patients) and end time (last appointment slot). Appointments will only be bookable within these hours.",
            },
            {
              title: "Add a break period",
              description: "Set lunch or break times to block out a period mid-day. No appointments will be scheduled during the break window.",
            },
            {
              title: "Save the schedule",
              description: "Click 'Save Schedule' after making changes. The new schedule takes effect immediately and affects all future appointment booking for that staff member.",
            },
          ],
          nextPageHint: {
            label: "Appointments",
            description: "With schedules configured, book appointments within the available hours on the Appointments page.",
          },
        }}
      >
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-[200px] bg-muted/30" data-tour="schedules-staff-select">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent>
            {dentists.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {!selectedStaff ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Select a staff member to manage their schedule</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div className="grid gap-3" data-tour="schedules-week-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {DAY_NAMES.map((dayName, i) => {
            const schedule = getScheduleForDay(i);
            const isAvailable = schedule?.is_available ?? (i >= 1 && i <= 5);
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`glass-card transition-all ${!isAvailable ? "opacity-50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="w-24 flex items-center gap-2">
                        <Switch checked={isAvailable} onCheckedChange={() => handleToggle(i, schedule)} data-tour={i === 0 ? "schedules-day-toggle" : undefined} />
                        <span className="text-sm font-medium">{dayName.slice(0, 3)}</span>
                      </div>
                      {isAvailable && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground" data-tour={i === 0 ? "schedules-time-range" : undefined}>Start</Label>
                            <Input
                              type="time"
                              className="w-28 h-8 text-xs bg-muted/30"
                              value={schedule?.start_time || "09:00"}
                              onChange={(e) => handleTimeChange(i, "start_time", e.target.value, schedule)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">End</Label>
                            <Input
                              type="time"
                              className="w-28 h-8 text-xs bg-muted/30"
                              value={schedule?.end_time || "17:00"}
                              onChange={(e) => handleTimeChange(i, "end_time", e.target.value, schedule)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground" data-tour={i === 0 ? "schedules-break" : undefined}>Break</Label>
                            <Input
                              type="time"
                              className="w-28 h-8 text-xs bg-muted/30"
                              value={schedule?.break_start || ""}
                              onChange={(e) => handleTimeChange(i, "break_start", e.target.value, schedule)}
                              placeholder="13:00"
                            />
                            <span className="text-xs text-muted-foreground">–</span>
                            <Input
                              type="time"
                              className="w-28 h-8 text-xs bg-muted/30"
                              value={schedule?.break_end || ""}
                              onChange={(e) => handleTimeChange(i, "break_end", e.target.value, schedule)}
                              placeholder="14:00"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
