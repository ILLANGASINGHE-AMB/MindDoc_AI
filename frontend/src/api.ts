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
  sources?: { doc_id: string; page: int }[];
}

export const askAgent = async (question: string, doc_ids?: string[]) => {
  const response = await axios.post(`${API_BASE_URL}/agent/ask`, {
    question,
    doc_ids
  });
  
  return response.data;
};
