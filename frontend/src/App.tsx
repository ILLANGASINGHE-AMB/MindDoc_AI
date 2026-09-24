import { useState, useRef, useEffect } from 'react';
import { uploadDocument, askAgent, clearDatabase, summarizeDocument, getPageContent } from './api';
import type { ChatMessage } from './api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIBrainPage } from './components/AIBrain/AIBrainPage';

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <button className="copy-btn" onClick={handleCopy}>{copied ? '[COPIED]' : (label || '[COPY]')}</button>;
};

const MdComponents = {
  pre({ children }: any) {
    return <pre className="code-block">{children}</pre>;
  },
  code({ className, children, ...props }: any) {
    return <code className={className} {...props}>{children}</code>;
  }
};

const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0; setDisplayed('');
    const iv = setInterval(() => { setDisplayed(text.slice(0, i + 1)); i++; if (i >= text.length) { clearInterval(iv); onComplete?.(); } }, 10);
    return () => clearInterval(iv);
  }, [text, onComplete]);
  return <div className="agent-text"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MdComponents}>{displayed}</ReactMarkdown></div>;
};

type Page = 'home' | 'documents' | 'chat' | 'aibrain';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<{id: string; pages: number; filename: string; type: string}[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string; text: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = localStorage.getItem('docmind_messages');
    const d = localStorage.getItem('docmind_documents');
    if (m) setMessages(JSON.parse(m));
    if (d) setDocuments(JSON.parse(d));
  }, []);
  useEffect(() => { localStorage.setItem('docmind_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('docmind_documents', JSON.stringify(documents)); }, [documents]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, asking]);

  // Auto-navigate to chat when messages exist
  useEffect(() => { if (messages.length > 0 && page === 'home') setPage('chat'); }, [messages]);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const arr = Array.from(files);
      const results = await Promise.all(arr.map(f => uploadDocument(f)));
      const newDocs = results.map((r, i) => ({ id: r.doc_id, pages: r.num_pages, filename: r.filename || arr[i].name, type: r.filename?.split('.').pop()?.toLowerCase() || 'pdf' }));
      setDocuments(prev => [...prev, ...newDocs]);
      if (page === 'chat') {
        setMessages(prev => [
          ...prev,
          { 
            role: 'agent', 
            content: `📁 **Uploaded and indexed ${newDocs.length} ${newDocs.length === 1 ? 'document' : 'documents'}:**\n` + 
              newDocs.map(d => `- **${d.filename}** (${d.pages} ${d.pages === 1 ? 'page' : 'pages'})`).join('\n') + 
              `\n\nReady for analysis! You can ask questions about these files.`, 
            isNew: false 
          }
        ]);
      } else {
        setPage('documents');
      }
    } catch { alert('Upload error'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleSummarize = async (docId: string, filename: string) => {
    setMessages(prev => [...prev, { role: 'user', content: `Summarize ${filename}` }]);
    setAsking(true); setPage('chat');
    try {
      const res = await summarizeDocument(docId);
      setMessages(prev => [...prev, { role: 'agent', content: res.summary, isNew: true }]);
    } catch { setMessages(prev => [...prev, { role: 'agent', content: 'Summarization failed.' }]); }
    finally { setAsking(false); }
  };

  const handleClear = async () => {
    if (!confirm('Clear all memory and documents?')) return;
    try { await clearDatabase(); } catch {}
    localStorage.removeItem('docmind_messages'); localStorage.removeItem('docmind_documents');
    setDocuments([]); setMessages([]); setPage('home');
  };

  const executeCommand = async (cmdString: string) => {
    const raw = cmdString.trim();
    if (!raw) return;
    setInput('');
    const lower = raw.toLowerCase();

    // 1. /upload
    if (lower === '/upload') {
      const uploadAnswer = `📁 **Document Upload Ready**\n\nOpening file selector... Supported file formats:\n- **PDF Documents** (\`.pdf\`) — Scanned & digital with automatic local OCR\n- **Microsoft Office** (\`.docx\`, \`.pptx\`, \`.xlsx\`)\n- **Images** (\`.png\`, \`.jpg\`, \`.jpeg\`) — Multimodal local vision\n\n*Tip: You can also drag and drop any file directly onto this terminal window!*`;
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '/upload' },
        { role: 'agent', content: uploadAnswer, isNew: false }
      ]);
      setPage('chat');
      setTimeout(() => fileInputRef.current?.click(), 100);
      return;
    }

    // 2. /help
    if (lower === '/help') {
      const helpAnswer = `### 💻 DocMind Terminal Commands\n\n| Command | Description | Example |\n| :--- | :--- | :--- |\n| \`/upload\` | Add documents (PDF, DOCX, PPTX, XLSX, Images) to local memory | \`/upload\` |\n| \`/ask <question>\` | Ask questions about your documents or general inquiries | \`/ask What is the revenue trend?\` |\n| \`/summarize [doc]\` | Generate concise summaries of uploaded documents | \`/summarize\` |\n| \`/help\` | Show available commands and instructions | \`/help\` |\n| \`/clear\` | Clear all memory and reset the local database | \`/clear\` |\n\n*All processing runs 100% offline with local AI embeddings, OCR, and reasoning.*`;
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '/help' },
        { role: 'agent', content: helpAnswer, isNew: false }
      ]);
      setPage('chat');
      return;
    }

    // 3. /ask (without a question)
    if (lower === '/ask') {
      const askAnswer = `💬 **Ask Questions (\`/ask\`)**\n\n**Usage:** \`/ask <your question>\`\n\nAsk questions about any uploaded documents or general topics. DocMind analyzes context, extracts evidence, and cites sources.\n\n**Examples:**\n- \`/ask What are the key takeaways from the contract?\`\n- \`/ask Extract the quarterly revenue table\`\n- \`/ask Explain the diagram on page 5\`\n\n*Tip: You can also type your question directly into the prompt without \`/ask\`.*`;
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '/ask' },
        { role: 'agent', content: askAnswer, isNew: false }
      ]);
      setPage('chat');
      return;
    }

    // 4. /ask <question>
    if (lower.startsWith('/ask ')) {
      const question = raw.substring(5).trim();
      if (!question) {
        executeCommand('/ask');
        return;
      }
      setMessages(prev => [...prev, { role: 'user', content: raw }]);
      setAsking(true);
      setPage('chat');
      try {
        const hist = messages.map(m => ({ sender: m.role, text: m.content }));
        const res = await askAgent(question, undefined, hist);
        setMessages(prev => [...prev, { role: 'agent', content: res.answer, sources: res.sources, isNew: true }]);
      } catch {
        setMessages(prev => [...prev, { role: 'agent', content: 'Error processing request.' }]);
      } finally {
        setAsking(false);
      }
      return;
    }

    // 5. /summarize (without parameter)
    if (lower === '/summarize') {
      let summarizeAnswer = '';
      if (documents.length > 0) {
        summarizeAnswer = `📝 **Document Summarization (\`/summarize\`)**\n\n**Usage:** \`/summarize <document name>\` or click **[SUMMARIZE]** in the **Documents** tab.\n\n**Available Documents:**\n` +
          documents.map(d => `- **${d.filename}** (${d.pages} ${d.pages === 1 ? 'page' : 'pages'})`).join('\n') +
          `\n\n*Type \`/summarize <name>\` or visit the Documents tab to generate an instant executive summary.*`;
      } else {
        summarizeAnswer = `⚠️ **No documents uploaded yet.**\n\nPlease upload a document first before summarizing. Type \`/upload\` or drop a file into this window.`;
      }
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '/summarize' },
        { role: 'agent', content: summarizeAnswer, isNew: false }
      ]);
      setPage('chat');
      return;
    }

    // 6. /summarize <doc_name>
    if (lower.startsWith('/summarize ')) {
      const docQuery = raw.substring(11).trim().toLowerCase();
      const matched = documents.find(d => 
        d.filename.toLowerCase() === docQuery || 
        d.filename.toLowerCase().includes(docQuery) ||
        d.id.toLowerCase() === docQuery
      );
      if (matched) {
        handleSummarize(matched.id, matched.filename);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'user', content: raw },
          { 
            role: 'agent', 
            content: `⚠️ Document "${raw.substring(11).trim()}" not found.\n\n**Loaded Documents:**\n` + 
              (documents.length ? documents.map(d => `- ${d.filename}`).join('\n') : 'No documents loaded yet.'), 
            isNew: false 
          }
        ]);
        setPage('chat');
      }
      return;
    }

    // 7. /clear
    if (lower === '/clear') {
      handleClear();
      return;
    }

    // Regular question
    const hist = messages.map(m => ({ sender: m.role, text: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: raw }]);
    setAsking(true);
    setPage('chat');
    try {
      const res = await askAgent(raw, undefined, hist);
      setMessages(prev => [...prev, { role: 'agent', content: res.answer, sources: res.sources, isNew: true }]);
    } catch {
      setMessages(prev => [...prev, { role: 'agent', content: 'Error processing request.' }]);
    } finally {
      setAsking(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || asking) return;
    executeCommand(input);
  };

  const handleViewSource = async (docId: string, pg: number) => {
    try { const r = await getPageContent(docId, pg); setModalContent({ title: `${docId} — Page ${pg}`, text: r.text }); }
    catch { alert('Failed to load source.'); }
  };

  return (
    <div className={`terminal-window`} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={e => { e.preventDefault(); setIsDragging(false); }} onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}>
      {isDragging && <div className="drag-overlay">[ DROP FILES HERE ]</div>}

      <input type="file" multiple accept=".pdf,image/*,.docx,.pptx,.xlsx" style={{ display: 'none' }} ref={fileInputRef} onChange={e => e.target.files?.length && handleUpload(e.target.files)} />


      {/* Body */}
      <div className="terminal-body">

        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="DocMind" className="logo-img" />
            <h1>DocMind <span>AI</span></h1>
            <p>Your local AI agent for document understanding</p>
          </div>
          <nav className="sidebar-nav">
            <button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>⌂&nbsp; Home</button>
            <button className={`nav-item ${page === 'documents' ? 'active' : ''}`} onClick={() => setPage('documents')}>⊞&nbsp; Documents</button>
            <button className={`nav-item ${page === 'chat' ? 'active' : ''}`} onClick={() => setPage('chat')}>⊡&nbsp; Chat</button>
            <button className={`nav-item ${page === 'aibrain' ? 'active' : ''}`} onClick={() => setPage('aibrain')}>✧&nbsp; AI Brain</button>
            <button className="nav-item" onClick={handleClear}>⚙&nbsp; Clear Memory</button>
          </nav>
        </div>

        {/* Center */}
        <div className="center-panel">
          {page === 'home' && (
            <div className="welcome-panel">
              <h2>Welcome to <span>DocMind AI</span>!</h2>
              <img src="/logo.png" alt="DocMind" className="welcome-logo" />
              <p>Read, analyze and reason over your PDFs with local AI.</p>
            </div>
          )}

          {page === 'documents' && (
            <div className="documents-view">
              <div className="section-title">DOCUMENTS</div>
              {documents.length > 0 && (
                <div className="doc-list">
                  {documents.map((d, i) => (
                    <div key={d.id} className="doc-item">
                      <span className="index">{String(i+1).padStart(2,'0')}</span>
                      <span className="name">{d.filename}</span>
                      <button className="summarize-link" onClick={() => handleSummarize(d.id, d.filename)}>[SUMMARIZE]</button>
                      <span className="pages">{d.pages} pages</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="add-files-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? '[ PROCESSING... ]' : '[ + ADD FILES ]'}
              </button>
            </div>
          )}

          {page === 'chat' && (
            <div className="chat-view">
              {messages.map((msg, i) => (
                <div key={i} className="chat-message">
                  {msg.role === 'user' ? (
                    <div className="user-prompt">&gt; {msg.content}</div>
                  ) : (
                    <>
                      <div className="agent-tag">[AGENT]</div>
                      {msg.isNew ? <Typewriter text={msg.content} onComplete={() => { msg.isNew = false; }} /> : (
                        <div className="agent-text"><ReactMarkdown remarkPlugins={[remarkGfm]} components={MdComponents}>{msg.content}</ReactMarkdown></div>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <>
                          <div className="sources-tag">[SOURCES]</div>
                          {msg.sources.map((s, idx) => <button key={idx} className="source-link" onClick={() => handleViewSource(s.doc_id, s.page)}>{s.doc_id} — Page {s.page}</button>)}
                        </>
                      )}
                      <div className="message-actions"><CopyButton text={msg.content} label="[COPY]" /></div>
                    </>
                  )}
                </div>
              ))}
              {asking && <div className="chat-message"><div className="agent-tag">[PROCESSING...]</div><div className="agent-text">Analyzing...</div></div>}
              <div ref={endRef} />
            </div>
          )}

          {page === 'aibrain' && <AIBrainPage />}
        </div>

        {/* Right Panel (only shown on Home page, hidden on Chat and Documents) */}
        {page === 'home' && (
          <div className="right-panel">
            <div className="info-box">
              <h3>Recent activity</h3>
              {documents.length > 0 ? documents.slice(-4).reverse().map((d, i) => (
                <div key={i} className="activity-item"><span className="time">{i === 0 ? '1m ago' : i === 1 ? '8m ago' : i === 2 ? '2d ago' : '1w ago'}</span><span>Indexed {d.filename}</span></div>
              )) : (
                <div className="activity-item"><span className="time">now</span><span>Agent ready</span></div>
              )}
            </div>
            <div className="info-box">
              <h3>What's new</h3>
              <div className="commands-list">
                <div className="cmd-item" onClick={() => executeCommand('/upload')} role="button" title="Click to run /upload">
                  <span className="cmd">/upload</span> <span>to add documents</span>
                </div>
                <div className="cmd-item" onClick={() => executeCommand('/ask')} role="button" title="Click to run /ask">
                  <span className="cmd">/ask</span> <span>to ask questions</span>
                </div>
                <div className="cmd-item" onClick={() => executeCommand('/summarize')} role="button" title="Click to run /summarize">
                  <span className="cmd">/summarize</span> <span>to generate summaries</span>
                </div>
                <div className="cmd-item" onClick={() => executeCommand('/help')} role="button" title="Click to run /help">
                  <span className="cmd">/help</span> <span>for more commands</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="input-bar">
        <span className="prompt">&gt;</span>
        <input placeholder="Ask a question or type a command..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={asking} autoFocus />
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach files (PDF, DOCX, PPTX, XLSX, images)"
          type="button"
        >
          {uploading ? (
            <span className="attach-spinner">⏳</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
        </button>
        <button className="send-btn" onClick={handleSend} disabled={asking || !input.trim()}>▶</button>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="modal-backdrop" onClick={() => setModalContent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span>{modalContent.title}</span><button className="modal-close" onClick={() => setModalContent(null)}>[ X ]</button></div>
            <div className="modal-body">{modalContent.text}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
