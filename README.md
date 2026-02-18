### 🚀 JustPing – Modern Chat Application 

A modern desktop chat UI built using React, TypeScript, and Tailwind CSS.

This project demonstrates clean UI architecture, reusable components, state management, and production-ready frontend structure.
  
##  ✨ Features

💬 Real-time message rendering
😊 Emoji picker
🎙 Voice message recording & preview
📎 File attachments with preview
🔎 Chat search
🟢 Online/offline indicators
📌 Pinned chats
🔕 Muted chats
📱 Responsive layout
🎨 Modern light SaaS UI

## 🛠 Tech Stack

React (Vite)

TypeScript

Tailwind CSS

HTML5 Audio API (MediaRecorder)

## Screenshots

<img width="1803" height="944" alt="Screenshot 2026-02-18 225708" src="https://github.com/user-attachments/assets/05dbb4b0-d3cf-4908-a2b4-b74a646e9009" />

<img width="1831" height="949" alt="Screenshot 2026-02-18 225736" src="https://github.com/user-attachments/assets/ab1aae82-60d7-4550-8a86-c8b88c64a5a3" />

<img width="1796" height="943" alt="Screenshot 2026-02-18 225817" src="https://github.com/user-attachments/assets/bd22acfc-f36c-4911-9568-a8792f0bb4a9" />

## ⚙️ Setup & Installation

Follow these steps to run the project locally:

1. Clone the repository  
   ```bash
   git clone https://github.com/yourusername/justping.git
   cd justping
2. Install dependencies
   ```bash
    npm install
3. Start development server
   ```bash
    npm run dev


## 2️⃣ Component Structure

```md
## 🧱 Component Structure

The application follows a modular and scalable structure.
src/
│
├── App.tsx → Main layout container
├── main.tsx → React root renderer
├── index.css → Tailwind styles
│
├── components/
│ ├── Sidebar → Chat list + search
│ ├── ChatHeader → Active chat info
│ ├── Messages → Message rendering logic
│ ├── MessageBubble→ Individual message UI
│ ├── InputArea → Text input + controls

```

## 🧠 State Management

State is managed using React Hooks.

## Core State Variables

- `chats` → Stores chat list metadata
- `activeChatId` → Currently selected conversation
- `messagesByChat` → Messages grouped by chat ID
- `input` → Text message input
- `showEmojiPicker` → Emoji panel visibility
- `isRecording` → Voice recording state
- `audioPreviewUrl` → Recorded voice preview
- `pendingAttachments` → Selected files before sending

## Key Concepts Used

- `useState` for local state management
- `useMemo` for optimized chat filtering
- `useEffect` for auto-scroll behavior
- `useRef` for:
  - MediaRecorder control
  - File input handling
  - Scroll management

This approach keeps the UI reactive and predictable.

## 😊 Emoji, 🎙 Voice & 📎 File Handling

## Emoji Picker

- Emoji list rendered dynamically
- Clicking emoji appends to input field
- Caret position maintained using `useRef`
- Controlled textarea ensures consistent updates

## Voice Message Recording

- Uses **MediaRecorder API**
- Requests microphone permission via:
  ```js
  navigator.mediaDevices.getUserMedia({ audio: true })
- Audio recorded in chunks
- Blob converted to preview URL using:
  ```js
  URL.createObjectURL(blob)

Allows:

- Preview before sending
- Discard option
- Send voice message to chat

## File Attachments

- Uses hidden <input type="file" />
- Supports: Images, Documents, PDFs, Zip files
- Selected files stored in state
- Preview panel shown before sending
- Image files display thumbnails
- Other files show metadata (name + size)

## 📌 Future Improvements

- Backend integration (FastAPI / Node.js)
- WebSocket real-time messaging
- Authentication system
- Message persistence (database)
- Mobile optimization

## Author 

Pratiksha Kulkarni
