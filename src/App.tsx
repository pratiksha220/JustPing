import React, { useState, useMemo, useRef, useEffect } from 'react'

type MessageSide = 'in' | 'out'

interface Attachment {
  id: number
  name: string
  size: number
  type: string
  url: string
}

interface Message {
  id: number
  text?: string
  time: string
  side: MessageSide
  audioUrl?: string
  attachment?: Attachment
}

interface Chat {
  id: number
  name: string
  lastMessage: string
  time: string
 
  isMuted?: boolean
  isPinned?: boolean
  isOnline?: boolean
}

const sampleChats: Chat[] = [
  {
    id: 1,
    name: 'Ramesh Sharma',
    lastMessage: 'Reaching office in 10 mins 🚗',
    time: '09:14',
    
    isPinned: true,
    isOnline: true,
  },
  {
    id: 2,
    name: 'Neha Verma',
    lastMessage: '',
    time: '08:52',
    
    isOnline: true,
  },
  {
    id: 3,
    name: 'Product Team',
    lastMessage: '',
    time: 'Yesterday',
    
    isMuted: true,
  },
  {
    id: 4,
    name: 'Weekend Football',
    lastMessage: '',
    time: 'Yesterday',
    isMuted: true,
  },
  {
    id: 5,
    name: 'Family Group',
    lastMessage: '',
    time: 'Sun',
    
  },
  {
    id: 6,
    name: 'Freelance Client',
    lastMessage: '',
    time: 'Sat',
  },
]

const sampleMessages: Message[] = [
  {
    id: 1,
    text: 'Hey! This is your new JustPing chat UI 👋',
    time: '18:11',
    side: 'in',
  },
  {
    id: 2,
    text: 'Feel free to type and send messages below. You can send audios and attachments too!',
    time: '18:12',
    side: 'in',
  },
  {
    id: 3,
    text: 'It supports emojis too 😄🎉',
    time: '18:13',
    side: 'out',
  },
]

type MessagesByChat = Record<number, Message[]>

const emojiCategories = [
  '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚',
  '😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️',
  '😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🫣 😱 😨 😰 😥 😓 🤗',
  '👍 👎 👊 ✊ 🤛 🤜 👋 🤚 ✋ 🖐️ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇',
]

const emojiList = emojiCategories
  .flatMap((row) => row.split(' '))
  .filter((emoji) => emoji.trim().length > 0)

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`
}

export const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>(sampleChats)
  const [activeChatId, setActiveChatId] = useState<number>(sampleChats[0].id)
  const [messagesByChat, setMessagesByChat] = useState<MessagesByChat>(() => ({
    [sampleChats[0].id]: sampleMessages,
  }))
  const [input, setInput] = useState<string>('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats
    return chats.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase().trim()),
    )
  }, [chats, search])

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0]
  const activeMessages = messagesByChat[activeChatId] ?? []

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messageIdRef = useRef(
    sampleMessages.reduce((max, m) => Math.max(max, m.id), 0) + 1,
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  const ensureChatHasInitialMessages = (chatId: number) => {
    setMessagesByChat((prev) => {
      if (prev[chatId] && prev[chatId].length > 0) {
        return prev
      }

      const chat = chats.find((c) => c.id === chatId)
      if (!chat) return prev

      const now = new Date()
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const baseMessages: Message[] = [
        {
          id: messageIdRef.current++,
          side: 'in',
          time,
          text: `This is the start of your chat with ${chat.name}.`,
        },
      ]

      return {
        ...prev,
        [chatId]: baseMessages,
      }
    })
  }

  const appendMessagesToActiveChat = (newMessages: Message[]) => {
    setMessagesByChat((prev) => {
      const existing = prev[activeChatId] ?? []
      return {
        ...prev,
        [activeChatId]: [...existing, ...newMessages],
      }
    })
  }

  const updateActiveChatPreview = (preview: string, time: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              lastMessage: preview,
              time,
            }
          : chat,
      ),
    )
  }

  const handleSend = () => {
    if (!input.trim()) return

    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newMessage: Message = {
      id: messageIdRef.current++,
      text: input.trim(),
      time,
      side: 'out',
    }

    appendMessagesToActiveChat([newMessage])
    updateActiveChatPreview(newMessage.text ?? '', time)
    setInput('')
    setShowEmojiPicker(false)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiClick = (emoji: string) => {
    if (!emoji) return

    setInput((prev) => {
      const next = (prev ?? '') + emoji

      
      queueMicrotask(() => {
        if (inputRef.current) {
          const el = inputRef.current
          el.focus()
          const length = next.length
          try {
            el.setSelectionRange(length, length)
          } catch {
            
          }
        }
      })

      return next
    })
  }

  const startRecording = async () => {
    if (isRecording) return

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      recordedChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        recordedChunksRef.current = []

        if (blob.size === 0) {
          return
        }

        
        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl)
        }

        const url = URL.createObjectURL(blob)
        setAudioPreviewUrl(url)

       
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      
      console.error('Error starting recording', error)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return

    try {
      mediaRecorderRef.current.stop()
    } catch (error) {
      console.error('Error stopping recording', error)
    } finally {
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl)
        setAudioPreviewUrl(null)
      }
      startRecording()
    }
  }

  const sendVoiceMessage = () => {
    if (!audioPreviewUrl) return

    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newMessage: Message = {
      id: messageIdRef.current++,
      time,
      side: 'out',
      audioUrl: audioPreviewUrl,
    }

    appendMessagesToActiveChat([newMessage])
    updateActiveChatPreview('Voice message', time)
    setAudioPreviewUrl(null)
  }

  const discardVoiceMessage = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl)
    }
    setAudioPreviewUrl(null)
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }))

    setPendingAttachments((prev) => [...prev, ...newAttachments])

    
    event.target.value = ''
  }

  const sendAttachments = () => {
    if (pendingAttachments.length === 0) return

    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newMessages: Message[] = pendingAttachments.map((attachment) => ({
      id: messageIdRef.current++,
      time,
      side: 'out',
      attachment,
    }))

    appendMessagesToActiveChat(newMessages)
    const previewText =
      pendingAttachments.length === 1
        ? pendingAttachments[0].name
        : `${pendingAttachments.length} files`
    updateActiveChatPreview(previewText, time)
    setPendingAttachments([])
  }

  const clearAttachments = () => {
    pendingAttachments.forEach((att) => {
      URL.revokeObjectURL(att.url)
    })
    setPendingAttachments([])
  }

  return (
    //adding styles to the website- overall component,sidebar, sidebar header--
  <div className="h-screen w-screen bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
  
  <div className="h-[92vh] w-[95vw] max-w-[1400px] bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex">
    
    <aside className="w-80 min-w-[320px] max-w-[320px] flex-none bg-white border-r border-blue-100 flex flex-col">

        <div className="h-16 px-4 flex items-center justify-between bg-white border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
              JP
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">JustPing</span>
              <span className="text-xs text-blue-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          
        </div>

        
        <div className="p-3 border-b border-blue-100 bg-white">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-xs">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-blue-50 text-sm placeholder:text-blue-300 border border-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              placeholder="Search a chat"
            />
          </div>
        </div>

        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          {filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId
            const thread = messagesByChat[chat.id] ?? []
            const last = thread[thread.length - 1]

            let previewText = chat.lastMessage
            let previewTime = chat.time

            if (last) {
              if (last.attachment) {
                previewText = last.attachment.type.startsWith('image/')
                  ? 'Photo'
                  : last.attachment.name
              } else if (last.audioUrl) {
                previewText = 'Voice message'
              } else if (last.text) {
                previewText = last.text
              }
              previewTime = last.time
            }


            return (
  <button
    key={chat.id}
    className={`w-full px-4 py-3 flex gap-3 items-center text-left transition-all duration-200 border-l-4 ${
      isActive
        ? 'bg-blue-50 border-blue-500 shadow-sm'
        : 'border-transparent hover:bg-blue-50'
    }`}
    onClick={() => {
      setActiveChatId(chat.id)
      ensureChatHasInitialMessages(chat.id)
    }}
  >
    <div className="relative">
      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-semibold text-white shadow-md">
        {chat.name
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>
      <span
        className={`absolute -bottom-1 left-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
          chat.isOnline ? 'bg-green-400' : 'bg-slate-400'
        }`}
        aria-hidden="true"
      />
      {chat.isPinned && (
        <span className="absolute -bottom-1 -right-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full shadow-sm">
          📌
        </span>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-slate-700 truncate">
          {chat.name}
        </span>
        <span className="text-[11px] text-blue-400">
          {previewTime}
        </span>
      </div>
      <div className="flex justify-between items-end gap-2">
        <span className="text-xs text-slate-500 truncate">
          {thread.length > 0 ? previewText : 'No messages yet'}
        </span>
        {chat.isMuted && (
          <div className="flex items-center gap-1 text-blue-400">
            <span className="text-xs">🔕</span>
          </div>
        )}
      </div>
    </div>
  </button>
)
})}

{filteredChats.length === 0 && (
  <div className="px-4 py-6 text-center text-xs text-blue-400">
    No chats found.
  </div>
)}
</div>
</aside>


<main className="flex-1 flex flex-col bg-blue-50">

  
  <div className="h-16 px-5 flex items-center justify-between bg-white border-b border-blue-100">
    <div className="flex items-center gap-3">
      <div className="relative h-9 w-9">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-semibold text-white shadow-md">
          {activeChat.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <span
          className={`absolute -bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
            activeChat.isOnline ? 'bg-green-400' : 'bg-slate-400'
          }`}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700">
          {activeChat.name}
        </span>
        <span className="text-[11px] text-blue-500">
          {activeChat.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>

    
  </div>

  
  <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 to-sky-100 px-6 py-4 space-y-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">

    
    <div className="flex justify-center my-2">
      <div className="px-4 py-1 rounded-full bg-white shadow-sm text-[11px] text-blue-500 border border-blue-100">
        TODAY
      </div>
    </div>

    {activeMessages.map((message) => (
      <div
        key={message.id}
        className={`flex w-full ${
          message.side === 'out' ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`relative max-w-[70%] px-4 py-2.5 text-sm leading-snug shadow-sm break-words ${
            message.side === 'out'
              ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md shadow-md'
              : 'bg-white text-slate-700 rounded-2xl rounded-tl-md border border-blue-100'
          }`}
        >
          {message.audioUrl ? (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide opacity-80">
                Voice message
              </span>
              <audio
                controls
                src={message.audioUrl}
                className="w-48 max-w-full"
              />
            </div>
          ) : message.attachment ? (
            <div className="flex flex-col gap-1">
              {message.attachment.type.startsWith('image/') ? (
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name}
                  style={{ maxWidth: '240px', maxHeight: '160px', display: 'block' }}
                  className="rounded-xl object-cover border border-blue-100"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                    📎
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium break-all">
                      {message.attachment.name}
                    </span>
                    <span className="text-[11px] text-blue-400">
                      {formatFileSize(message.attachment.size)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span>{message.text}</span>
          )}

          <div className="mt-1 text-[10px] flex justify-end gap-1 items-center opacity-70">
            <span>{message.time}</span>
            {message.side === 'out' && <span>✓✓</span>}
          </div>
        </div>
      </div>
    ))}

    <div ref={messagesEndRef} />
  </div>

         
<div className="px-4 pb-4 pt-3 bg-white border-t border-blue-100">

  
  {showEmojiPicker && (
    <div className="mb-3 mx-auto w-full max-w-md max-h-72 rounded-2xl bg-white border border-blue-100 shadow-xl p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[11px] uppercase tracking-wide text-blue-400 font-medium">
          Emoji picker
        </span>
        <button
          onClick={() => setShowEmojiPicker(false)}
          className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-8 gap-1.5 text-lg">
        {emojiList.map((emoji, idx) => (
          <button
            type="button"
            key={`${emoji}-${idx}`}
            className="h-8 w-8 hover:bg-blue-50 rounded-lg flex items-center justify-center transition"
            onClick={() => handleEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )}

  
  {pendingAttachments.length > 0 && (
    <div className="mb-3 mx-auto w-full max-w-md rounded-2xl bg-white border border-blue-100 shadow-lg px-4 py-3 flex flex-col gap-3">
      
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-blue-400 font-medium">
          {pendingAttachments.length === 1
            ? '1 file ready to send'
            : `${pendingAttachments.length} files ready to send`}
        </span>

        <button
          type="button"
          onClick={clearAttachments}
          className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
        {pendingAttachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2"
          >
            {att.type.startsWith('image/') ? (
              <img
                src={att.url}
                alt={att.name}
                style={{ width: '48px', height: '48px', display: 'block' }}
                className="rounded-lg object-cover border border-blue-100"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                📄
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-medium truncate text-slate-700">
                  {att.name}
                </span>
                <span className="text-[11px] text-blue-400 shrink-0">
                  {formatFileSize(att.size)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {att.type || 'Unknown type'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={sendAttachments}
          className="px-4 py-1.5 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all shadow-md"
        >
          Send file{pendingAttachments.length > 1 ? 's' : ''}
        </button>
      </div>

    </div>
  )}


          
{audioPreviewUrl && (
  <div className="mb-3 mx-auto w-full max-w-md rounded-2xl bg-white border border-blue-100 shadow-lg px-4 py-3 flex flex-col gap-3">
    
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wide text-blue-400 font-medium">
        Voice message preview
      </span>
      <span className="text-xs text-blue-400">
        {isRecording ? 'Recording…' : 'Ready to send'}
      </span>
    </div>

    <audio
      controls
      src={audioPreviewUrl}
      className="w-full accent-blue-500"
    />

    <div className="flex justify-end gap-2 text-xs">
      <button
        type="button"
        onClick={discardVoiceMessage}
        className="px-4 py-1.5 rounded-full border border-blue-200 text-blue-500 hover:bg-blue-50 transition"
      >
        Discard
      </button>

      <button
        type="button"
        onClick={sendVoiceMessage}
        className="px-4 py-1.5 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition shadow-md"
      >
        Send voice
      </button>
    </div>

  </div>
)}

<div className="flex items-end gap-3">

  <button
    type="button"
    onClick={() => setShowEmojiPicker((v) => !v)}
    className="h-10 w-10 flex items-center justify-center rounded-full text-xl text-blue-500 hover:bg-blue-50 transition"
    aria-label="Emoji picker"
  >
    😊
  </button>

  <button
    type="button"
    onClick={handleAttachClick}
    className="h-10 w-10 flex items-center justify-center rounded-full text-xl text-blue-500 hover:bg-blue-50 transition"
    aria-label="Attach"
  >
    📎
  </button>

  <input
    ref={fileInputRef}
    type="file"
    className="hidden"
    multiple
    onChange={handleFilesSelected}
    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
  />

  <div className="flex-1">
    <textarea
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      rows={1}
      className="w-full max-h-28 rounded-2xl bg-white border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm px-4 py-3 resize-none placeholder:text-blue-300 focus:outline-none transition shadow-sm"
      placeholder="Type a message"
    />
  </div>

  <button
    type="button"
    onClick={toggleRecording}
    className={`h-10 w-10 flex items-center justify-center rounded-full text-xl transition ${
      isRecording
        ? 'text-white bg-red-500 hover:bg-red-600'
        : 'text-blue-500 hover:bg-blue-50'
    }`}
    aria-label="Record voice"
  >
    {isRecording ? '■' : '🎙️'}
  </button>

  <button
    type="button"
    onClick={handleSend}
    className="h-10 w-10 flex items-center justify-center rounded-full text-xl text-white bg-blue-500 hover:bg-blue-600 transition shadow-lg"
    aria-label="Send message"
  >
    ➤
  </button>

</div>

          </div>
        </main>
      </div>
    </div>
  )
}

