const textarea = document.querySelector("textarea");
const questionButtons = document.querySelectorAll(".question-list button");
const chatDock = document.querySelector(".chat-dock");
const viewChatButton = document.querySelector(".view-chat");
const viewChatLabel = document.querySelector(".view-chat-label");
const historyList = document.querySelector(".history-list");
const sendButton = document.querySelector(".send");

const chatHistory = [];

questionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    textarea.value = button.textContent.trim();
    textarea.focus();
    fitTextarea();
  });
});

viewChatButton.addEventListener("click", () => {
  const isOpen = chatDock.classList.toggle("chat-open");

  viewChatButton.setAttribute("aria-expanded", String(isOpen));
  viewChatLabel.textContent = isOpen ? "Hide" : "Chat history";

  if (!isOpen) {
    chatDock.classList.remove("empty", "has-history");
    return;
  }

  renderChatHistory();
});

sendButton.addEventListener("click", () => {
  const text = textarea.value.trim();

  if (!text) {
    return;
  }

  chatHistory.push({ sender: "user", text });
  textarea.value = "";
  fitTextarea();

  if (chatDock.classList.contains("chat-open")) {
    renderChatHistory();
  }
});

function renderChatHistory() {
  const hasHistory = chatHistory.length > 0;

  chatDock.classList.toggle("empty", !hasHistory);
  chatDock.classList.toggle("has-history", hasHistory);
  historyList.innerHTML = "";

  chatHistory.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `message ${message.sender}`;
    bubble.textContent = message.text;
    historyList.appendChild(bubble);
  });
}

function fitTextarea() {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
}

textarea.addEventListener("input", fitTextarea);
