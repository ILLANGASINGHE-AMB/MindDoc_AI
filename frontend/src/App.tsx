import { useState, useRef, useEffect } from 'react';
import { uploadDocument, askAgent, clearDatabase } from './api';
import type { ChatMessage } from './api';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  Settings, 
  Lock, 
  FilePlus,
  Lightbulb, 
  MessageCircle, 
  Paperclip, 
  Send,
  FileSearch,
  BrainCircuit,
  ShieldCheck,
  Zap,
  User,
  Bot
} from 'lucide-react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<{id: string, pages: number}[]>([]);
  
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
      setDocuments(prev => [...prev, {id: res.doc_id, pages: res.num_pages}]);
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
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="DocMind Logo" />
          <h1>DocMind <span>AI</span></h1>
        </div>
        
        <div className="nav-menu">
          <div className="nav-item active">
            <Home size={20} />
            <span>Home</span>
          </div>
          <div className="nav-item">
            <FileText size={20} />
            <span>Documents ({documents.length})</span>
          </div>
          <div className="nav-item">
            <MessageSquare size={20} />
            <span>Chat</span>
          </div>
          <div className="nav-item" onClick={handleClear} style={{ color: '#ef4444' }}>
            <Settings size={20} />
            <span>Clear Memory</span>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="local-mode-badge">
            <div>
              <div className="status">
                <div className="dot"></div>
                Local Mode
              </div>
              <div className="desc">No internet connection required</div>
            </div>
            <Lock size={16} color="var(--text-muted)" />
          </div>
          <div className="privacy-note">
            Your Documents. Your Privacy.
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {messages.length === 0 ? (
          /* Empty State / Hero */
          <div className="hero-section">
            <div className="hero-logo">
              <img src="/logo.png" alt="Logo Large" />
              <p>Your local AI agent for intelligent PDF understanding.<br/>Read, analyze, and reason over your documents — privately, offline, and intelligently.</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <FileSearch size={32} className="feature-icon" />
                <h3>Read PDFs</h3>
                <p>Text, images, tables</p>
              </div>
              <div className="feature-card">
                <BrainCircuit size={32} className="feature-icon" />
                <h3>AI Agent</h3>
                <p>Plans, searches, reasons</p>
              </div>
              <div className="feature-card">
                <ShieldCheck size={32} className="feature-icon" />
                <h3>100% Offline</h3>
                <p>Your data stays local</p>
              </div>
              <div className="feature-card">
                <Zap size={32} className="feature-icon" />
                <h3>Multimodal</h3>
                <p>Text, vision, OCR</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="dropzone">
              <FilePlus size={48} className="dropzone-icon" />
              <button 
                className="dropzone-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <FilePlus size={18} />
                {uploading ? 'Processing...' : 'Add PDF'}
              </button>
              <p>Click to add PDF files or drag and drop them here</p>
              <span className="sub-text">Supports multiple PDFs</span>
            </div>
          </div>
        ) : (
          /* Chat History View */
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

        {/* Bottom Chat Bar */}
        <div className="bottom-chat-container">
          <div className="chat-header">
            <div>
              <h2>Ask DocMind</h2>
              <p>Ask questions about your PDFs. Get accurate answers with sources.</p>
            </div>
            <button className="example-btn">
              <Lightbulb size={16} />
              Example Questions
            </button>
          </div>
          
          <div className="chat-input-wrapper">
            <MessageCircle size={20} className="input-icon-left" />
            <input 
              className="chat-input"
              placeholder="Ask a question about your documents..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={asking}
            />
            <div className="input-actions-right">
              <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={20} />
              </button>
              <button className="send-btn" onClick={handleSend} disabled={asking || !input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;
