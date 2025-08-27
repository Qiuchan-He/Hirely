const OpenAI = require("openai");
const resumeProcessor = require('../helpers/resumeProcessHelper'); 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SIMILARITY_THRESHOLD = 0.75; // 可根据实际情况调整

const chatWithBot = async (req, res) => {
  try {
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1];
    const query = lastUserMessage?.content || "";


    // 1. 用户问题转 embedding并检索
  const searchResults = await resumeProcessor.queryResume(query);
  console.log('Search results from ChromaDB:', searchResults);

    // 3. 判断相似度是否足够高
    let relevantChunks = [];
    if (searchResults && searchResults.length > 0) {
      relevantChunks = searchResults;
    }

    console.log(`Found ${relevantChunks.length} relevant chunks with similarity >= ${SIMILARITY_THRESHOLD}`);
    // 4. 拼接简历内容到 prompt
    let enhancedMessages = [...messages];
    if (relevantChunks.length > 0) {
      const resumeInfo = relevantChunks.map(r => r.text).join('\n\n');
      enhancedMessages.push({
        role: "system",
        content: `The following information is from Cho's resume and is relevant to the user's question:\n${resumeInfo}\nPlease answer the user's question based on this information.`
      });
    } 

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