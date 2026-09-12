import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from "react-redux"
import { useChat } from '../hooks/useChat'
import { deleteChat, getChats, getMessages, sendMessage } from '../service/chat.api'
import { useAuth } from '../../auth/hook/useAuth'
import '../../../Styles/chat.css'

const Dashboard = () => {
  const chat = useChat()
  const auth = useAuth()
  const { user } = useSelector(state => state.auth)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [chatId, setChatId] = useState(null)
  const [recentChats, setRecentChats] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const socket = chat.initializationsocketconnection()

    return () => socket?.disconnect()
  }, [chat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  useEffect(() => {
    const loadRecentChats = async () => {
      try {
        const data = await getChats()
        setRecentChats(data.chats || [])
      } catch {
        // The protected route may briefly load before auth is ready.
      }
    }

    loadRecentChats()
  }, [])

  const submitPrompt = async (event) => {
    event.preventDefault()
    const message = prompt.trim()

    if (!message || isSending) return

    setPrompt('')
    setError('')
    setMessages(current => [...current, { role: 'user', content: message }])
    setIsSending(true)

    try {
      const data = await sendMessage({ message, chatId })
      setChatId(data.chat?._id || chatId)
      if (data.chat?._id) {
        setRecentChats(current => [data.chat, ...current.filter(chatItem => chatItem._id !== data.chat._id)])
      }
      setMessages(current => [...current, {
        role: 'ai',
        content: data.response || 'I could not generate a response just yet.',
      }])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reach the assistant. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const startNewChat = () => {
    setChatId(null)
    setMessages([])
    setPrompt('')
    setError('')
  }

  const openChat = async (selectedChatId) => {
    if (selectedChatId === chatId) return

    try {
      const data = await getMessages(selectedChatId)
      setChatId(selectedChatId)
      setMessages((data.messages || []).map(message => ({
        role: message.role,
        content: message.content,
      })))
      setError('')
    } catch {
      setError('Unable to load this conversation.')
    }
  }

  const removeChat = async (event, selectedChatId) => {
    event.stopPropagation()

    try {
      await deleteChat(selectedChatId)
      setRecentChats(current => current.filter(chatItem => chatItem._id !== selectedChatId))
      if (selectedChatId === chatId) startNewChat()
    } catch {
      setError('Unable to delete this conversation.')
    }
  }

  const firstName = user?.userName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'

  return (
    <main className="chat-shell">
      <aside className="chat-sidebar">
        <div className="brand-mark"><span>p</span> perplexity</div>
        <button className="new-chat-button" onClick={startNewChat} type="button">
          <span aria-hidden="true">+</span> New thread
        </button>
        <div className="sidebar-section">
          <p className="sidebar-label">Workspace</p>
          <button className="sidebar-link active" type="button"><span aria-hidden="true">⌂</span> Discover</button>
          <button className="sidebar-link" type="button"><span aria-hidden="true">▣</span> Library</button>
          <div className="recent-chat-list">
            {recentChats.length > 0 && <p className="sidebar-label recent-label">Recent chats</p>}
            {recentChats.map(chatItem => (
              <div className={`recent-chat ${chatItem._id === chatId ? 'active' : ''}`} key={chatItem._id} role="button" tabIndex="0" onClick={() => openChat(chatItem._id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openChat(chatItem._id) }}>
                <span aria-hidden="true">◦</span><span>{chatItem.title || 'Untitled chat'}</span>
                <span className="recent-chat-delete"><button type="button" aria-label={`Delete ${chatItem.title || 'chat'}`} onClick={event => removeChat(event, chatItem._id)}>×</button></span>
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-bottom">
          <p className="sidebar-label">Account</p>
          <div className="profile-row-wrap">
            <button className="profile-row" type="button" onClick={() => setIsAccountMenuOpen(current => !current)} aria-expanded={isAccountMenuOpen}>
            <div className="avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div><strong>{user?.userName || user?.name || 'Your account'}</strong><span>Personal plan</span></div>
            <span className="more-icon" aria-hidden="true">•••</span>
            </button>
            {isAccountMenuOpen && <div className="account-menu"><button type="button" onClick={auth.handleLogout}><span aria-hidden="true">↪</span> Log out</button></div>}
          </div>
        </div>
      </aside>

      <section className="chat-content">
        <header className="chat-header">
          <div className="mobile-brand"><span>p</span> perplexity</div>
          <div className="header-actions">
            <div className="connection-status"><i /> Online <span className="header-divider" /> <span>Personal workspace</span></div>
            <button className="mobile-account-button" type="button" onClick={() => setIsAccountMenuOpen(current => !current)} aria-label="Open account menu" aria-expanded={isAccountMenuOpen}>{firstName.charAt(0).toUpperCase()}</button>
            {isAccountMenuOpen && <div className="account-menu mobile-menu"><button type="button" onClick={auth.handleLogout}><span aria-hidden="true">↪</span> Log out</button></div>}
          </div>
        </header>

        <div className={`conversation ${messages.length ? 'has-messages' : ''}`}>
          {!messages.length ? (
            <div className="welcome-panel">
              <p className="eyebrow">Personal research assistant</p>
              <h1>What are you curious about, {firstName}?</h1>
              <p className="welcome-copy">Ask anything. Explore ideas, solve problems, and find a clearer path forward.</p>
              <div className="suggestion-grid">
                {['Explain a complex topic simply', 'Help me plan my next project', 'Find patterns in my notes'].map(suggestion => (
                  <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)}>{suggestion}<span aria-hidden="true">↗</span></button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => (
                <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  <div className="message-marker">{message.role === 'user' ? firstName.charAt(0).toUpperCase() : 'p'}</div>
                  <div><p className="message-label">{message.role === 'user' ? 'You' : 'Perplexity'}</p><p className="message-copy">{message.content}</p></div>
                </article>
              ))}
              {isSending && <div className="message ai"><div className="message-marker">p</div><div><p className="message-label">Perplexity</p><div className="typing"><i /><i /><i /></div></div></div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <p className="request-error" role="alert">{error}</p>}
          <form className="composer" onSubmit={submitPrompt}>
            <textarea aria-label="Ask a question" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Ask anything..." rows="1" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitPrompt(event) } }} />
            <div className="composer-footer"><span>Press Enter to send · Shift + Enter for a new line</span><button aria-label="Send message" disabled={!prompt.trim() || isSending} type="submit">↑</button></div>
          </form>
          <p className="disclaimer">Perplexity can make mistakes. Check important information.</p>
        </div>
      </section>
    </main>
  )
}

export default Dashboard