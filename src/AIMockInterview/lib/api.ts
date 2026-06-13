let API_BASE_URL = "http://localhost:3000";

export const api = {
  async chat(message: string, userId?: string, sessionId?: string) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, userId, sessionId }),
    });
    return response.json();
  },

  async getHistory() {
    const response = await fetch(`${API_BASE_URL}/api/history`);
    return response.json();
  },

  async startInterview(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async submitAnswer(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/interview/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async login(credentials: any) {
    try {
      console.log("Attempting login to:", `${API_BASE_URL}/api/login`);
      console.log("Credentials:", credentials);
      console.log("Frontend origin:", window.location.origin);

      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      console.log("Login API response status:", res.status);
      console.log("Login API response ok:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Login API response data:", data);
      return data;
    } catch (err: any) {
      console.error("Login API error:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);

      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        throw new Error(
          "CORS or Network Error: Unable to connect to backend. Check if backend has CORS enabled for your frontend origin.",
        );
      }

      throw new Error(err.message || "Unable to connect to server.");
    }
  },

  async uploadResume(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/api/upload-resume`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  async createSessionStats(payload: {
    candidateId: string;
    userId: string;
    status: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/session-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to create session stats");
    }
    return data;
  },

  async uploadExamImage(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/api/upload-exam-image`, {
      method: "POST",
      body: formData,
    });
    let data: { error?: string; message?: string } = {};
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error("Failed to upload exam image");
      }
      return { success: true };
    }
    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Failed to upload exam image",
      );
    }
    return data;
  },

  async uploadExamImageSilent(formData: FormData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-exam-image`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        await response.json().catch(() => null);
      }
    } catch {
      // Intentionally silent for background proctoring uploads
    }
  },

  async analyzeResume() {
    const response = await fetch(`${API_BASE_URL}/api/analyze-resume`);
    return response.json();
  },

  async uploadSnapshot(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/upload-snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async analyzeVideo() {
    const response = await fetch(`${API_BASE_URL}/api/analyze-video`);
    return response.json();
  },

  async processVoice(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/api/voice`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  async codeRunner(data: any) {
    const response = await fetch(`${API_BASE_URL}/api/code-runner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async round3Execute(data: { code: string; language: string; userId: string; sessionId: string; questionId?: number }) {
    const response = await fetch(`${API_BASE_URL}/api/interview/round3-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: data.code, language: data.language, userId: data.userId, sessionId: data.sessionId, questionId: data.questionId }),
    });
    return response.json();
  },

  async getCodingQuestion(userId: string, sessionId: string) {
    // Try enhanced coding-question endpoint first (returns full metadata)
    const response = await fetch(
      `${API_BASE_URL}/api/interview/coding-question?userId=${userId}&sessionId=${sessionId}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data && !data.error) return data;
    }
    // Fallback: current-question via query params
    const r2 = await fetch(
      `${API_BASE_URL}/api/interview/current-question?userId=${userId}&sessionId=${sessionId}`
    );
    return r2.json();
  },

  async evaluateCode(data: { code: string; language: string; questionId: number; testCases?: any[] }) {
    const response = await fetch(`${API_BASE_URL}/api/code-runner/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: data.code, language: data.language, questionId: data.questionId }),
    });
    return response.json();
  },

  async getAttemptStatus(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/interview/attempts/status?userId=${userId}`);
    return response.json();
  },

  async getCandidate(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/candidate/${userId}`);
    return response.json();
  },

  async generateCommunicationQuestion(userId: string, sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/api/communication/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });
    return response.json();
  },

  async submitCommunicationQuestionAnswer(data: {
    userId: string;
    sessionId: string;
    questionNo: number;
    selectedOption: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/communication/submit-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async generateHRQuestion(userId: string, sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/api/hr/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionId }),
    });
    return response.json();
  },

  async submitHRAnswer(data: {
    userId: string;
    sessionId: string;
    questionNo: number;
    answerText: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/hr/submit-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getInterviewConfig() {
    const response = await fetch(`${API_BASE_URL}/api/admin/interview-config`);
    return response.json();
  },
};