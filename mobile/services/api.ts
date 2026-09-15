import { useAuthStore } from '../stores/authStore';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function fetchWithTimeout(url: string, options: RequestOptions = {}): Promise<Response> {
  const { timeoutMs = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  // Get subject list from backend
  async getSubjects(stream?: string, gradeLevel?: number) {
    const params = new URLSearchParams();
    if (stream) params.append('stream', stream);
    if (gradeLevel) params.append('gradeLevel', gradeLevel.toString());

    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/subjects?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    return res.json();
  },

  // Delta sync endpoint for a subject
  async syncSubject(subjectId: string, sinceHash?: string) {
    const headers: Record<string, string> = {};
    if (sinceHash) {
      headers['If-None-Match'] = `"${sinceHash}"`;
    }

    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/subjects/${subjectId}/sync${sinceHash ? `?sinceHash=${sinceHash}` : ''}`,
      { headers }
    );

    if (res.status === 304) {
      return { notModified: true, data: null };
    }

    if (!res.ok) {
      throw new Error(`Sync failed with status: ${res.status}`);
    }

    const data = await res.json();
    return { notModified: false, data };
  },

  // Upload quiz attempts
  async uploadAttempts(attempts: Array<{
    id: string;
    subjectId: string;
    unitId?: string | null;
    score: number;
    totalQuestions: number;
    correctCount: number;
    completedAt: string;
  }>) {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/sync/attempts`, {
      method: 'POST',
      body: JSON.stringify({ attempts }),
    });

    if (!res.ok) {
      throw new Error(`Failed to upload attempts: ${res.statusText}`);
    }

    return res.json();
  },
};
