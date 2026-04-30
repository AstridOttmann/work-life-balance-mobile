export interface DailyEntry {
  id: number;
  date: string;
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  notes: string | null;
  appointments: Appointment[];
}

export interface DailyEntryInput {
  date: string;
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  notes: string | null;
}

export interface Appointment {
  id: number;
  dailyEntryId: number;
  title: string;
  time: string | null;
  durationHours: number | null;
}

export interface AppointmentInput {
  dailyEntryId: number;
  title: string;
  time: string | null;
  durationHours: number | null;
}

export interface Summary {
  period: string;
  startDate: string;
  endDate: string;
  avgWorkHours: number | null;
  avgFreeTimeHours: number | null;
  avgSleepingHours: number | null;
  avgMood: number | null;
  entryCount: number;
}
