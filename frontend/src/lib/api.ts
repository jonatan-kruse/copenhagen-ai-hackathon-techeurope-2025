import { Consultant } from "@/types/consultant";

// Use environment variable or default to relative URL for production
// In development, this can be set to http://localhost:8000
// Bun uses import.meta.env differently, so we need to safely access it
// Try multiple ways to access the environment variable
function getApiBaseUrl(): string {
  // Try import.meta.env (Vite-style)
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Try window global (if set during build)
  if (typeof window !== "undefined" && (window as any).__API_BASE_URL__) {
    return (window as any).__API_BASE_URL__;
  }
  // Default to relative URL for production
  return "/api";
}

const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
// If API_BASE_URL is "/api", it's already the base path, so just append the endpoint
// If API_BASE_URL is "http://localhost:8000", append "/api" + endpoint
export function buildApiUrl(endpoint: string): string {
  if (API_BASE_URL === "/api" || API_BASE_URL.startsWith("/")) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return `${API_BASE_URL}/api${endpoint}`;
}

export async function getAllConsultants(): Promise<Consultant[]> {
  const response = await fetch(buildApiUrl("/consultants"));
  if (!response.ok) {
    throw new Error(`Failed to fetch consultants: ${response.statusText}`);
  }
  const data = await response.json();
  return data.consultants || [];
}

export async function deleteConsultant(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(buildApiUrl(`/consultants/${id}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete consultant: ${response.statusText}`);
  }
  return await response.json();
}

export async function deleteConsultantsBatch(ids: string[]): Promise<{ success: boolean; message?: string; deleted_count?: number; errors?: Array<{ id: string; error: string }>; error?: string }> {
  const response = await fetch(buildApiUrl("/consultants"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete consultants: ${response.statusText}`);
  }
  return await response.json();
}

export async function uploadResume(file: File): Promise<{ id: string; name: string; skills: string[]; experience: string; education: string; email: string; phone: string; full_text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(buildApiUrl("/resumes/upload"), {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to upload resume: ${response.statusText}`);
  }
  
  return await response.json();
}

export function getResumeDownloadUrl(resumeId: string): string {
  return buildApiUrl(`/resumes/${resumeId}/pdf`);
}

export interface SkillCount {
  skill: string;
  count: number;
}

export interface OverviewData {
  cvCount: number;
  uniqueSkillsCount: number;
  topSkills: SkillCount[];
}

export async function getOverview(): Promise<OverviewData> {
  const response = await fetch(buildApiUrl("/overview"));
  if (!response.ok) {
    throw new Error(`Failed to fetch overview: ${response.statusText}`);
  }
  return await response.json();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RoleQuery {
  title: string;
  description: string;
  query: string;
  requiredSkills: string[];
}

export interface ChatResponse {
  role: string;
  content: string;
  isComplete: boolean;
  roles?: RoleQuery[];
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await fetch(buildApiUrl("/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to send chat message: ${response.statusText}`);
  }
  
  return await response.json();
}

export interface RoleMatchResult {
  role: RoleQuery;
  consultants: Consultant[];
}

export interface RoleMatchResponse {
  roles: RoleMatchResult[];
}

export async function matchConsultantsByRoles(roles: RoleQuery[]): Promise<RoleMatchResponse> {
  const response = await fetch(buildApiUrl("/consultants/match-roles"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roles }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to match consultants: ${response.statusText}`);
  }
  
  return await response.json();
}

