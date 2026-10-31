import { useLabSettings } from "@/hooks/lab/useLab";
import { DEFAULT_WORK_CALENDAR, type WorkCalendar } from "@/lib/labCalendar";

/** Lab-wide working days, holidays and daily capacity (shared across every device). */
export function useLabWorkCalendar(): { cal: WorkCalendar; capacity: number; loaded: boolean } {
  const { data, isSuccess } = useLabSettings();
  const s = (data || {}) as any;
  return {
    cal: {
      workingDays: Array.isArray(s.working_days) && s.working_days.length ? s.working_days.map(Number) : DEFAULT_WORK_CALENDAR.workingDays,
      holidays: Array.isArray(s.holidays) ? s.holidays : [],
    },
    capacity: Number(s.daily_capacity) > 0 ? Number(s.daily_capacity) : 20,
    loaded: isSuccess,
  };
}
