const OpenAI = require("openai");
const resumeProcessor = require('../helpers/resumeProcessHelper'); 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DISTANCE_THRESHOLD = 0.45; // 可根据实际情况调整

const chatWithBot = async (req, res) => {
  try {
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1];
    const query = lastUserMessage?.content || "";


    const searchResults = await resumeProcessor.queryResume(query);
    console.log('Search results from ChromaDB:', searchResults);

    
    let relevantChunks = [];
    if (searchResults && searchResults.length > 0) {
      relevantChunks = searchResults.filter(chunk => chunk.distance <= DISTANCE_THRESHOLD);
    }

    console.log(`Found ${relevantChunks.length} relevant chunks with similarity <= ${DISTANCE_THRESHOLD}`);
   
    let enhancedMessages = [...messages];
    if (relevantChunks.length > 0) {
      const resumeInfo = relevantChunks.map(r => r.text).join('\n\n');
      console.log("the resumeInfo", resumeInfo);
      enhancedMessages.push({
        role: "user",
        content: `Use ONLY the following resume information to answer my question:\n${resumeInfo}`
      });
    } 

    console.log("the messages for sending", enhancedMessages);
    // 5. 调用大模型
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: enhancedMessages,
      });

    const reply = response.choices[0].message.content;
    res.json({ message: reply, preserveFormatting: true });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};


module.exports = { chatWithBot };