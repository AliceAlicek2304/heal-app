import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import './ChatBot.css';
import { FaRobot, FaTimes, FaPaperPlane, FaTrash } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const ChatBot = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Lấy lịch sử chat khi component mount và người dùng đã đăng nhập
    useEffect(() => {
        if (isAuthenticated && isOpen) {
            fetchChatHistory();
        }
    }, [isAuthenticated, isOpen]);

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus vào input khi mở chatbot
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
                // Chuyển đổi lịch sử thành định dạng tin nhắn
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

        // Thêm tin nhắn người dùng vào danh sách
        setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

        // Hiển thị trạng thái đang gửi
        setIsLoading(true);

        try {
            // Gọi API
            const response = await chatService.sendMessage(userMessage);
            setIsLoading(false);

            if (response.success && response.data) {
                // Thêm tin nhắn từ bot vào danh sách
                setMessages(prev => [...prev, { text: response.data.answer, isUser: false }]);
            } else {
                // Hiển thị thông báo lỗi
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
        <div className="chatbot-container">
            {/* Nút toggle chatbot */}
            <button
                className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
                onClick={toggleChat}
                aria-label="Toggle Chatbot"
            >
                {isOpen ? <FaTimes /> : <FaRobot />}
            </button>

            {/* Cửa sổ chat */}
            <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
                <div className="chatbot-header">
                    <div className="chatbot-title">
                        <FaRobot />
                        <span>HealApp Assistant</span>
                    </div>
                    {isAuthenticated && messages.length > 0 && (
                        <button
                            className="clear-history-btn"
                            onClick={handleClearHistory}
                            disabled={isLoading}
                            aria-label="Clear Chat History"
                        >
                            <FaTrash />
                        </button>
                    )}
                    <button
                        className="close-btn"
                        onClick={toggleChat}
                        aria-label="Close Chatbot"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="chatbot-messages">
                    {messages.length === 0 ? (
                        <div className="welcome-message">
                            <h3>Chào mừng đến với HealApp Assistant!</h3>
                            <p>Tôi có thể giúp gì cho bạn về sức khỏe hoặc cách sử dụng HealApp?</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}
                            >
                                {msg.isUser ? (
                                    <div className="message-content">{msg.text}</div>
                                ) : (
                                    <div className="message-content">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="message bot-message">
                            <div className="message-content loading">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chatbot-input" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Nhập câu hỏi của bạn..."
                        disabled={isLoading}
                        ref={inputRef}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        aria-label="Send Message"
                    >
                        <FaPaperPlane />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBot;