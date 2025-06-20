import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import styles from './ChatBot.module.css';
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated && isOpen) {
            fetchChatHistory();
        }
    }, [isAuthenticated, isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChatHistory = async () => {
        if (!isAuthenticated) return;

        try {
            setIsLoading(true);
            const response = await chatService.getChatHistory();
            setIsLoading(false);

            if (response.success && response.data && response.data.length > 0) {
                const history = response.data[0].history || [];
                const formattedHistory = history.map(item => [
                    { text: item.question, isUser: true },
                    { text: item.answer, isUser: false }
                ]).flat();
                setMessages(formattedHistory);
            }
        } catch (error) {
            console.error("Error fetching chat history:", error);
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!isAuthenticated) return;

        const confirmed = window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat?');
        if (confirmed) {
            setIsLoading(true);
            await chatService.clearChatHistory();
            setIsLoading(false);
            setMessages([]);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');

        setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
        setIsLoading(true);

        try {
            const response = await chatService.sendMessage(userMessage);
            setIsLoading(false);

            if (response.success && response.data) {
                setMessages(prev => [...prev, { text: response.data.answer, isUser: false }]);
            } else {
                setMessages(prev => [...prev, {
                    text: "Xin lỗi, tôi không thể trả lời ngay lúc này. Vui lòng thử lại sau.",
                    isUser: false
                }]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                text: "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.",
                isUser: false
            }]);
        }
    };

    return (
        <div className={styles.chatbotContainer}>
            <button
                className={`${styles.chatbotToggle} ${isOpen ? styles.open : ''}`}
                onClick={toggleChat}
                aria-label="Toggle Chatbot"
            >
                <div className={styles.toggleIcon}>
                    {isOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            <circle cx="9" cy="10" r="1"></circle>
                            <circle cx="15" cy="10" r="1"></circle>
                            <path d="M9 14s1 1 3 1 3-1 3-1"></path>
                        </svg>
                    )}
                </div>
                <div className={styles.notification}>
                    <span>AI</span>
                </div>
            </button>

            <div className={`${styles.chatbotWindow} ${isOpen ? styles.open : ''}`}>
                <div className={styles.chatbotHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.botAvatar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="8" r="7"></circle>
                                <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"></polyline>
                            </svg>
                        </div>
                        <div className={styles.chatbotTitle}>
                            <h3>HealApp Assistant</h3>
                            <p>Trợ lý AI chăm sóc sức khỏe</p>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        {isAuthenticated && messages.length > 0 && (
                            <button
                                className={styles.clearHistoryBtn}
                                onClick={handleClearHistory}
                                disabled={isLoading}
                                aria-label="Clear Chat History"
                                title="Xóa lịch sử chat"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        )}
                        <button
                            className={styles.closeBtn}
                            onClick={toggleChat}
                            aria-label="Close Chatbot"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={styles.chatbotMessages}>
                    {messages.length === 0 ? (
                        <div className={styles.welcomeMessage}>
                            <div className={styles.welcomeIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    <circle cx="9" cy="10" r="1"></circle>
                                    <circle cx="15" cy="10" r="1"></circle>
                                    <path d="M9 14s1 1 3 1 3-1 3-1"></path>
                                </svg>
                            </div>
                            <h3>Chào mừng đến với HealApp Assistant!</h3>
                            <p>Tôi có thể giúp gì cho bạn về sức khỏe hoặc cách sử dụng HealApp?</p>
                            <div className={styles.quickActions}>
                                <button onClick={() => setInput('Cách sử dụng HealApp?')} className={styles.quickBtn}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                                    </svg>
                                    Cách sử dụng HealApp?
                                </button>
                                <button onClick={() => setInput('Lời khuyên sức khỏe hàng ngày')} className={styles.quickBtn}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                    </svg>
                                    Lời khuyên sức khỏe
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${msg.isUser ? styles.userMessage : styles.botMessage}`}
                            >
                                {!msg.isUser && (
                                    <div className={styles.messageAvatar}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="8" r="7"></circle>
                                            <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"></polyline>
                                        </svg>
                                    </div>
                                )}
                                <div className={styles.messageContent}>
                                    {msg.isUser ? (
                                        <div className={styles.messageText}>{msg.text}</div>
                                    ) : (
                                        <div className={styles.messageText}>
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    )}
                                    <div className={styles.messageTime}>
                                        {new Date().toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className={`${styles.message} ${styles.botMessage}`}>
                            <div className={styles.messageAvatar}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="8" r="7"></circle>
                                    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"></polyline>
                                </svg>
                            </div>
                            <div className={`${styles.messageContent} ${styles.loading}`}>
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className={styles.chatbotInput} onSubmit={handleSubmit}>
                    <div className={styles.inputWrapper}>
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Nhập câu hỏi của bạn..."
                            disabled={isLoading}
                            ref={inputRef}
                            className={styles.messageInput}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={styles.sendBtn}
                            aria-label="Send Message"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatBot;