import { useState } from 'react';

export default function MenuChat({ analysis, recommendations }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    const userMessage = inputMessage;
    setInputMessage('');

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/ai/menuChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          analysis,
          recommendations,
          chatHistory: messages
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            
            // Skip the [DONE] message without trying to parse it
            if (data.trim() === '[DONE]') continue;
            
            // Only try to parse if it's not [DONE]
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setStreamedResponse(fullResponse);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Add complete AI response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fullResponse 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'Sorry, I encountered an error processing your message.' 
      }]);
    } finally {
      setIsLoading(false);
      // Don't clear the streamed response here anymore
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Discuss Your Menu Analysis</h3>
        <p className="text-sm text-gray-600">Ask questions about the recommendations</p>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-3/4 rounded-lg p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-100 text-blue-900' 
                : 'bg-gray-100 text-gray-900'
            } shadow-md`}>
              <div className="font-semibold mb-2">{msg.role === 'user' ? 'You' : 'Menu Intelligence'}</div>
              <div className="whitespace-pre-line">{msg.content}</div>
            </div>
          </div>
        ))}
        
        {/* Only show streaming response while loading */}
        {isLoading && streamedResponse && (
          <div className="flex justify-start">
            <div className="max-w-3/4 rounded-lg p-3 bg-gray-100 text-gray-900">
              {streamedResponse}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your menu analysis..."
            className="flex-1 rounded-lg border p-2"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 