# DocMind AI — Terminal-Inspired UI Specification

## Purpose

Redesign the **DocMind AI** interface to visually resemble the provided terminal-style reference image.

The goal is **not** to copy the reference application or its branding. Instead, use the same visual language:

- Dark terminal window
- Minimal monochrome interface
- Thin borders
- Orange/amber accent text
- Monospace typography
- Compact information panels
- Command-line style interaction
- Minimal decoration
- Technical/developer-tool aesthetic

DocMind AI should remain a modern **offline multimodal PDF AI Agent**, but its interface should feel like a powerful local AI tool rather than a conventional chatbot.

---

# 1. Product Identity

## Name

**DocMind AI**

## Description

**Offline multimodal AI agent for reading, analyzing, and reasoning over PDF documents.**

## Core message

```text
YOUR DOCUMENTS. DEEPER INSIGHTS.
```

## Key capabilities

```text
PDF READING
OCR
VISION
RAG
LOCAL LLM
AGENTIC REASONING
OFFLINE
```

---

# 2. Visual Direction

Use the uploaded reference image as the visual inspiration.

The interface should feel like:

```text
Terminal
+
AI Agent
+
Document Intelligence
```

Avoid making it look like:

```text
Generic ChatGPT clone
Modern SaaS dashboard
Colorful AI landing page
Large card-based admin dashboard
```

The final interface should be **compact, technical, dark, and focused**.

---

# 3. Overall Layout

Use a centered desktop application window.

```text
┌──────────────────────────────────────────────────────────────┐
│ ● ● ●                 DocMind AI                         ─ □ ×│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────┬─────────────────────────────┐  │
│  │                          │                             │  │
│  │      DOCMIND AI          │     DOCUMENT STATUS         │  │
│  │                          │                             │  │
│  │  Offline PDF Agent       │  Recent Activity            │  │
│  │                          │                             │  │
│  │        [ BOOK ]          │  2m ago  Indexed PDF        │  │
│  │                          │  5m ago  OCR completed      │  │
│  │                          │  8m ago  Agent ready        │  │
│  │                          │                             │  │
│  └──────────────────────────┴─────────────────────────────┘  │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  > Ask DocMind anything about your documents                 │
│                                                              │
│  > _                                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 4. Window Style

The application should look like a standalone desktop terminal application.

### Window

- Dark charcoal background
- Slightly rounded corners
- Subtle border
- Minimal shadow
- Compact top bar
- No excessive gradients

### Top bar

Use macOS-style window controls:

```text
● ● ●
```

Use:

```text
red
yellow
green
```

but keep them small and subtle.

Title:

```text
DocMind AI
```

Optional status:

```text
LOCAL
```

---

# 5. Color System

Use a restrained palette.

## Background

```text
Main:
#171716

Panel:
#1D1C1B

Secondary:
#232220

Border:
#4A4540
```

## Primary Accent

Use a warm terminal orange:

```text
#D9825B
```

## Secondary Accent

Soft amber:

```text
#E5A66A
```

## Text

Primary:

```text
#E8E5E1
```

Secondary:

```text
#AAA39B
```

Muted:

```text
#6F6A64
```

## Status

Online/local indicator:

```text
#77C66E
```

Error:

```text
#D96C63
```

Do not introduce many colors.

The design should mostly be:

```text
Dark gray
+
Off-white
+
Orange
+
Muted green
```

---

# 6. Typography

Use a monospace font throughout the interface.

Preferred fonts:

```text
JetBrains Mono
IBM Plex Mono
Fira Code
SFMono-Regular
Consolas
monospace
```

Recommended:

```css
font-family:
  "JetBrains Mono",
  "SFMono-Regular",
  Consolas,
  monospace;
```

Use monospace for:

- Headings
- Labels
- Buttons
- Chat
- Agent activity
- Document names
- Metadata
- Status messages

This is important for achieving the terminal aesthetic.

---

# 7. Main Header

The top-left area should show:

```text
DOCMIND AI
```

Example:

```text
┌───────────────────────────────────────────────┐
│ DocMind AI v1.0.0                         ●  │
└───────────────────────────────────────────────┘
```

Optional subtitle:

```text
OFFLINE MULTIMODAL DOCUMENT AGENT
```

Use uppercase small text.

---

# 8. Main Hero / Welcome Panel

The main welcome area should resemble the information panel in the reference.

Example:

```text
┌───────────────────────────────┐
│ DOCMIND AI v1.0.0             │
│                               │
│ Welcome back.                 │
│                               │
│       ╭──────────╮            │
│       │   BOOK   │            │
│       ╰──────────╯            │
│                               │
│ Offline Multimodal Agent      │
│ Local LLM + OCR + Vision      │
└───────────────────────────────┘
```

Keep this compact.

Do not use a huge hero section.

---

# 9. Logo

Use the existing DocMind AI book logo.

However, in this interface:

- Use the **book icon only**
- Do not display the full logo with text everywhere
- Use the icon as the central visual identity
- Prefer monochrome or orange-tinted treatment where appropriate
- Avoid a large colorful gradient logo

The existing blue book icon may remain in the application branding, but the overall interface should still feel terminal-like.

---

# 10. Information Panel

Create a two-column terminal-style information panel.

```text
┌───────────────────────────┬──────────────────────────────┐
│ SYSTEM                    │ RECENT ACTIVITY              │
│                           │                              │
│ DocMind AI                │ 2m ago   PDF indexed         │
│ Version 1.0.0             │ 5m ago   OCR completed       │
│ Mode: LOCAL               │ 8m ago   Agent ready         │
│ Internet: DISABLED        │ 12m ago  Vision model ready  │
│ Model: Local LLM          │                              │
│                           │                              │
└───────────────────────────┴──────────────────────────────┘
```

Use a thin orange border.

Section titles should use orange text.

---

# 11. Local Mode

Make offline operation highly visible.

Example:

```text
[●] LOCAL MODE

Internet connection not required.
Your documents remain on this device.
```

Use a small green indicator.

Do not use a large colorful badge.

---

# 12. Documents Section

Instead of a large modern document card grid, use a compact terminal list.

Example:

```text
DOCUMENTS
──────────────────────────────────────────────

01  Operating_Systems.pdf       124 pages
02  Computer_Networks.pdf        86 pages
03  Research_Paper.pdf           32 pages
04  Lecture_Notes.pdf            74 pages

[ + ADD PDF ]
```

Document names should be monospace.

---

# 13. Add PDF Button

The main PDF upload action should look like a terminal command.

Instead of:

```text
+ Add PDF
```

prefer:

```text
[ + ADD PDF ]
```

or:

```text
> ADD PDF
```

On hover:

```text
> ADD PDF _
```

The button should have:

- Thin orange border
- Transparent/dark background
- Orange text
- Minimal radius
- Monospace font

---

# 14. Drag and Drop

Support drag and drop.

Display:

```text
┌──────────────────────────────────────────────┐
│                                              │
│   DROP PDF HERE                              │
│                                              │
│   or                                         │
│                                              │
│   > ADD PDF                                  │
│                                              │
└──────────────────────────────────────────────┘
```

Keep the area compact.

Do not use large colorful illustrations.

---

# 15. Agent Chat

The chat should NOT look like a conventional chat application.

Avoid:

```text
User bubble
Assistant bubble
User bubble
Assistant bubble
```

Instead, make it resemble a terminal interaction.

Example:

```text
────────────────────────────────────────────────

> Explain the architecture shown in Figure 5.

[AGENT]

Searching Research_Paper.pdf...
Found Figure 5 on page 18.
Analyzing diagram...
Checking surrounding text...
Reasoning over retrieved evidence...

[ANSWER]

Figure 5 illustrates the proposed system architecture.
The main components are...

[SOURCES]

Research_Paper.pdf — Page 18
Research_Paper.pdf — Page 19

────────────────────────────────────────────────

> _
```

---

# 16. Chat Input

The chat input should appear as a command prompt.

Example:

```text
┌───────────────────────────────────────────────────────────┐
│ > Ask DocMind about your documents...                  ↑ │
└───────────────────────────────────────────────────────────┘
```

Or:

```text
> _
```

The cursor should blink.

Use a subtle monospace caret.

---

# 17. Send Button

Instead of a large modern send icon, use:

```text
[ SEND ]
```

or:

```text
[ ↵ ]
```

Preferred:

```text
> SEND
```

The button should use the terminal orange accent.

---

# 18. Agent Activity

Agent activity should be displayed as terminal logs.

Example:

```text
[09:41:02] Agent initialized
[09:41:05] Searching document index
[09:41:06] Found 4 relevant chunks
[09:41:07] Figure detected
[09:41:08] Vision analysis started
[09:41:11] Evidence verification complete
[09:41:12] Response generated
```

Use muted text for timestamps.

Use orange for important Agent actions.

---

# 19. Agent Thinking Indicator

Do not use a generic loading spinner.

Instead:

```text
> Agent is analyzing...
```

or:

```text
[PROCESSING]
Searching...
Analyzing...
Reasoning...
```

Animated terminal dots are acceptable:

```text
[PROCESSING...]
```

---

# 20. Status Bar

Add a small bottom status bar.

Example:

```text
────────────────────────────────────────────────────────────
LOCAL MODE     LLM: READY     VECTOR DB: READY     OCR: READY
────────────────────────────────────────────────────────────
```

Use small text.

---

# 21. Suggested Full Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ ● ● ●    DocMind AI v1.0.0                    LOCAL ●      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────┐ ┌─────────────────────────────┐ │
│  │ DOCMIND AI             │ │ RECENT ACTIVITY             │ │
│  │                        │ │                             │ │
│  │ Welcome back.          │ │ 2m ago  PDF indexed         │ │
│  │                        │ │ 5m ago  OCR completed       │ │
│  │        [ BOOK ]        │ │ 8m ago  Agent ready         │ │
│  │                        │ │ 12m ago Vision ready        │ │
│  │ OFFLINE PDF AGENT      │ │                             │ │
│  └────────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│  DOCUMENTS                                                  │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  01  Research_Paper.pdf                      32 pages       │
│  02  Lecture_Notes.pdf                       74 pages       │
│  03  Operating_Systems.pdf                  124 pages       │
│                                                             │
│  > ADD PDF                                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  AGENT                                                       │
│                                                             │
│  > Explain the architecture shown in Figure 5.              │
│                                                             │
│  [AGENT]                                                     │
│  Searching Research_Paper.pdf...                            │
│  Found Figure 5 — Page 18                                   │
│  Analyzing diagram...                                       │
│  Verifying evidence...                                      │
│                                                             │
│  [ANSWER]                                                    │
│  The architecture consists of...                            │
│                                                             │
│  [SOURCES]                                                   │
│  Research_Paper.pdf — Page 18                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  > Ask DocMind about your documents...              [SEND]  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ LOCAL MODE   LLM READY   OCR READY   VECTOR DB READY        │
└─────────────────────────────────────────────────────────────┘
```

---

# 22. Interaction Design

## Add PDF

Click:

```text
> ADD PDF
```

opens the native file picker.

After selecting a PDF:

```text
[INDEXING]

Reading document...
Extracting text...
Detecting images...
Generating embeddings...
Adding to knowledge base...

[OK] Research_Paper.pdf indexed.
```

---

## Ask Question

User types:

```text
> What is the main objective of this paper?
```

The Agent displays:

```text
[AGENT]

Searching document...
```

Then:

```text
[ANSWER]

The main objective is...
```

Then:

```text
[SOURCES]

Research_Paper.pdf — Page 2
```

---

# 23. Multimodal Agent Example

For an image-based question:

```text
> Explain Figure 7.
```

Agent:

```text
[AGENT]

Searching for Figure 7...
Found Figure 7 — Page 24.
Image detected.
Vision analysis started.
Reading surrounding text...
Cross-checking evidence...

[ANSWER]

Figure 7 represents...

[SOURCES]

Research_Paper.pdf
Page 24
Figure 7
```

---

# 24. Design Rules

Follow these rules strictly.

### DO

- Use dark backgrounds.
- Use monospace typography.
- Use thin borders.
- Use orange terminal accents.
- Use compact spacing.
- Use text-based status information.
- Use terminal-style prompts.
- Use subtle animations.
- Keep the interface technical.
- Keep the UI focused on documents and the Agent.

### DON'T

- Do not create a generic ChatGPT clone.
- Do not use large colorful gradient cards.
- Do not use excessive rounded cards.
- Do not use giant hero sections.
- Do not use excessive illustrations.
- Do not use excessive shadows.
- Do not use a colorful sidebar.
- Do not use conventional chat bubbles.
- Do not make the interface look like a SaaS dashboard.

---

# 25. Responsive Behavior

The application should work on:

- Desktop
- Laptop
- Smaller desktop windows

On smaller screens:

```text
SYSTEM
RECENT ACTIVITY
DOCUMENTS
AGENT
```

should stack vertically.

The terminal aesthetic must remain intact.

---

# 26. Accessibility

Ensure:

- Good text contrast
- Keyboard navigation
- Visible focus states
- Screen-reader labels
- Keyboard shortcut support
- Clear error messages

Recommended shortcuts:

```text
Cmd/Ctrl + O   Add PDF
Cmd/Ctrl + K   Focus Agent
Enter          Send
Shift + Enter  New line
Esc            Cancel operation
```

---

# 27. Suggested Microcopy

## Welcome

```text
Welcome back.
```

## Empty document state

```text
No documents indexed.
> ADD PDF
```

## Empty chat state

```text
No active conversation.

> Ask DocMind about your documents...
```

## Processing

```text
[PROCESSING]
Agent is analyzing your documents...
```

## Success

```text
[OK]
Document indexed successfully.
```

## Error

```text
[ERROR]
Unable to process document.
```

## Offline

```text
[LOCAL]
Internet connection not required.
```

---

# 28. Overall Design Goal

The finished UI should feel like:

> **A powerful local AI agent running inside a futuristic developer terminal.**

The user should immediately understand:

```text
This is local.
This is private.
This reads my documents.
This is an AI agent.
This can reason over PDFs.
```

The interface should communicate those ideas through **minimal terminal-style visual language rather than large explanatory graphics**.

---

# 29. Implementation Guidance

If implementing with React + TypeScript + Tailwind CSS:

### Recommended structure

```text
src/
├── components/
│   ├── TerminalWindow.tsx
│   ├── Header.tsx
│   ├── WelcomePanel.tsx
│   ├── ActivityPanel.tsx
│   ├── DocumentList.tsx
│   ├── AddPdfButton.tsx
│   ├── AgentConsole.tsx
│   ├── ChatInput.tsx
│   └── StatusBar.tsx
│
├── pages/
│   └── Home.tsx
│
├── styles/
│   └── terminal.css
│
└── App.tsx
```

---

# 30. CSS Style Direction

Use a base style similar to:

```css
body {
  background: #171716;
  color: #e8e5e1;
  font-family:
    "JetBrains Mono",
    "SFMono-Regular",
    Consolas,
    monospace;
}

.terminal-panel {
  background: #1d1c1b;
  border: 1px solid #4a4540;
}

.accent {
  color: #d9825b;
}

.muted {
  color: #6f6a64;
}
```

Avoid excessive CSS effects.

---

# 31. Final UI Identity

The final interface should combine:

```text
┌──────────────────────────────────────────┐
│                                          │
│        TERMINAL AESTHETIC                │
│                  +                       │
│        AI AGENT WORKFLOW                 │
│                  +                       │
│        PDF DOCUMENT INTELLIGENCE         │
│                  +                       │
│        OFFLINE / LOCAL PRIVACY           │
│                                          │
└──────────────────────────────────────────┘
```

The reference image is a **visual style reference only**.

Do not copy its branding, text, logo, exact layout, or proprietary interface elements.

Create an original DocMind AI interface using the same high-level terminal/developer-tool aesthetic.
