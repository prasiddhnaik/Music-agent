# 🎵 Day to Song

**Turn your daily experiences into personalized music using AI.**

An AI-powered journaling companion that transforms how you felt about your day into a unique audio experience.

---

## 🎯 How It Works

```mermaid
flowchart LR
    subgraph User Journey
        A[👤 User] -->|"Shares their day"| B[💬 Chat UI]
        B -->|"Conversation"| C[🤖 Groq AI]
        C -->|"Asks about mood,\ngenre, moments"| B
        C -->|"Creates song spec"| D[🎵 Song Card]
        D -->|"User approves"| E[🎧 ElevenLabs]
        E -->|"Generated audio"| F[🎶 Your Song!]
    end
```

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Frontend ["🖥️ Frontend (Next.js 16)"]
        UI[page.tsx<br/>Chat Interface]
        MSG[Message Components]
        TOOL[ToolRenderer<br/>SongCard]
        UI --> MSG
        UI --> TOOL
    end

    subgraph Backend ["⚙️ Backend (API Routes)"]
        API["/api/chat<br/>route.ts"]
        SONG[generate_song<br/>Tool]
    end

    subgraph External ["🌐 External APIs"]
        GROQ[("🦙 Groq API<br/>Llama 3.3 70B")]
        ELEVEN[("🎵 ElevenLabs<br/>Music Generation")]
    end

    UI -->|"POST /api/chat"| API
    API -->|"AI Conversation"| GROQ
    GROQ -->|"Tool Call"| SONG
    SONG -->|"Generate Audio"| ELEVEN
    ELEVEN -->|"Audio Stream"| TOOL
```

---

## 🔄 Conversation Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant C as 💬 Chat UI
    participant AI as 🤖 Groq AI
    participant T as 🛠️ Tool
    participant E as 🎵 ElevenLabs

    U->>C: "I had an amazing day hiking!"
    C->>AI: Send message
    AI->>C: "That sounds wonderful! How do you want the song to feel?"
    C->>U: Display response
    
    U->>C: "Energetic and free"
    C->>AI: Send message
    AI->>C: "What genre? Indie folk, electronic, acoustic?"
    C->>U: Display response
    
    U->>C: "Indie folk please"
    C->>AI: Send message
    AI->>T: Call generate_song tool
    T->>C: Show Song Preview Card
    C->>U: Display card with Approve button
    
    U->>C: Click "Approve"
    C->>T: Trigger generation
    T->>E: Generate music
    E->>T: Return audio
    T->>C: Show audio player
    C->>U: 🎶 Play your song!
```

---

## 📦 Component Structure

```mermaid
graph TD
    subgraph Pages
        PAGE[page.tsx]
    end
    
    subgraph Components
        MSG[message.tsx]
        TR[tool-renderer.tsx]
        SC[song-card.tsx]
        AP[audio-player.tsx]
    end
    
    subgraph Lib
        GS[generate-song.ts]
        EM[eleven-music.ts]
        PR[prompts.ts]
        ST[storage.ts]
    end
    
    subgraph API
        ROUTE[route.ts]
    end

    PAGE --> MSG
    PAGE --> TR
    TR --> SC
    SC --> AP
    
    ROUTE --> GS
    GS --> EM
    EM --> ST
    ROUTE --> PR
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/prasiddhnaik/Music-agent.git
cd Music-agent
npm install
```

### 2. Configure Environment

Create `.env.local` with your API keys:

```env
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

**Get your keys:**
- Groq: https://console.groq.com/keys (FREE)
- ElevenLabs: https://elevenlabs.io/app/settings/api-keys

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## 🛠️ Tech Stack

```mermaid
mindmap
  root((Day to Song))
    Frontend
      Next.js 16
      React 19
      Tailwind CSS v4
      Lucide Icons
    Backend
      Vercel AI SDK
      API Routes
    AI Services
      Groq
        Llama 3.3 70B
      ElevenLabs
        Music API
    Infrastructure
      Node.js
      TypeScript
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/chat/
│   │   └── route.ts        # AI chat endpoint
│   ├── page.tsx            # Main chat UI
│   └── globals.css         # Styles
├── components/
│   ├── chat/
│   │   ├── message.tsx     # Chat message bubble
│   │   └── tool-renderer.tsx
│   ├── song-card.tsx       # Song preview/player
│   └── audio-player.tsx    # Audio controls
└── lib/
    ├── tools/
    │   ├── generate-song.ts  # AI tool definition
    │   └── eleven-music.ts   # ElevenLabs integration
    ├── types.ts
    └── utils/
        ├── prompts.ts      # System prompt
        └── storage.ts      # Audio file storage
```

---

## 🏆 Hackathon

Built for MLH Hackathon - **Best Use of ElevenLabs** category.

---

## 📄 License

MIT
