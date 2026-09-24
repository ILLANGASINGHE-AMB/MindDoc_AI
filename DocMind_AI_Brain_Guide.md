# DocMind AI — AI Brain Tab Guide

## Feature

Add a new navigation tab named **AI Brain**.

When the user clicks **AI Brain**, show a dedicated animated neural-network visualization representing the real-time activity of the DocMind AI Agent.

The animation should be driven by actual Agent events, not just a decorative looping animation.

---

## 1. Navigation

Use:

```text
HOME
DOCUMENTS
CHAT
AI BRAIN
SETTINGS
```

When selected:

```text
[ AI BRAIN ]
```

Keep the existing dark terminal + orange DocMind visual theme.

---

## 2. AI Brain Page

Recommended layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ AI BRAIN                                                    │
│                                                             │
│                  ●────●────●                                │
│                ╱  ╲  │  ╱  ╲                               │
│              ●────●──●──●────●                             │
│              │ ╲  ╲ │ ╱  ╱ │                              │
│              ●──●──●●──●──●                                │
│                ╲  ╱ │ ╲  ╱                                │
│                  ●──●──●                                   │
│                                                             │
│                    > REASONING                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ STATUS                                                      │
│ > STATE       REASONING                                     │
│ > DOCUMENT   Research_Paper.pdf                             │
│ > PAGE       18                                             │
│ > TOOL       Vision + Retrieval                             │
│                                                             │
│ ACTIVITY                                                    │
│ > Found Figure 5                                            │
│ > Analyzing visual content                                  │
│ > Retrieving related text                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Visual Style

Match the existing DocMind terminal UI.

### Colors

```text
Background: #171716 / #1D1C1B
Primary Orange: #D9825B
Bright Orange: #FF7A30
Dark Orange: #B94B1F
Primary Text: #E8E5E1
Secondary Text: #AAA39B
Muted Text: #6F6A64
Success: #77C66E
```

Use a monospace font such as:

```text
JetBrains Mono
IBM Plex Mono
Fira Code
SFMono-Regular
Consolas
```

The brain should be **orange/amber**, with no blue/cyan neon effects.

---

## 4. Brain Visualization

Create a procedural neural network containing:

- Nodes
- Connections
- Pulses
- Moving particles
- Activity levels
- Left/right clusters
- Central processing nodes

Example:

```text
                 ●
              ╱  │  ╲
            ●────●────●
          ╱ │ ╲  │  ╱ │ ╲
         ●──●──●─●──●──●
          ╲ │ ╱  │ ╲ │ ╱
            ●────●────●
              ╲  │  ╱
                 ●
```

Use HTML Canvas for the first implementation. WebGL/Three.js can be added later if required.

---

## 5. Agent States

The visualization must react to Agent states.

```typescript
type AgentState =
  | "idle"
  | "listening"
  | "understanding"
  | "searching"
  | "retrieving"
  | "ocr"
  | "vision"
  | "reasoning"
  | "verifying"
  | "answering"
  | "complete"
  | "error";
```

### IDLE

Low activity, slow pulses.

```text
> AGENT IDLE
```

### LISTENING

Small pulse from the center.

```text
> LISTENING
```

### UNDERSTANDING

Central nodes become active.

```text
> UNDERSTANDING QUERY
```

### SEARCHING

Activity spreads through the network.

```text
> SEARCHING DOCUMENTS
```

### RETRIEVING

Multiple nodes and connections activate.

```text
> RETRIEVING EVIDENCE
```

### OCR

A dedicated cluster activates with scanning pulses.

```text
> OCR ANALYSIS
```

### VISION

Vision-related nodes become highly active.

```text
> VISION ANALYSIS
```

### REASONING

Highest activity. Multiple clusters communicate.

```text
> REASONING
```

### VERIFYING

Activity moves between evidence and reasoning clusters.

```text
> VERIFYING EVIDENCE
```

### ANSWERING

Activity converges toward the center.

```text
> GENERATING RESPONSE
```

### COMPLETE

Activity settles and the center performs one final pulse.

```text
> COMPLETE
```

---

## 6. Activity Intensity

Example mapping:

```typescript
const activityMap = {
  idle: 0.1,
  listening: 0.25,
  understanding: 0.4,
  searching: 0.55,
  retrieving: 0.65,
  ocr: 0.7,
  vision: 0.75,
  reasoning: 1.0,
  verifying: 0.8,
  answering: 0.6,
  complete: 0.2
};
```

Activity should affect:

- Node brightness
- Pulse frequency
- Particle count
- Connection activity
- Animation speed

---

## 7. Real Agent Events

The backend should emit events such as:

```json
{
  "type": "agent_state",
  "state": "searching",
  "message": "Searching document index..."
}
```

Vision:

```json
{
  "type": "agent_state",
  "state": "vision",
  "message": "Analyzing Figure 5..."
}
```

Reasoning:

```json
{
  "type": "agent_state",
  "state": "reasoning",
  "message": "Reasoning over retrieved evidence..."
}
```

---

## 8. Backend → Frontend

Recommended architecture:

```text
Python AI Backend
       │
       │ WebSocket
       ↓
React Frontend
       │
       ↓
Agent Event Handler
       │
       ↓
Brain State
       │
       ↓
Canvas Animation
```

WebSockets are recommended because Agent states can change in real time.

Example:

```typescript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "agent_state") {
    setAgentState(data.state);
  }
};
```

Then:

```tsx
<BrainVisualization state={agentState} />
```

---

## 9. Brain Data Structures

```typescript
interface BrainNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  activity: number;
  cluster: string;
}

interface BrainConnection {
  source: string;
  target: string;
  activity: number;
  particles: Particle[];
}
```

The network should be generated procedurally rather than manually drawing every node.

---

## 10. Particles

Particles represent information moving through the Agent.

Low activity:

```text
●────────────●
```

Active:

```text
●──·──·──·──→●
```

High reasoning activity:

```text
●─·─·─·─→●─·─·─→●
  ↑       ↓
  ·       ·
```

Particle speed and quantity should increase with Agent activity.

---

## 11. Status Panel

Show high-level system activity:

```text
AGENT STATUS
──────────────────────────────

STATE       : REASONING
DOCUMENT    : Research_Paper.pdf
PAGE        : 18
TOOL        : Vision Analysis
ACTIVITY    : HIGH
```

Do **not** display hidden chain-of-thought or private model reasoning.

Only display safe high-level actions such as:

```text
Searching documents
Analyzing image
Retrieving evidence
Verifying sources
Generating response
```

---

## 12. Activity Log

Use the terminal style:

```text
[11:42:01] Query received
[11:42:02] Searching document index
[11:42:03] Found 5 relevant sections
[11:42:04] Figure detected
[11:42:05] Vision analysis started
[11:42:08] Evidence retrieved
[11:42:09] Verification complete
[11:42:10] Response generated
```

Keep the log scrollable.

---

## 13. Idle Screen

When nothing is happening:

```text
                 ●────●
              ╱         ╲
            ●────●──●────●
           │      ●      │
            ●────●──●────●
              ╲         ╱
                 ●──●

                  IDLE

          Waiting for your question...
```

The network should gently move and pulse.

---

## 14. Processing Screen

When the Agent is active:

```text
                ✦
             ●───●───●
           ╱  ↗  │  ↘  ╲
         ●───●───●───●───●
         │ ↗  ╲  │  ╱ ↘  │
         ●───●──●──●──●──●
           ╲    ↘  ↙    ╱
             ●───●───●

               REASONING
```

Use orange pulses and moving particles.

---

## 15. Error State

```text
                ●──●
               ╱
              ●

             ERROR

> Vision model unavailable
```

Allow the user to continue using the rest of DocMind.

---

## 16. Performance

Target approximately:

```text
60 FPS
```

Recommended initial configuration:

```text
Nodes:       60–100
Connections: 100–180
Particles:   10–30
Renderer:    Canvas 2D
```

Additional optimization:

- Use `requestAnimationFrame`
- Pause rendering when the tab is hidden
- Reduce particles on low-power machines
- Avoid unnecessary React re-renders
- Keep Agent processing independent from animation rendering

---

## 17. Suggested Components

```text
src/
├── components/
│   └── AIBrain/
│       ├── AIBrainPage.tsx
│       ├── BrainCanvas.tsx
│       ├── BrainNode.ts
│       ├── BrainConnection.ts
│       ├── ParticleSystem.ts
│       ├── AgentStatus.tsx
│       └── ActivityLog.tsx
│
├── services/
│   └── agentSocket.ts
│
└── types/
    └── agent.ts
```

Suggested page:

```tsx
<AIBrainPage>
  <BrainHeader />
  <BrainCanvas state={agentState} />
  <AgentStatus
    state={agentState}
    document={currentDocument}
    page={currentPage}
  />
  <ActivityLog events={events} />
</AIBrainPage>
```

---

## 18. Navigation Behavior

When clicking:

```text
AI Brain
```

the application should:

1. Open the AI Brain page.
2. Start/resume visualization.
3. Connect to the Agent event stream.
4. Show the current Agent state.
5. Show recent activity.
6. Continue receiving new events.

If nothing is happening:

```text
> AGENT IDLE
> Waiting for activity...
```

If the user leaves the page:

- Keep the Agent working.
- Pause or reduce visual rendering.
- Resume the animation when the user returns.

---

## 19. Complete Example Workflow

User asks:

```text
Explain Figure 5 in Research_Paper.pdf.
```

The Brain should transition through:

```text
> LISTENING
       ↓
> UNDERSTANDING QUERY
       ↓
> SEARCHING DOCUMENTS
       ↓
> RETRIEVING EVIDENCE
       ↓
> VISION ANALYSIS
       ↓
> REASONING
       ↓
> VERIFYING EVIDENCE
       ↓
> GENERATING RESPONSE
       ↓
> COMPLETE
```

Each state should produce a visibly different activity pattern.

---

## 20. Important Concept

The visualization should **not** claim to show the actual internal neural activations of the LLM.

It should be described as:

```text
AI BRAIN
Agent Activity
Neural Activity Visualization
Agent Status
```

It is a visual representation of actual system-level Agent events.

---

# Final Feature

The DocMind navigation becomes:

```text
HOME
DOCUMENTS
CHAT
AI BRAIN
SETTINGS
```

And the AI Brain follows:

```text
Real Agent Event
      ↓
WebSocket
      ↓
React State
      ↓
Brain Animation
      ↓
Visual Feedback
```

The goal is for the user to immediately understand:

> **"This is what my local AI Agent is doing right now."**

The feature should combine:

```text
Terminal UI
+
AI Agent
+
Real-Time Activity
+
Neural Network Visualization
+
Offline AI
```

while remaining lightweight, meaningful, and consistent with the orange DocMind terminal interface.
