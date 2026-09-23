import { useState } from 'react';
import { uploadDocument, askAgent, clearDatabase } from './api';
import type { ChatMessage } from './api';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<{id: string, pages: number}[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDocument(file);
      setDocuments(prev => [...prev, {id: res.doc_id, pages: res.num_pages}]);
      setFile(null);
    } catch (e) {
      console.error(e);
      alert("Error uploading document");
    } finally {
      setUploading(false);
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
      {/* Sidebar / Document Manager */}
      <div className="sidebar glass-panel" style={{ padding: '20px' }}>
        <h2>DocMind AI</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem'}}>Local Privacy-First Intelligence</p>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{marginBottom: '10px', fontSize: '1rem'}}>Upload Document</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input 
              type="file" 
              accept=".pdf"
              className="glass-input" 
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <button 
              className="glass-btn"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Processing...' : 'Upload & Extract'}
            </button>
          </div>
        </div>
        
        <div>
          <h3 style={{marginBottom: '10px', fontSize: '1rem'}}>Knowledge Base</h3>
          {documents.length === 0 ? (
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>No documents uploaded yet.</p>
          ) : (
            documents.map((doc, i) => (
              <div key={i} className="doc-item">
                <div className="doc-title">{doc.id}</div>
                <div className="doc-meta">{doc.pages} Pages • Indexed</div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="glass-btn glass-btn-secondary" 
            style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={handleClear}
          >
            Clear All Memory
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content glass-panel chat-window">
        <div className="chat-history">
          {messages.length === 0 ? (
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
              <h1 style={{margin: 0}}>Ask DocMind</h1>
              <p style={{color: 'var(--text-muted)'}}>Upload a PDF to get started, then ask questions.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div style={{whiteSpace: 'pre-wrap'}}>{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-source">
                    Sources: {msg.sources.map(s => `[${s.doc_id} P${s.page}]`).join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
          {asking && (
            <div className="message agent">
              <div className="loader"></div>
            </div>
          )}
        </div>
        
        <div className="chat-input-area">
          <input 
            className="glass-input" 
            placeholder="Ask anything about your documents..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={asking}
          />
          <button 
            className="glass-btn" 
            onClick={handleSend}
            disabled={asking || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
