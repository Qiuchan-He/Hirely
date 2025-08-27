import { useState } from "react";
import { sendMessageToOpenAI } from "./services/chatService";
import ReactMarkdown from 'react-markdown';
import "./Chat.css";

function App() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async() => {
    if (!input.trim()) return;

    const updatedMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(updatedMessages);

    setInput("");

    try {
      const botReply = await sendMessageToOpenAI(updatedMessages);
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: botReply }]);
    } catch (error) {
      console.error("Error getting reply:", error);
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: "Error: Could not get reply." }]);
    }
  };

  return (
    <div className="chat-container">
      <div className="welcome">Hey! I'm Cho's AI twin<br/>Ask me about her experience, projects, or skills.</div>
      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message${msg.role === 'user' ? " user" : ""}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;