import BASE_URL from '../../Config';
const BASE = BASE_URL;

export const api = {
  async chat(message: string, userId?: string, sessionId?: string) {
    const response = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, userId, sessionId }),
    });
    return response.json();
  },

  async getHistory() {
    const response = await fetch(`${BASE}/api/history`);
    return response.json();
  },

  async startInterview(data: any) {
    const response = await fetch(`${BASE}/api/interview/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async submitAnswer(data: any) {
    const decodeHTML = (str: string) =>
      str.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    const cleaned = { ...data, question: decodeHTML(data.question || '') };
    const response = await fetch(`${BASE}/api/interview/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleaned),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Server error: ${response.status}`);
    }
    return response.json();
  },

  async login(credentials: any) {
    try {
      const res = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        throw new Error("Network Error: Unable to connect to server.");
      }
      throw new Error(err.message || "Unable to connect to server.");
    }
  },

  async uploadResume(formData: FormData) {
    const response = await fetch(`${BASE}/api/upload-resume`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  async createSessionStats(payload: { candidateId: string; userId: string; status: string; }) {
    const response = await fetch(`${BASE}/api/session-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "Failed to create session stats");
    return data;
  },

  async uploadExamImage(formData: FormData) {
    const response = await fetch(`${BASE}/api/upload-exam-image`, {
      method: "POST",
      body: formData,
    });
    let data: { error?: string; message?: string } = {};
    try {
      data = await response.json();
    } catch {
      if (!response.ok) throw new Error("Failed to upload exam image");
      return { success: true };
    }
    if (!response.ok) throw new Error(data.error || data.message || "Failed to upload exam image");
    return data;
  },

  async uploadExamImageSilent(formData: FormData): Promise<void> {
    try {
      await fetch(`${BASE}/api/upload-exam-image`, { method: "POST", body: formData });
    } catch {
      // Intentionally silent for background proctoring uploads
    }
  },

  async analyzeResume() {
    const response = await fetch(`${BASE}/api/analyze-resume`);
    return response.json();
  },

  async uploadSnapshot(data: any) {
    const response = await fetch(`${BASE}/api/upload-snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async analyzeVideo() {
    const response = await fetch(`${BASE}/api/analyze-video`);
    return response.json();
  },

  async processVoice(formData: FormData) {
    const response = await fetch(`${BASE}/api/voice`, { method: "POST", body: formData });
    return response.json();
  },

  async codeRunner(data: any) {
    const response = await fetch(`${BASE}/api/code-runner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async round3Execute(data: { code: string; language: string; userId: string; sessionId: string; questionId?: number; functionName?: string; question?: string }) {
    const decodeHTML = (str: string) =>
      str.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    const cleaned = { ...data, question: decodeHTML(data.question || '') };
    const response = await fetch(`${BASE}/api/coding/round3-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleaned),
    });
    return response.json();
  },

  async getCodingQuestion(userId: string, sessionId: string) {
    const response = await fetch(`${BASE}/api/interview/coding-question?userId=${userId}&sessionId=${sessionId}`);
    if (response.ok) {
      const data = await response.json();
      if (data && !data.error) return data;
    }
    const r2 = await fetch(`${BASE}/api/interview/current-question?userId=${userId}&sessionId=${sessionId}`);
    return r2.json();
  },

  async evaluateCode(data: { code: string; language: string; questionId: number; testCases?: any[] }) {
    const response = await fetch(`${BASE}/api/code-runner/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: data.code, language: data.language, questionId: data.questionId }),
    });
    return response.json();
  },

  async getAttemptStatus(userId: string) {
    const response = await fetch(`${BASE}/api/interview/attempts/status?userId=${userId}`);
    return response.json();
  },

  async getCandidate(userId: string) {
    const response = await fetch(`${BASE}/api/admin/candidate/${userId}`);
    return response.json();
  },

  async generateCommunicationQuestion(userId: string, sessionId: string) {
    const response = await fetch(`${BASE}/api/communication/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });
    return response.json();
  },

  async submitCommunicationQuestionAnswer(data: { userId: string; sessionId: string; questionNo: number; selectedOption: number; }) {
    const response = await fetch(`${BASE}/api/communication/submit-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async generateHRQuestion(userId: string, sessionId: string) {
    const response = await fetch(`${BASE}/api/hr/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });
    return response.json();
  },

  async submitHRAnswer(data: { userId: string; sessionId: string; questionNo: number; answerText: string; }) {
    const response = await fetch(`${BASE}/api/hr/submit-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getInterviewConfig() {
    const response = await fetch(`${BASE}/api/admin/interview-config`);
    return response.json();
  },
};
