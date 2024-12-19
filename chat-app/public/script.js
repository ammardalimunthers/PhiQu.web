const socket = io();

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const usernameInput = document.getElementById("username");
const enterChatButton = document.getElementById("enter-chat");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");
const fileInput = document.getElementById("file-input");

enterChatButton.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit("set-username", username);
    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = chatInput.value.trim();
  const file = fileInput.files[0];
  let filePath = null;

  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/upload", { method: "POST", body: formData });
    const result = await response.json();
    filePath = result.filePath;
  }

  socket.emit("chat-message", { text: message, file: filePath });
  chatInput.value = "";
  fileInput.value = "";
});

socket.on("chat-history", (messages) => {
  messages.forEach((message) => addMessage(message));
});

socket.on("chat-message", (message) => {
  addMessage(message);
});

socket.on("user-joined", (username) => {
  addNotification(`${username} joined the chat`);
});

socket.on("user-left", (username) => {
  addNotification(`${username} left the chat`);
});

function addMessage({ username, text, timestamp, file }) {
  const messageElement = document.createElement("div");
  messageElement.innerHTML = `
    <strong>${username}</strong> [${new Date(timestamp).toLocaleTimeString()}]: ${text}
    ${file ? `<a href="${file}" target="_blank">Download File</a>` : ""}
  `;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addNotification(notification) {
  const notificationElement = document.createElement("div");
  notificationElement.style.color = "gray";
  notificationElement.textContent = notification;
  chatBox.appendChild(notificationElement);
}