import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useChat } from '../hooks/useChat'
import { deleteChat, getChats, getMessages, sendMessage } from '../service/chat.api'
import { useAuth } from '../../auth/hook/useAuth'
import '../../../Styles/chat.css'

/* ═══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER  (zero extra deps)
═══════════════════════════════════════════════════════════════ */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(raw) {
  if (!raw) return ''

  // 1. Protect fenced code blocks — extract and replace with placeholders
  const codeBlocks = []
  let text = raw.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length
    const langLabel = lang || 'text'
    codeBlocks.push(
      `<div class="code-block">` +
        `<div class="code-block-header">` +
          `<span class="code-block-lang">${escHtml(langLabel)}</span>` +
          `<button class="code-block-copy" data-code="${escHtml(btoa(unescape(encodeURIComponent(code.trim()))))}" type="button">Copy</button>` +
        `</div>` +
        `<pre><code class="language-${escHtml(langLabel)}">${escHtml(code.trim())}</code></pre>` +
      `</div>`
    )
    return `\x00CODE${idx}\x00`
  })

  // 2. Inline transformations
  text = text
    .replace(/`([^`\n]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`)
    .replace(/^#{4} (.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // 3. Lists — collect consecutive list items into ul/ol
  text = text
    .replace(/((?:^[ \t]*[-*] .+\n?)+)/gm, match => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[ \t]*[-*] /, '')}</li>`).join('')
      return `<ul>${items}</ul>`
    })
    .replace(/((?:^\d+\. .+\n?)+)/gm, match => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')
      return `<ol>${items}</ol>`
    })

  // 4. Paragraphs — wrap blocks separated by blank lines
  const isBlock = /^<(h[1-6]|ul|ol|blockquote|hr|div|pre)/
  const paras = text.split(/\n{2,}/).map(chunk => {
    chunk = chunk.trim()
    if (!chunk) return ''
    if (isBlock.test(chunk) || chunk.startsWith('\x00CODE')) return chunk
    return `<p>${chunk.replace(/\n/g, '<br>')}</p>`
  })
  text = paras.join('\n')

  // 5. Restore code blocks
  codeBlocks.forEach((block, i) => { text = text.replace(`\x00CODE${i}\x00`, block) })

  return text
}

/* ═══════════════════════════════════════════════════════════════
   COPY BUTTON  (generic)
═══════════════════════════════════════════════════════════════ */
function CopyButton({ text, size = 'sm' }) {
  const [state, setState] = useState('idle') // idle | copied | error

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const label = state === 'copied' ? '✓ Copied' : state === 'error' ? 'Failed' : 'Copy'
  const color = state === 'copied'
    ? 'var(--color-success)'
    : state === 'error'
    ? 'var(--color-error)'
    : 'var(--color-text-muted)'

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1 rounded-md transition-all select-none ${size === 'xs' ? 'px-1.5 py-0.5 text-[0.67rem]' : 'px-2 py-1 text-xs'}`}
      style={{
        background: state !== 'idle' ? 'var(--color-surface-4)' : 'var(--color-surface-3)',
        color,
        border: '1px solid var(--color-border-subtle)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.02em',
      }}>
      {state === 'idle' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        </svg>
      )}
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CODE BLOCK COPY (wired to data-code attr rendered by markdown)
   — handled via event delegation on the prose container
═══════════════════════════════════════════════════════════════ */
function ProseRenderer({ html }) {
  const ref = useRef(null)

  // Wire copy buttons rendered inside dangerouslySetInnerHTML
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = async (e) => {
      const btn = e.target.closest('.code-block-copy')
      if (!btn) return
      const encoded = btn.getAttribute('data-code')
      if (!encoded) return
      try {
        const code = decodeURIComponent(escape(atob(encoded)))
        await navigator.clipboard.writeText(code)
        btn.textContent = '✓ Copied'
        btn.classList.add('copied')
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied') }, 2000)
      } catch {
        btn.textContent = 'Failed'
        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [html])

  return (
    <div
      ref={ref}
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
═══════════════════════════════════════════════════════════════ */
function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-fade-up">
        <div
          className="max-w-[78%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}>
          {message.content}
        </div>
      </div>
    )
  }

  // AI response
  const rendered = renderMarkdown(message.content)
  return (
    <article className="mb-8 animate-fade-up">
      {/* AI header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[0.8rem] font-bold select-none flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
              color: '#fff',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}>
            p
          </div>
          <span
            className="text-[0.72rem] font-semibold tracking-wide uppercase"
            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            Perplexity
          </span>
        </div>
        <CopyButton text={message.content} size="xs" />
      </div>

      {/* Content */}
      <ProseRenderer html={rendered} />
    </article>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TYPING INDICATOR
═══════════════════════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <div className="mb-6 animate-fade-up">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[0.8rem] font-bold select-none flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
            color: '#fff',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}>
          p
        </div>
        <span
          className="text-[0.72rem] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          Perplexity
        </span>
      </div>
      <div className="flex items-center gap-1.5 pl-8">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full"
            style={{
              background: 'var(--color-accent)',
              animation: 'typing-bounce 1.1s infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR CHAT ITEM
═══════════════════════════════════════════════════════════════ */
function SidebarChatItem({ chatItem, isActive, onOpen, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(chatItem._id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(chatItem._id) }}
      className="group relative flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-[0.8rem] cursor-pointer transition-all duration-150 select-none"
      style={{
        background: isActive ? 'var(--color-surface-3)' : 'transparent',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>

      {/* Icon */}
      <svg className="flex-shrink-0 w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>

      {/* Title */}
      <span className="flex-1 truncate leading-snug">{chatItem.title || 'Untitled chat'}</span>

      {/* Delete button — appears on hover */}
      <button
        type="button"
        aria-label={`Delete ${chatItem.title || 'this chat'}`}
        onClick={e => onDelete(e, chatItem._id)}
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(248,113,113,0.12)'
          e.currentTarget.style.color = 'var(--color-error)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-muted)'
        }}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON CHATS
═══════════════════════════════════════════════════════════════ */
function SkeletonChats() {
  return (
    <div className="space-y-1.5 px-1 mt-1">
      {[70, 55, 80].map((w, i) => (
        <div key={i} className="h-8 rounded-lg skeleton" style={{ opacity: 0.45 - i * 0.08, width: `${w}%` }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUGGESTION PROMPTS
═══════════════════════════════════════════════════════════════ */
const SUGGESTIONS = [
  { prompt: 'Explain quantum computing in simple terms', icon: '⚛️', label: 'Explain a concept' },
  { prompt: 'Help me outline a new project from scratch',  icon: '📐', label: 'Plan a project'    },
  { prompt: 'Summarize this text and improve its clarity', icon: '✍️', label: 'Edit & summarize'  },
  { prompt: 'Write a Python function to sort a list',      icon: '💻', label: 'Write code'        },
]

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICONS
═══════════════════════════════════════════════════════════════ */
const IconPlus = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)
const IconHome = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)
const IconChevronUD = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
  </svg>
)
const IconLogout = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
)
const IconMenu = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)
const IconX = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)
const IconSend = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
)
const IconSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)
const IconWarn = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
)

/* ═══════════════════════════════════════════════════════════════
   LOGO MARK
═══════════════════════════════════════════════════════════════ */
function LogoMark({ size = 'md' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-xl' : size === 'sm' ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-base'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold italic flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
        color: '#fff',
        fontFamily: 'Georgia, serif',
        boxShadow: '0 0 0 1px rgba(107,169,208,0.25)',
      }}>
      p
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const chat = useChat()
  const auth = useAuth()
  const { user } = useSelector(state => state.auth)

  // ── State ───────────────────────────────────────────
  const [prompt, setPrompt]                   = useState('')
  const [messages, setMessages]               = useState([])
  const [chatId, setChatId]                   = useState(null)
  const [recentChats, setRecentChats]         = useState([])
  const [chatsLoading, setChatsLoading]       = useState(true)
  const [isSending, setIsSending]             = useState(false)
  const [error, setError]                     = useState('')
  const [isAccountOpen, setIsAccountOpen]     = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [composerFocused, setComposerFocused] = useState(false)

  // ── Refs ────────────────────────────────────────────
  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)
  const accountMenuRef = useRef(null)

  const firstName = user?.userName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'
  const hasMessages = messages.length > 0

  // ── Effects ─────────────────────────────────────────

  // Socket connection
  useEffect(() => {
    const socket = chat.initializationsocketconnection()
    return () => socket?.disconnect()
  }, [chat])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Load sidebar chat history
  useEffect(() => {
    const load = async () => {
      setChatsLoading(true)
      try {
        const data = await getChats()
        setRecentChats(data.chats || [])
      } catch { /* silent — auth may still be settling */ }
      finally { setChatsLoading(false) }
    }
    load()
  }, [])

  // Close account menu on outside click
  useEffect(() => {
    const handler = e => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Handlers ────────────────────────────────────────

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  const submitPrompt = async (event) => {
    event?.preventDefault()
    const message = prompt.trim()
    if (!message || isSending) return

    setPrompt('')
    setError('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMessages(cur => [...cur, { role: 'user', content: message }])
    setIsSending(true)
    setIsMobileNavOpen(false)

    try {
      const data = await sendMessage({ message, chatId })
      setChatId(data.chat?._id || chatId)
      if (data.chat?._id) {
        setRecentChats(cur => [data.chat, ...cur.filter(c => c._id !== data.chat._id)])
      }
      setMessages(cur => [...cur, {
        role: 'ai',
        content: data.response || 'I could not generate a response just yet.',
      }])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reach the assistant. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const startNewChat = () => {
    setChatId(null)
    setMessages([])
    setPrompt('')
    setError('')
    setIsMobileNavOpen(false)
  }

  const openChat = async (selectedId) => {
    if (selectedId === chatId) { setIsMobileNavOpen(false); return }
    try {
      const data = await getMessages(selectedId)
      setChatId(selectedId)
      setMessages((data.messages || []).map(m => ({ role: m.role, content: m.content })))
      setError('')
    } catch {
      setError('Unable to load this conversation.')
    }
    setIsMobileNavOpen(false)
  }

  const removeChat = async (event, selectedId) => {
    event.stopPropagation()
    try {
      await deleteChat(selectedId)
      setRecentChats(cur => cur.filter(c => c._id !== selectedId))
      if (selectedId === chatId) startNewChat()
    } catch {
      setError('Unable to delete this conversation.')
    }
  }

  // ─────────────────────────────────────────────────────
  //  SIDEBAR INNER CONTENT  (shared between desktop + mobile)
  // ─────────────────────────────────────────────────────
  const renderSidebarInner = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-5">
        <LogoMark size="sm" />
        <span className="text-[0.9rem] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Perplexity
        </span>
      </div>

      {/* New Thread button */}
      <button
        type="button"
        onClick={startNewChat}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium mb-4 transition-all duration-200 hover:bg-[var(--color-surface-4)]"
        style={{
          background: 'var(--color-surface-3)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--color-surface-4)'
          e.currentTarget.style.borderColor = 'var(--color-border-focus)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--color-surface-3)'
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}>
        <IconPlus />
        New chat
      </button>

      {/* Nav links */}
      <nav className="mb-4">
        <button
          type="button"
          onClick={startNewChat}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[0.82rem] transition-all duration-150"
          style={{
            background: !hasMessages ? 'var(--color-surface-3)' : 'transparent',
            color: !hasMessages ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}
          onMouseEnter={e => { if (hasMessages) e.currentTarget.style.background = 'var(--color-surface-2)' }}
          onMouseLeave={e => { if (hasMessages) e.currentTarget.style.background = 'transparent' }}>
          <IconHome />
          Home
        </button>
      </nav>

      {/* Divider */}
      <div className="mx-2 mb-3" style={{ height: '1px', background: 'var(--color-border-subtle)' }} />

      {/* Recent chats label */}
      {(chatsLoading || recentChats.length > 0) && (
        <p
          className="px-2.5 mb-2 uppercase"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.63rem',
            letterSpacing: '0.1em',
          }}>
          Recent
        </p>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1 space-y-0.5">
        {chatsLoading ? (
          <SkeletonChats />
        ) : recentChats.length === 0 ? (
          <div className="px-2.5 py-8 text-center">
            <p className="text-[0.78rem]" style={{ color: 'var(--color-text-muted)' }}>No conversations yet</p>
            <p className="text-[0.72rem] mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.55 }}>
              Start a new thread above
            </p>
          </div>
        ) : (
          recentChats.map(c => (
            <SidebarChatItem
              key={c._id}
              chatItem={c}
              isActive={c._id === chatId}
              onOpen={openChat}
              onDelete={removeChat}
            />
          ))
        )}
      </div>

      {/* Account section */}
      <div className="mt-4 pt-3 mx-0" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setIsAccountOpen(o => !o)}
            aria-expanded={isAccountOpen}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg transition-all duration-150 text-left"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[0.7rem] font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
                color: '#fff',
              }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.8rem] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {user?.userName || user?.name || 'Your account'}
              </p>
              <p className="text-[0.7rem]" style={{ color: 'var(--color-text-muted)' }}>Personal plan</p>
            </div>
            <span style={{ color: 'var(--color-text-muted)' }}><IconChevronUD /></span>
          </button>

          {/* Account dropdown */}
          {isAccountOpen && (
            <div
              className="absolute bottom-[calc(100%+6px)] left-0 w-full rounded-xl overflow-hidden z-50 animate-fade-up"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
              }}>
              <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <p className="text-[0.78rem] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.userName || 'Account'}
                </p>
                <p className="text-[0.7rem] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {user?.email || 'Personal plan'}
                </p>
              </div>
              <button
                type="button"
                onClick={auth.handleLogout}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[0.8rem] transition-all duration-150 text-left"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)'; e.currentTarget.style.color = 'var(--color-error)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}>
                <IconLogout />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────
  //  COMPOSER
  // ─────────────────────────────────────────────────────
  const renderComposer = () => (
    <div className="w-full px-4 pb-4 pt-3" style={{ background: 'var(--color-surface-0)' }}>
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-[0.8rem] rounded-lg px-3.5 py-2.5 mb-3 max-w-3xl mx-auto"
          style={{
            background: 'rgba(248,113,113,0.07)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: 'var(--color-error)',
          }}>
          <IconWarn />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-1 flex-shrink-0 text-[0.75rem] transition-opacity hover:opacity-60"
            aria-label="Dismiss error">✕</button>
        </div>
      )}

      {/* Composer box */}
      <form
        onSubmit={submitPrompt}
        className={`max-w-3xl mx-auto rounded-2xl transition-all duration-200 ${composerFocused ? 'composer-focused' : ''}`}
        style={{
          background: 'var(--color-surface-2)',
          border: `1px solid ${composerFocused ? 'var(--color-accent)' : 'var(--color-border)'}`,
          boxShadow: composerFocused
            ? '0 0 0 3px var(--color-accent-glow), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.25)',
        }}>

        <textarea
          ref={textareaRef}
          aria-label="Ask a question"
          value={prompt}
          rows={1}
          placeholder="Ask anything…"
          disabled={isSending}
          onChange={e => { setPrompt(e.target.value); resizeTextarea() }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPrompt(e) }
          }}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          className="block w-full px-4 pt-4 pb-1.5 resize-none outline-none text-[0.9rem] leading-relaxed placeholder:text-[var(--color-text-placeholder)]"
          style={{
            background: 'transparent',
            color: 'var(--color-text-primary)',
            minHeight: '52px',
            maxHeight: '200px',
          }}
        />

        {/* Footer row */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2">
          <span
            className="text-[0.65rem] select-none text-[var(--color-text-muted)] font-mono">
            {isSending ? 'Generating…' : 'Enter ↵ to send · Shift+Enter for new line'}
          </span>

          <button
            type="submit"
            aria-label="Send message"
            disabled={!prompt.trim() || isSending}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:brightness-110 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{
              background: prompt.trim() && !isSending
                ? 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))'
                : 'var(--color-surface-3)',
              color: '#fff',
              boxShadow: prompt.trim() && !isSending ? '0 2px 12px var(--color-accent-glow)' : 'none',
            }}>
            {isSending ? <IconSpinner /> : <IconSend />}
          </button>
        </div>
      </form>

      <p
        className="text-center mt-2 select-none"
        style={{ color: 'var(--color-text-muted)', opacity: 0.4, fontSize: '0.6rem', letterSpacing: '0.02em' }}>
        Perplexity can make mistakes. Verify important information.
      </p>
    </div>
  )

  // ─────────────────────────────────────────────────────
  //  WELCOME SCREEN
  // ─────────────────────────────────────────────────────
  const renderWelcomeScreen = () => (
    <div className="flex flex-col h-full">
      {/* Hero content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl text-center">
          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <LogoMark size="lg" />
          </div>

          {/* Eyebrow */}
          <p
            className="text-[0.68rem] font-medium uppercase mb-3 tracking-[0.12em]"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
            Personal AI assistant
          </p>

          {/* Headline */}
          <h1
            className="font-semibold mb-3 leading-tight"
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              letterSpacing: '-0.035em',
              color: 'var(--color-text-primary)',
            }}>
            What are you curious about,{' '}
            <span style={{ color: 'var(--color-accent)' }}>{firstName}?</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-[0.875rem] leading-relaxed mb-10 max-w-lg mx-auto"
            style={{ color: 'var(--color-text-muted)' }}>
            Ask anything — from complex research to quick answers. Get clear, thoughtful responses.
          </p>

          {/* Suggestion chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
            {SUGGESTIONS.map(s => (
              <button
                key={s.prompt}
                type="button"
                onClick={() => { setPrompt(s.prompt); setTimeout(() => textareaRef.current?.focus(), 50) }}
                className="flex items-start gap-3 p-3.5 rounded-xl text-left transition-all duration-150 group"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border-subtle)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.background = 'var(--color-surface-2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                  e.currentTarget.style.background = 'var(--color-surface-1)'
                }}>
                <span className="text-base mt-0.5 flex-shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-[0.8rem] font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {s.label}
                  </p>
                  <p className="text-[0.73rem] leading-relaxed truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {s.prompt}
                  </p>
                </div>
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                     style={{ color: 'var(--color-text-muted)' }}
                     fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Composer pinned at bottom */}
      {renderComposer()}
    </div>
  )

  // ─────────────────────────────────────────────────────
  //  CONVERSATION VIEW
  // ─────────────────────────────────────────────────────
  const renderConversationView = () => (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-4 py-8 md:px-8">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={`${msg.role}-${idx}`}
              message={msg}
            />
          ))}
          {isSending && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Sticky composer */}
      <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        {renderComposer()}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════
  //  ROOT RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-0)' }}>

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0 h-full px-3 py-5 overflow-hidden"
        style={{
          background: 'var(--color-surface-1)',
          borderRight: '1px solid var(--color-border-subtle)',
        }}>
        {renderSidebarInner()}
      </aside>

      {/* ── Mobile Sidebar Drawer ──────────────────────── */}
      {isMobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed top-0 left-0 h-full z-50 flex flex-col w-64 px-2.5 py-4 md:hidden overflow-hidden animate-slide-in-left"
            style={{
              background: 'var(--color-surface-1)',
              borderRight: '1px solid var(--color-border-subtle)',
            }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute top-4 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
              aria-label="Close sidebar">
              <IconX />
            </button>
            {renderSidebarInner()}
          </aside>
        </>
      )}

      {/* ── Main Content ──────────────────────────────── */}
      <section className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-subtle)', minHeight: '52px' }}>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
            aria-label="Open sidebar">
            <IconMenu />
          </button>

          {/* Mobile: brand */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            <LogoMark size="sm" />
            <span className="text-[0.85rem] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Perplexity
            </span>
          </div>

          {/* Desktop: breadcrumb / status */}
          <div className="hidden md:flex items-center gap-2 flex-1">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-success)' }} />
            <span
              className="text-[0.72rem]"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              {isSending ? 'Generating response…' : chatId ? 'Conversation active' : 'Ready'}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Mobile: account avatar */}
          <div className="relative md:hidden flex-shrink-0" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountOpen(o => !o)}
              aria-expanded={isAccountOpen}
              aria-label="Account menu"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[0.7rem] font-bold transition-opacity hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))',
                color: '#fff',
              }}>
              {firstName.charAt(0).toUpperCase()}
            </button>
            {isAccountOpen && (
              <div
                className="absolute right-0 top-10 w-40 rounded-xl overflow-hidden z-50 animate-fade-up"
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
                }}>
                <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <p className="text-[0.78rem] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.userName || 'Account'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={auth.handleLogout}
                  className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[0.8rem] text-left transition-all"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)'; e.currentTarget.style.color = 'var(--color-error)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}>
                  <IconLogout />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {hasMessages ? renderConversationView() : renderWelcomeScreen()}
        </div>
      </section>
    </div>
  )
}

export default Dashboard