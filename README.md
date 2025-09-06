# Hirely - Resume RAG Demo

This project is an experiment to explore Retrieval-Augmented Generation (RAG) using the OpenAI API and Chroma vector database, with a focus on enabling natural language Q&A over your own resume.

## Project Overview

- **Frontend:** React  
- **Backend:** Node.js  
- **Vector Database:** Chroma  
- **LLM API:** OpenAI GPT  
- **Purpose:** Store your resume as searchable vectors and allow question-answering grounded in your real experiences, education, and skills.

## How RAG is Implemented

Since resumes have a well-defined structure (sections like Education, Experience, Skills, Publications, etc.), the project takes advantage of this for more effective chunking and retrieval:

1. **Title-Based Segmentation:**  
   The resume is first split into sections according to their titles (e.g., "Education", "Work Experience").

2. **Section-Specific Chunking:**  
   For each section, different chunking strategies are used to optimize search and retrieval:
   - **Work Experience:** Each job or position is treated as a separate chunk.
   - **Education:** Each degree or school entry is chunked individually.
   - **Skills:** Skills are grouped or split by category.
   - **Publications/Projects:** Each item is chunked separately.

3. **Embedding and Storage:**  
   Each chunk is embedded using OpenAI's embedding API and stored in Chroma as a vector, along with its section title and metadata.

4. **Retrieval & Generation:**  
   When a question is asked, relevant chunks are retrieved via semantic search and fed to the OpenAI GPT model for answer generation.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Qiuchan-He/Hirely.git
   cd Hirely
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install
   ```

3. **Prepare your resume**
   - Place your resume (PDF) in the designated folder.
   - Update configuration if needed.

4. **Configure API keys**
   - Set your OpenAI API key and other credentials in a `.env` file.

5. **Run the application**
   ```bash
   # Start backend
   cd server
   npm start

   # Start frontend
   cd ../client
   npm run dev
   ```

6. **Ask Questions**
   - Use the web interface to interactively ask questions about your resume.

## Example Questions

- “What is your experience with machine learning?”
- “Which companies have you worked for?”
- “Summarize your education background.”

## Project Status

This is an experimental, learning-focused project. Contributions and suggestions are welcome!

## License

MIT License

---

*Fork and adapt for your own resume or use case!*
