import { Consultant } from "@/types/consultant";

const API_BASE_URL = "http://localhost:8000";

export async function getAllConsultants(): Promise<Consultant[]> {
  const response = await fetch(`${API_BASE_URL}/api/consultants`);
  if (!response.ok) {
    throw new Error(`Failed to fetch consultants: ${response.statusText}`);
  }
  const data = await response.json();
  return data.consultants || [];
}

export async function deleteConsultant(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/consultants/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete consultant: ${response.statusText}`);
  }
  return await response.json();
}

export async function deleteConsultantsBatch(ids: string[]): Promise<{ success: boolean; message?: string; deleted_count?: number; errors?: Array<{ id: string; error: string }>; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/consultants`, {
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

