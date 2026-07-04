import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Activity,
  ActivityKind,
  Dashboard,
  EmailTemplate,
  Participant,
  ParticipantInput,
  ParticipantListItem,
  PipelinePhase,
  RenderedEmail,
} from './types';

export interface ParticipantFilters {
  phase?: PipelinePhase | '';
  search?: string;
}

export function useParticipants(filters: ParticipantFilters = {}) {
  const params = new URLSearchParams();
  if (filters.phase) params.set('phase', filters.phase);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  const qs = params.toString();

  return useQuery({
    queryKey: ['participants', { phase: filters.phase ?? '', search: filters.search?.trim() ?? '' }],
    queryFn: () => api.get<ParticipantListItem[]>(`/api/participants${qs ? `?${qs}` : ''}`),
  });
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: ['participant', id],
    queryFn: () => api.get<Participant>(`/api/participants/${id}`),
    enabled: Boolean(id),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Dashboard>('/api/dashboard'),
  });
}

export function useActivities(participantId: string) {
  return useQuery({
    queryKey: ['activities', participantId],
    queryFn: () => api.get<Activity[]>(`/api/participants/${participantId}/activities`),
  });
}

export function useWelcomeTemplate() {
  return useQuery({
    queryKey: ['template', 'welcome'],
    queryFn: () => api.get<EmailTemplate>('/api/email-templates/welcome'),
  });
}

export function useRenderedEmail(participantId: string) {
  return useQuery({
    queryKey: ['welcomeEmail', participantId],
    queryFn: () => api.get<RenderedEmail>(`/api/participants/${participantId}/welcome-email`),
  });
}

export function useCreateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ParticipantInput) => api.post<Participant>('/api/participants', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateParticipant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ParticipantInput) => api.put<Participant>(`/api/participants/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      qc.invalidateQueries({ queryKey: ['participant', id] });
      qc.invalidateQueries({ queryKey: ['welcomeEmail', id] });
    },
  });
}

export function useDeleteParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/participants/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useChangePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, phase, note }: { id: string; phase: PipelinePhase; note?: string }) =>
      api.post<Participant>(`/api/participants/${id}/phase`, { phase, note }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      qc.invalidateQueries({ queryKey: ['participant', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAddActivity(participantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { text: string; kind: ActivityKind }) =>
      api.post<Activity>(`/api/participants/${participantId}/activities`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities', participantId] }),
  });
}

export function useDeleteActivity(participantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      api.delete(`/api/participants/${participantId}/activities/${activityId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities', participantId] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; body: string }) =>
      api.put<EmailTemplate>('/api/email-templates/welcome', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template', 'welcome'] });
      qc.invalidateQueries({ queryKey: ['welcomeEmail'] });
    },
  });
}
