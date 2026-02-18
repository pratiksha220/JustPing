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
  unread?: number
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
    unread: 3,
    isPinned: true,
    isOnline: true,
  },
  {
    id: 2,
    name: 'Neha Verma',
    lastMessage: 'Send me the final presentation please 🙏',
    time: '08:52',
    unread: 1,
    isOnline: true,
  },
  {
    id: 3,
    name: 'Product Team',
    lastMessage: 'Let’s lock the scope before Friday.',
    time: 'Yesterday',
    unread: 5,
    isMuted: true,
  },
  {
    id: 4,
    name: 'Weekend Football',
    lastMessage: 'Match at 7 AM, don’t be late ⚽',
    time: 'Yesterday',
    isMuted: true,
  },
  {
    id: 5,
    name: 'Family Group',
    lastMessage: 'Dinner at Nana’s place on Sunday ❤️',
    time: 'Sun',
    unread: 9,
  },
  {
    id: 6,
    name: 'Freelance Client',
    lastMessage: 'Invoice received, processing the payment.',
    time: 'Sat',
  },
]

const sampleMessages: Message[] = [
  {
    id: 1,
    text: 'Hey! This is your new WhatsApp-style chat UI 👋',
    time: '18:11',
    side: 'in',
  },
  {
    id: 2,
    text: 'Feel free to type and send messages below.',
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

      // Focus + move caret to the end on the next tick
      queueMicrotask(() => {
        if (inputRef.current) {
          const el = inputRef.current
          el.focus()
          const length = next.length
          try {
            el.setSelectionRange(length, length)
          } catch {
            // ignore selection errors in older browsers
          }
        }
      })

      return next
    })
  }

  const startRecording = async () => {
    if (isRecording) return

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Basic fallback: just do nothing if unsupported
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

        // Cleanup old preview URL if any
        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl)
        }

        const url = URL.createObjectURL(blob)
        setAudioPreviewUrl(url)

        // Stop all tracks on the stream
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      // If user blocks mic permissions or any error occurs, just ensure state is reset
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
      // When starting a new recording, clear any previous preview
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

    // Allow selecting the same file again later
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
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-stretch justify-center">
      <div className="h-full w-full max-w-7xl bg-wa-chat/90 backdrop-blur-xl md:my-6 md:rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.65)] border border-slate-800/80 flex">
        {/* Sidebar */}
        <aside className="w-80 bg-wa-sidebar/95 border-r border-slate-800 flex flex-col">
          {/* Sidebar header */}
          <div className="h-16 px-4 flex items-center justify-between bg-wa-input/95 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-semibold">
                JP
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">JustPing</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <div className="flex gap-3 text-slate-400 text-xl">
              <button className="hover:text-slate-200 transition-colors" aria-label="Status">
                ●
              </button>
              <button className="hover:text-slate-200 transition-colors" aria-label="New chat">
                ＋
              </button>
              <button className="hover:text-slate-200 transition-colors" aria-label="Menu">
                ⋮
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-800 bg-wa-sidebar">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-wa-input text-xs placeholder:text-slate-500 border border-transparent focus:border-wa-accent focus:outline-none"
                placeholder="Search or start a new chat"
              />
            </div>
          </div>

          {/* Chats list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
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
                  className={`w-full px-4 py-3 flex gap-3 items-center hover:bg-slate-800/60 transition-colors text-left border-l-2 ${
                    isActive ? 'bg-slate-800/80 border-wa-accent' : 'border-transparent'
                  }`}
                  onClick={() => {
                    setActiveChatId(chat.id)
                    ensureChatHasInitialMessages(chat.id)
                  }}
                >
                <div className="relative">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-sm font-semibold shadow-md">
                    {chat.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-1 left-1 h-2.5 w-2.5 rounded-full border border-wa-sidebar ${
                      chat.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  {chat.isPinned && (
                    <span className="absolute -bottom-1 -right-1 text-[10px] bg-wa-chat px-1 rounded-full">
                      📌
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold truncate">{chat.name}</span>
                    <span className="text-[11px] text-slate-400">{previewTime}</span>
                  </div>
                  <div className="flex justify-between items-end gap-2">
                    <span className="text-xs text-slate-400 truncate">
                      {thread.length > 0 ? previewText : 'No messages yet'}
                    </span>
                    {chat.isMuted && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">🔕</span>
                      </div>
                    )}
                  </div>
                </div>
                </button>
              )
            })}

            {filteredChats.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No chats found.
              </div>
            )}
          </div>
        </aside>

        {/* Main chat */}
        <main className="flex-1 flex flex-col bg-wa-chat/95">
          {/* Chat header */}
          <div className="h-16 px-5 flex items-center justify-between bg-wa-input/95 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-semibold shadow-md">
                {activeChat.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border border-wa-input ${
                    activeChat.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{activeChat.name}</span>
                <span className="text-[11px] text-slate-400">
                  {activeChat.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-300 text-lg">
              <button className="hover:text-slate-100 transition-colors" aria-label="Search">
                🔍
              </button>
              <button className="hover:text-slate-100 transition-colors" aria-label="More">
                ⋮
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-wa-chat to-wa-bg px-6 py-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
            {/* Date pill */}
            <div className="flex justify-center my-2">
              <div className="px-3 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-200">
                TODAY
              </div>
            </div>

            {activeMessages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.side === 'out' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[70%] rounded-lg px-3 py-2 text-sm leading-snug shadow-sm break-words ${
                    message.side === 'out'
                      ? 'bg-wa-message-out text-slate-50 rounded-tr-none'
                      : 'bg-wa-message-in text-slate-100 rounded-tl-none'
                  }`}
                >
                  {message.audioUrl ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wide text-slate-200/80">
                        Voice message
                      </span>
                      <audio
                        controls
                        src={message.audioUrl}
                        className="w-48 max-w-full accent-wa-accent"
                      />
                    </div>
                  ) : message.attachment ? (
                    <div className="flex flex-col gap-1">
                      {message.attachment.type.startsWith('image/') ? (
                        <img
                          src={message.attachment.url}
                          alt={message.attachment.name}
                          style={{ maxWidth: '240px', maxHeight: '160px', display: 'block' }}
                          className="rounded-lg object-cover border border-slate-700/70 bg-black/30"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-900/70 flex items-center justify-center text-lg">
                            📎
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium break-all">
                              {message.attachment.name}
                            </span>
                            <span className="text-[11px] text-slate-300/80">
                              {formatFileSize(message.attachment.size)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>{message.text}</span>
                  )}
                  <div className="mt-1 text-[10px] text-slate-300/80 flex justify-end gap-1 items-center">
                    <span>{message.time}</span>
                    {message.side === 'out' && <span>✓✓</span>}
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 pt-3 bg-wa-input/95 border-t border-slate-800">
            {/* Emoji picker panel */}
            {showEmojiPicker && (
              <div className="mb-3 mx-auto w-full max-w-md max-h-72 rounded-2xl bg-wa-chat border border-slate-800/80 shadow-2xl p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    Emoji picker
                  </span>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-xs text-slate-400 hover:text-slate-100"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1.5 text-lg">
                  {emojiList.map((emoji, idx) => (
                    <button
                      type="button"
                      key={`${emoji}-${idx}`}
                      className="h-8 w-8 hover:bg-slate-700/70 rounded-md flex items-center justify-center"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* File attachments preview panel */}
            {pendingAttachments.length > 0 && (
              <div className="mb-3 mx-auto w-full max-w-md rounded-2xl bg-wa-chat border border-slate-800/80 shadow-xl px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    {pendingAttachments.length === 1
                      ? '1 file ready to send'
                      : `${pendingAttachments.length} files ready to send`}
                  </span>
                  <button
                    type="button"
                    onClick={clearAttachments}
                    className="text-xs text-slate-400 hover:text-slate-100"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
                  {pendingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-xl bg-wa-chat/80 border border-slate-800/80 px-3 py-2"
                    >
                      {att.type.startsWith('image/') ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          style={{ width: '48px', height: '48px', display: 'block' }}
                          className="rounded-lg object-cover border border-slate-700/70 bg-black/30"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-900/70 flex items-center justify-center text-lg">
                          📄
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-medium truncate">
                            {att.name}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {formatFileSize(att.size)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
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
                    className="px-3 py-1.5 rounded-full bg-wa-accent text-wa-chat font-medium hover:bg-wa-accent-light transition-colors"
                  >
                    Send file{pendingAttachments.length > 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}

            {/* Voice preview panel */}
            {audioPreviewUrl && (
              <div className="mb-3 mx-auto w-full max-w-md rounded-2xl bg-wa-chat border border-slate-800/80 shadow-xl px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    Voice message preview
                  </span>
                  <span className="text-xs text-slate-400">
                    {isRecording ? 'Recording…' : 'Ready to send'}
                  </span>
                </div>
                <audio
                  controls
                  src={audioPreviewUrl}
                  className="w-full accent-wa-accent"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={discardVoiceMessage}
                    className="px-3 py-1.5 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800/80 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={sendVoiceMessage}
                    className="px-3 py-1.5 rounded-full bg-wa-accent text-wa-chat font-medium hover:bg-wa-accent-light transition-colors"
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
                className="h-10 w-10 flex items-center justify-center rounded-full text-xl text-slate-300 hover:bg-slate-700/80 transition-colors"
                aria-label="Emoji picker"
              >
                😊
              </button>

              <button
                type="button"
                onClick={handleAttachClick}
                className="h-10 w-10 flex items-center justify-center rounded-full text-xl text-slate-300 hover:bg-slate-700/80 transition-colors"
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
                  className="w-full max-h-28 rounded-2xl bg-wa-chat/90 border border-slate-800/80 focus:border-wa-accent text-sm px-3 py-2.5 resize-none placeholder:text-slate-500 focus:outline-none shadow-inner"
                  placeholder="Type a message"
                />
              </div>

              <button
                type="button"
                onClick={toggleRecording}
                className={`h-10 w-10 flex items-center justify-center rounded-full text-xl ${
                  isRecording
                    ? 'text-red-300 bg-red-900/60 hover:bg-red-800/80'
                    : 'text-slate-300 hover:bg-slate-700/80'
                } transition-colors`}
                aria-label="Record voice"
              >
                {isRecording ? '■' : '🎙️'}
              </button>

              <button
                type="button"
                onClick={handleSend}
                className="h-10 w-10 flex items-center justify-center rounded-full text-xl text-wa-chat bg-wa-accent hover:bg-wa-accent-light transition-colors shadow-lg shadow-emerald-500/30"
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

