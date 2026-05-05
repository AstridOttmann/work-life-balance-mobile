import axios from 'axios';
import type { Appointment, AppointmentInput, DailyEntry, DailyEntryInput, Summary, TimeBlock, TimeBlockInput } from '../types/entry';
import { apiRequest } from './apiRequest';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
});

export const entriesApi = {
  getAll: (from?: string, to?: string) =>
    apiRequest(api.get<DailyEntry[]>('/entries', { params: { from, to } })),

  getById: (id: number) =>
    apiRequest(api.get<DailyEntry>(`/entries/${id}`)),

  create: (data: DailyEntryInput) =>
    apiRequest(api.post<DailyEntry>('/entries', data)),

  update: (id: number, data: DailyEntryInput) =>
    apiRequest(api.put<DailyEntry>(`/entries/${id}`, data)),

  delete: (id: number) =>
    apiRequest(api.delete<void>(`/entries/${id}`)),

  getSummary: (period: 'weekly' | 'monthly', date: string) =>
    apiRequest(api.get<Summary>('/entries/summary', { params: { period, date } })),
};

export const timeBlocksApi = {
  create: (data: TimeBlockInput) =>
    apiRequest(api.post<TimeBlock>('/time-blocks', data)),

  update: (id: number, data: TimeBlockInput) =>
    apiRequest(api.put<TimeBlock>(`/time-blocks/${id}`, data)),

  delete: (id: number) =>
    apiRequest(api.delete<void>(`/time-blocks/${id}`)),
};

export const appointmentsApi = {
  create: (data: AppointmentInput) =>
    apiRequest(api.post<Appointment>('/appointments', data)),

  update: (id: number, data: AppointmentInput) =>
    apiRequest(api.put<Appointment>(`/appointments/${id}`, data)),

  delete: (id: number) =>
    apiRequest(api.delete<void>(`/appointments/${id}`)),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; email: string }>('/auth/login', { email, password }).then(r => r.data),
};
