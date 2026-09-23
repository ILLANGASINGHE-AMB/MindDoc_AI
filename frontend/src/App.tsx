import { useState, useRef, useEffect } from 'react';
import { uploadDocument, askAgent, clearDatabase } from './api';
import type { ChatMessage } from './api';
import { 
  FilePlus,
  Send,
  Trash2,
  Search,
  User
} from 'lucide-react';

function App() {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<{id: string, pages: number, filename: string}[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAsking(true);
    
    try {
      const res = await askAgent(userMessage);
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

  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all uploaded documents and reset the AI's memory?")) return;
    
    try {
      await clearDatabase();
      setDocuments([]);
      setMessages([]);
      alert("Memory cleared successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to clear memory");
    }
  };

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <div className="main-content">
        
        {/* Top Logo */}
        <div className="hero-logo">
          <img src="/logo.png" alt="DocMind Logo" />
        </div>

        {/* Add PDF Button */}
        <div className="add-pdf-container">
          <input 
            type="file" 
            accept=".pdf" 
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
            {uploading ? 'Processing...' : 'ADD PDF'}
          </button>
          
          {documents.length > 0 && (
            <div className="doc-count">
              <span className="dot"></span>
              <div className="doc-list-text">
                <strong>{documents.length} PDF{documents.length !== 1 ? 's' : ''} uploaded:</strong>
                <span>{documents.map(d => d.filename).join(', ')}</span>
              </div>
            </div>
          )}
        </div>

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
                      Sources: {msg.sources.map(s => `[${s.doc_id} P${s.page}]`).join(', ')}
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
            placeholder="Ask anything about your pdfs here..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={asking}
          />
          <div className="input-actions-right">
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
    </div>
  );
}

export default App;
