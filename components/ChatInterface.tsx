'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I'm your SaaS analytics assistant. Ask me anything about your customer data, subscriptions, revenue metrics, or other business metrics. I can directly query your database to provide accurate, real-time insights.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thoughts]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);
    setThoughts(['Analyzing your question...']);
    
    try {
      setTimeout(() => {
        setThoughts(prev => [...prev, 'Determining what database queries to run...']);
      }, 1000);
      
      setTimeout(() => {
        setThoughts(prev => [...prev, 'Querying database and fetching relevant data...']);
      }, 2500);
      
      setTimeout(() => {
        setThoughts(prev => [...prev, 'Analyzing results and formulating insights...']);
      }, 4000);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      
      setIsThinking(false);
      setThoughts([]);
      
      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to OpenAI right now. Please check your API key and try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format the chat message content with markdown-like features
  const formatMessageContent = (content: string) => {
    // Replace markdown-style bullet points
    let formattedContent = content.replace(/\n- /g, '<br>• ');
    formattedContent = formattedContent.replace(/\n• /g, '<br>• ');
    
    // Replace newlines with <br>
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    // Bold text between ** **
    formattedContent = formattedContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    return formattedContent;
  };

  return (
    <div className="chat-container" style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      marginBottom: '30px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '400px'
    }}>
      <div style={{ 
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>SaaS Analytics Assistant</div>
      </div>
      
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map(message => (
          <div 
            key={message.id} 
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: message.role === 'user' ? '#1e40af' : '#f3f4f6',
              color: message.role === 'user' ? 'white' : '#1f2937',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              position: 'relative'
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
          </div>
        ))}
        {isLoading && (
          <div 
            style={{
              alignSelf: 'flex-start',
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af', animation: 'pulse 1.5s infinite 0.3s' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af', animation: 'pulse 1.5s infinite 0.6s' }}></div>
              <span style={{ marginLeft: '8px', fontSize: '0.875rem' }}>Analyzing your data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} style={{ 
        borderTop: '1px solid #e5e7eb',
        padding: '12px 16px',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your SaaS metrics, churn, customer trends, etc."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            outline: 'none',
            fontSize: '0.875rem'
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 16px',
            backgroundColor: '#1e40af',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.7 : 1,
            fontWeight: 'bold',
            fontSize: '0.875rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1c3879'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
} 