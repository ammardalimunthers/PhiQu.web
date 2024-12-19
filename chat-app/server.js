const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Simpan riwayat chat
const CHAT_HISTORY_FILE = "./data/chat-history.json";

// Middleware untuk file statis
app.use(express.static("public"));

// Konfigurasi multer untuk upload file
const upload = multer({ dest: "public/uploads/" });

// API untuk unggah file
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Muat riwayat chat
function loadChatHistory() {
  if (!fs.existsSync(CHAT_HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, "utf-8"));
}

// Simpan riwayat chat
function saveChatHistory(messages) {
  fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(messages, null, 2));
}

// Array untuk menyimpan pesan
let messages = loadChatHistory();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Kirim riwayat chat ke pengguna baru
  socket.emit("chat-history", messages);

  // Terima nama pengguna
  socket.on("set-username", (username) => {
    socket.username = username;
    io.emit("user-joined", username);
  });

  // Terima pesan
  socket.on("chat-message", (data) => {
    const message = {
      username: socket.username,
      text: data.text,
      timestamp: new Date().toISOString(),
      file: data.file || null,
    };
    messages.push(message);
    saveChatHistory(messages);
    io.emit("chat-message", message);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("user-left", socket.username);
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});