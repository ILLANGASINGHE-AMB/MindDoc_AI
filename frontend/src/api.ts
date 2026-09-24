import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  sources?: { doc_id: string; page: number }[];
  isNew?: boolean;
}

export const askAgent = async (question: string, doc_ids?: string[], history?: { sender: string; text: string }[]) => {
  const response = await axios.post(`${API_BASE_URL}/agent/ask`, {
    question,
    doc_ids,
    history
  });
  
  return response.data;
};

export const clearDatabase = async () => {
  const response = await axios.delete(`${API_BASE_URL}/documents/clear`);
  return response.data;
};

export const summarizeDocument = async (docId: string) => {
  const response = await axios.post(`${API_BASE_URL}/documents/${docId}/summarize`);
  return response.data;
};

export const getPageContent = async (docId: string, pageNumber: number) => {
  const response = await axios.get(`${API_BASE_URL}/documents/${docId}/page/${pageNumber}`);
  return response.data;
};
