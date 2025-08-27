const express = require("express");
const cors = require("cors");
const app = express();

const dotenv = require("dotenv");

dotenv.config();

app.use(cors());
app.use(express.json());


app.use("/chat", require(`./routes/chat`));
app.use("/resume", require(`./routes/resume`));


const PORT = process.env.PORT; 
const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});
