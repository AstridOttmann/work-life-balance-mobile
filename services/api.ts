import axios from 'axios';
import type { Appointment, AppointmentInput, DailyEntry, DailyEntryInput, Summary, TimeBlock, TimeBlockInput } from '../types/entry';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
});

export const entriesApi = {
  getAll: (from?: string, to?: string) =>
    api.get<DailyEntry[]>('/entries', { params: { from, to } }).then(r => r.data),

  getById: (id: number) =>
    api.get<DailyEntry>(`/entries/${id}`).then(r => r.data),

  create: (data: DailyEntryInput) =>
    api.post<DailyEntry>('/entries', data).then(r => r.data),

  update: (id: number, data: DailyEntryInput) =>
    api.put<DailyEntry>(`/entries/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/entries/${id}`),

  getSummary: (period: 'weekly' | 'monthly', date: string) =>
    api.get<Summary>('/entries/summary', { params: { period, date } }).then(r => r.data),
};

export const timeBlocksApi = {
  create: (data: TimeBlockInput) =>
    api.post<TimeBlock>('/time-blocks', data).then(r => r.data),
  update: (id: number, data: TimeBlockInput) =>
    api.put<TimeBlock>(`/time-blocks/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/time-blocks/${id}`),
};

export const appointmentsApi = {
  create: (data: AppointmentInput) =>
    api.post<Appointment>('/appointments', data).then(r => r.data),

  update: (id: number, data: AppointmentInput) =>
    api.put<Appointment>(`/appointments/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/appointments/${id}`),
};
