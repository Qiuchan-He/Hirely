export async function sendMessageToOpenAI(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
  const response = await fetch("http://localhost:5001/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },   
    body: JSON.stringify({ messages }),
  });
  const data = await response.json();
  return data.message;
}