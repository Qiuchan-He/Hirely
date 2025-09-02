const { ChromaClient } = require('chromadb');
const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const OpenAI = require("openai");

const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

class ResumeProcessHelper {
  constructor() {
    this.chromaClient = new ChromaClient({ path: 'http://localhost:8000' });
    this.collection = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Get or create collection
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: "resume",
      });
      console.log("Resume collection initialized");
    } catch (error) {
      console.error('Error initializing ChromaDB:', error);
    }
  }

  async processResume(filePath) {
    try {
      console.log(`Processing resume at: ${filePath}`);

      const text = await this.extractTextFromPdf(filePath);

      const chunks = this.splitTextIntoChunks(text);
      console.log(`Split into ${chunks.length} chunks`);
      
      // Process and store each chunk
      for (const [index, chunk] of chunks.entries()) {
        // Create embedding via OpenAI
        const embedding = await this.createEmbedding(chunk);
        
        // Store in Chroma
        await this.collection.add({
          ids: [`chunk_${Date.now()}_${index}`],
          embeddings: [embedding],
          metadatas: [{ source: 'resume', timestamp: new Date().toISOString() }],
          documents: [chunk]
        });
        console.log(`Stored chunk ${index+1}/${chunks.length}`);
      }
      
      return { success: true, message: 'Resume processed successfully', chunks: chunks.length };
    } catch (error) {
      console.error('Error processing resume:', error);
      throw error;
    }
  }

  splitTextIntoChunks(text){
    const sections = this.splitTextSections(text);
    const chunks = [];

    for (const [section, content] of Object.entries(sections)) {
      switch (section) {
        case "EDUCATION":
        case "TECHNICAL SKILLS":
          chunks.push(...this.splitIntoSentences(content).map(s => `${section}: ${s}`));
          break;

        case "EXPERIENCE":
        case "PROJECTS":
          chunks.push(...this.slidingWindowChunks(content, 50, 15).map(c => `${section}: ${c}`));
          break;

        case "LANGUAGE SKILLS":
          chunks.push(`${section}: ${content}`);
          break;

        default:
          chunks.push(`${section}: ${content}`);
      }
    }

    return chunks;
  }

  splitTextSections(text) {
    const sectionRegex = /\b(EDUCATION|TECHNICAL SKILLS|EXPERIENCE|PROJECTS|LANGUAGE SKILLS)\b/i;
    const lines = text.split(/\r?\n/);

    const sections = {};
    let current = "";
    let buffer = [];

    for (const line of lines) {
      const match = line.match(sectionRegex);
      if (match) {
        if (current) sections[current] = buffer.join("\n").trim();
        current = match[1];
        buffer = [];
      } else {
        buffer.push(line);
      }
    }
    if (current) sections[current] = buffer.join("\n").trim();
    return sections;
  }

  splitIntoSentences(text){
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }


  slidingWindowChunks(text, windowSize = 50, overlap = 15) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks= [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + windowSize, words.length);
      const chunk = words.slice(start, end).join(" ");
      chunks.push(chunk);

      if (end === words.length) break;
      start += windowSize - overlap; // 关键：窗口滑动时保留 overlap
    }
    return chunks;
  }

  
  async queryResume(query) {
    try {
      console.log(`Querying resume with: "${query}"`);
      // Create embedding for query
      const queryEmbedding = await this.createEmbedding(query);

      console.log("the queryEmbedding", queryEmbedding);

      // Search in Chroma
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 3,
        includeDistances: true  
      });
      
      const docs = results.documents[0] || [];
    const distances = results.distances[0] || [];

    // 3. combine text and distances
    const chunksWithDistance = docs.map((text, i) => ({
      text,
      distance: distances[i]
    }));

    console.log(`Found ${chunksWithDistance.length} results with distances`, chunksWithDistance);

    return chunksWithDistance; 
    } catch (error) {
      console.error('Error querying resume:', error);
      throw error;
    }
  }
  
  async createEmbedding(text) {

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  }
  
  async extractTextFromPdf(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error(`Error extracting text from PDF: ${error.message}`);
      throw error;
    }
  }
  
}

module.exports = new ResumeProcessHelper();