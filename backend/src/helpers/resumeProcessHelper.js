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
      // Extract text from PDF
      const text = await this.extractTextFromPdf(filePath);
      console.log(`Extracted text length: ${text.length}`);
      
      // Split into chunks
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
  
  async queryResume(query) {
    try {
      console.log(`Querying resume with: "${query}"`);
      // Create embedding for query
      const queryEmbedding = await this.createEmbedding(query);
      
      // Search in Chroma
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 3
      });
      
      console.log(`Found ${results.documents[0]?.length || 0} relevant results`);
      // Return the matching text chunks
      return results.documents[0] || [];
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
  
  splitTextIntoChunks(text, maxChunkSize = 1000) {
    const chunks = [];
    let currentChunk = '';
    
    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length <= maxChunkSize) {
        currentChunk += paragraph + '\n\n';
      } else {
        // If current chunk is not empty, add it to chunks
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        
        // Start a new chunk with this paragraph
        currentChunk = paragraph + '\n\n';
      }
    }
    
    // Add the last chunk if not empty
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}

module.exports = new ResumeProcessHelper();