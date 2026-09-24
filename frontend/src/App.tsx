import { useState, useRef, useEffect } from 'react';
import { uploadDocument, askAgent, clearDatabase } from './api';
import type { ChatMessage } from './api';
import { 
  FilePlus,
  Send,
  Trash2,
  Search,
  User,
  Sparkles,
  X
} from 'lucide-react';
import { summarizeDocument, getPageContent } from './api';

function App() {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<{id: string, pages: number, filename: string}[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, text: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('docmind_messages');
    const savedDocs = localStorage.getItem('docmind_documents');
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedDocs) setDocuments(JSON.parse(savedDocs));
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('docmind_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('docmind_documents', JSON.stringify(documents));
  }, [documents]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, asking]);

  const handleUpload = async (selectedFile: File) => {
    setUploading(true);
    try {
      const res = await uploadDocument(selectedFile);
      setDocuments(prev => [...prev, {id: res.doc_id, pages: res.num_pages, filename: res.filename || selectedFile.name}]);
      alert("Document uploaded and indexed successfully!");
    } catch (e) {
      console.error(e);
      alert("Error uploading document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || asking) return;
    
    const userMessage = input.trim();
    setInput('');
    
    const historyPayload = messages.map(m => ({ sender: m.role, text: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAsking(true);
    
    try {
      const res = await askAgent(userMessage, undefined, historyPayload);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'agent', 
          content: res.answer, 
          sources: res.sources 
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, there was an error processing your request." }]);
    } finally {
      setAsking(false);
    }
  };

  const handleSummarize = async (docId: string, filename: string) => {
    setMessages(prev => [...prev, { role: 'user', content: `Please summarize ${filename}` }]);
    setAsking(true);
    try {
      const res = await summarizeDocument(docId);
      setMessages(prev => [...prev, { role: 'agent', content: `**Summary of ${filename}**:\n\n${res.summary}` }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, there was an error summarizing this document." }]);
    } finally {
      setAsking(false);
    }
  };

  const handleViewSource = async (docId: string, page: number) => {
    try {
      const res = await getPageContent(docId, page);
      setModalContent({ title: `${docId} - Page ${page}`, text: res.text });
    } catch (e) {
      console.error(e);
      alert("Failed to load source page.");
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all uploaded documents and reset the AI's memory?")) return;
    
    try {
      await clearDatabase();
      localStorage.removeItem('docmind_messages');
      localStorage.removeItem('docmind_documents');
      setDocuments([]);
      setMessages([]);
      alert("Memory cleared successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to clear memory");
    }
  };

  const isChatActive = messages.length > 0;

  return (
    <div className="app-container">
      {/* Hidden file input for mini-button access */}
      <input 
        type="file" 
        accept=".pdf,image/png,image/jpeg,image/jpg" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Main Content Area */}
      <div className={`main-content ${isChatActive ? 'chat-active' : ''}`}>
        
        {/* Landing Page Content */}
        {!isChatActive && (
          <div className="landing-view">
            <div className="hero-logo">
              <img src="/logo.png" alt="DocMind Logo" />
            </div>

            <div className="add-pdf-container">
              <input 
                type="file" 
                accept=".pdf,image/png,image/jpeg,image/jpg" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button 
                className="add-pdf-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <FilePlus size={24} />
                {uploading ? 'Processing...' : 'ADD FILE'}
              </button>
              
              {documents.length > 0 && (
                <div className="doc-count">
                  <span className="dot"></span>
                  <div className="doc-list-text">
                    <strong>{documents.length} File{documents.length !== 1 ? 's' : ''} uploaded:</strong>
                    <span>
                      {documents.map((d, idx) => (
                        <span key={d.id} className="doc-item">
                          {d.filename}
                          <button 
                            className="summarize-btn" 
                            title="Summarize this document"
                            onClick={() => handleSummarize(d.id, d.filename)}
                          >
                            <Sparkles size={14} />
                          </button>
                          {idx < documents.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat History Container (Only shows when there are messages) */}
        {messages.length > 0 && (
          <div className="chat-history-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? <User size={20} /> : <img src="/logo.png" alt="Agent" />}
                </div>
                <div className="message-bubble">
                  <div style={{whiteSpace: 'pre-wrap'}}>{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="message-source">
                      Sources:{' '}
                      {msg.sources.map((s, idx) => (
                        <button 
                          key={idx} 
                          className="source-link" 
                          onClick={() => handleViewSource(s.doc_id, s.page)}
                        >
                          [{s.doc_id} P{s.page}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {asking && (
              <div className="message agent">
                <div className="message-avatar">
                  <img src="/logo.png" alt="Agent" />
                </div>
                <div className="message-bubble">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="chat-input-wrapper">
          <Search size={22} className="input-icon-left" />
          <input 
            className="chat-input"
            placeholder="Ask anything about your files here..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={asking}
          />
          <div className="input-actions-right">
            {isChatActive && (
              <button 
                className="mini-upload-btn" 
                onClick={() => fileInputRef.current?.click()}
                title="Add another file"
                disabled={uploading}
              >
                <FilePlus size={20} />
              </button>
            )}
            <button className="send-btn" onClick={handleSend} disabled={asking || !input.trim()}>
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Clear Memory Button */}
        <button className="clear-memory-btn" onClick={handleClear}>
          <Trash2 size={16} />
          Clear Memory
        </button>
      </div>

      {/* Modal for viewing source text */}
      {modalContent && (
        <div className="modal-backdrop" onClick={() => setModalContent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent.title}</h3>
              <button className="modal-close" onClick={() => setModalContent(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <pre>{modalContent.text}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
