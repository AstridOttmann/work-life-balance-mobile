export interface DailyEntry {
  id: number;
  date: string;
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  health: number | null;
  notes: string | null;
  timeBlocks: TimeBlock[];
  appointments: Appointment[];
}

export interface DailyEntryInput {
  date: string;
  sleepingHours: number | null;
  mood: number;
  health: number | null;
  notes: string | null;
}

export interface TimeBlock {
  id: number;
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime: string | null;
}

export interface TimeBlockInput {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime?: string;
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
  totalWorkHours: number;
  totalFreeTimeHours: number;
  totalSleepingHours: number;
  totalAppointmentHours: number;
  appointmentCount: number;
  avgMood: number;
  avgHealth: number;
  entries: DailyEntry[];
}
