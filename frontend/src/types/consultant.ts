export interface Consultant {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  skills: string[];
  availability: "available" | "busy" | "unavailable" | string;
  matchScore?: number;
  experience?: string;
  education?: string;
  hasResume?: boolean;
  resumeId?: string;
}

