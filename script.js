const textarea = document.querySelector("textarea");
const composer = document.querySelector(".inline-composer");
const callButton = document.querySelector(".call-button");
const sendButton = document.querySelector(".send-button");
const switcherButtons = document.querySelectorAll("[data-variant]");
const navViewButtons = document.querySelectorAll("[data-nav-view]");
const pageViews = document.querySelectorAll("[data-page-view]");
const signalCards = document.querySelectorAll("[data-signal]");
const starterCard = document.querySelector("[data-starter-card]");
const starterSource = document.querySelector("[data-starter-source]");
const starterTitle = document.querySelector("[data-starter-title]");
const starterLink = document.querySelector("[data-starter-link]");
const starterRows = document.querySelector("[data-starter-rows]");

const variants = {
  current: {
    placeholders: [
      "How would you evaluate my city mobility idea?",
      "What should I ask you about public trust?",
      "How do mission-led companies explain themselves well?",
      "What would you tell a journalist covering urban mobility?",
    ],
  },
  common: {
    placeholders: [
      "Where do my interests overlap most with your work?",
      "How should audience editors think about founder stories?",
      "What makes a company’s story feel credible?",
      "How do cities, media, and trust connect?",
    ],
  },
  trends: {
    placeholders: [
      "What are people asking you about most right now?",
      "What recent coverage should I understand before we talk?",
      "What topic around cities is getting attention lately?",
      "What question should I ask based on your latest work?",
    ],
  },
};

const signalStarters = {
  podcast: [
    "What did you discuss on The Library of Minds that still feels unresolved?",
    "What question from that conversation should more founders be asking?",
    "How has your thinking changed since recording that episode?",
    "What part of the podcast best explains your current work at Yes&?",
    "What would you want a journalist to ask after listening to it?",
  ],
  substack: [
    "What was the main idea behind your recent piece?",
    "How should founders think about mission without turning it into branding?",
    "What did writing that article clarify for you?",
    "Where do mission-led companies usually get the story wrong?",
    "What should an audience editor pay attention to in that argument?",
  ],
  forbes: [
    "What did the Forbes piece get right or miss about your work?",
    "Why do you think this topic is getting attention now?",
    "What should readers understand beyond the headline?",
    "How does public coverage change how you explain your work?",
    "What question would you ask if you were editing that profile?",
  ],
};

const signalDetails = {
  podcast: {
    source: "Podcast",
    title: "Library of Minds conversation with John Zimmer",
    url: "#podcast",
  },
  substack: {
    source: "Substack",
    title: "Building mission-led companies",
    url: "#substack",
  },
  forbes: {
    source: "Forbes",
    title: "Recent profile on John Zimmer and Yes&",
    url: "#forbes",
  },
};

let currentVariant = "current";
let activeSuggestion = variants.current.placeholders[0];
let placeholderIndex = 0;
let placeholderTimer;
let placeholderTypingTimer;
let isStarterCardOpen = false;

switcherButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyVariant(button.dataset.variant);
  });
});

navViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.navView);
  });
});

textarea.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && activeSuggestion) {
    event.preventDefault();
    acceptSuggestion(activeSuggestion);
    return;
  }

  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  textarea.value = "";
  fitTextarea();
  updateComposerState();
  updateRotatingPlaceholder();
});

callButton.addEventListener("click", () => {
  callButton.classList.toggle("active");
  callButton.querySelector("span").textContent = callButton.classList.contains("active")
    ? "Calling"
    : "Call";
});

sendButton.addEventListener("click", () => {
  textarea.value = "";
  fitTextarea();
  updateComposerState();
  updateRotatingPlaceholder();
});

signalCards.forEach((button) => {
  button.addEventListener("click", () => {
    toggleStarterCard(button.dataset.signal);
  });
});

function fitTextarea() {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

textarea.addEventListener("input", () => {
  fitTextarea();
  updateComposerState();
  updateRotatingPlaceholder();
});

function applyVariant(key) {
  const variant = variants[key];
  currentVariant = key;
  placeholderIndex = 0;

  switcherButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.variant === key);
  });

  updateRotatingPlaceholder();
}

function toggleStarterCard(signal) {
  const selectedCard = [...signalCards].find((button) => button.dataset.signal === signal);
  const isOpenSignal = selectedCard?.classList.contains("active") && !starterCard.hidden;

  if (isOpenSignal) {
    closeStarterCard();
    return;
  }

  openStarterCard(signal);
}

function openStarterCard(signal) {
  const starters = signalStarters[signal];
  const details = signalDetails[signal];

  if (!starters || !details) {
    return;
  }

  signalCards.forEach((button) => {
    button.classList.toggle("active", button.dataset.signal === signal);
  });

  starterSource.textContent = details.source;
  starterTitle.textContent = details.title;
  starterLink.href = details.url;
  starterLink.setAttribute("aria-label", `Open ${details.title}`);

  starterRows.innerHTML = "";
  isStarterCardOpen = true;
  stopPlaceholderRotation();
  setActiveSuggestion(starters[0]);

  starters.forEach((starter) => {
    const row = document.createElement("button");
    row.className = "starter-row";
    row.type = "button";
    row.textContent = starter;
    row.addEventListener("mouseenter", () => {
      setActiveSuggestion(starter);
      setActiveStarterRow(row);
    });
    row.addEventListener("focus", () => {
      setActiveSuggestion(starter);
      setActiveStarterRow(row);
    });
    row.addEventListener("click", () => {
      acceptSuggestion(starter);
    });
    starterRows.append(row);
  });

  setActiveStarterRow(starterRows.querySelector(".starter-row"));

  starterCard.hidden = false;
}

function closeStarterCard() {
  starterCard.hidden = true;
  isStarterCardOpen = false;
  signalCards.forEach((button) => {
    button.classList.remove("active");
  });
  updateRotatingPlaceholder();
}

function updateComposerState() {
  composer.classList.toggle("has-text", textarea.value.trim().length > 0);
}

function setActiveSuggestion(suggestion, options = {}) {
  const { animate = true } = options;
  activeSuggestion = suggestion;

  if (!animate || textarea.value.trim().length > 0) {
    stopPlaceholderTyping();
    textarea.placeholder = suggestion;
    return;
  }

  typePlaceholder(suggestion);
}

function setActiveStarterRow(activeRow) {
  starterRows.querySelectorAll(".starter-row").forEach((row) => {
    row.classList.toggle("is-active", row === activeRow);
  });
}

function acceptSuggestion(suggestion) {
  textarea.value = suggestion;
  stopPlaceholderTyping();
  fitTextarea();
  updateComposerState();
  textarea.focus();
  closeStarterCard();
}

function getCurrentPlaceholders() {
  return variants[currentVariant].placeholders;
}

function updateRotatingPlaceholder() {
  if (isStarterCardOpen || textarea.value.trim().length > 0) {
    stopPlaceholderRotation();
    return;
  }

  const placeholders = getCurrentPlaceholders();
  setActiveSuggestion(placeholders[placeholderIndex % placeholders.length]);
  startPlaceholderRotation();
}

function startPlaceholderRotation() {
  stopPlaceholderRotation();
  placeholderTimer = window.setInterval(() => {
    if (isStarterCardOpen || textarea.value.trim().length > 0) {
      stopPlaceholderRotation();
      return;
    }

    const placeholders = getCurrentPlaceholders();
    placeholderIndex = (placeholderIndex + 1) % placeholders.length;
    setActiveSuggestion(placeholders[placeholderIndex]);
  }, 3200);
}

function stopPlaceholderRotation() {
  window.clearInterval(placeholderTimer);
}

function typePlaceholder(suggestion) {
  stopPlaceholderTyping();
  textarea.placeholder = "";

  let index = 0;
  placeholderTypingTimer = window.setInterval(() => {
    if (textarea.value.trim().length > 0) {
      stopPlaceholderTyping();
      return;
    }

    index += 1;
    textarea.placeholder = suggestion.slice(0, index);

    if (index >= suggestion.length) {
      stopPlaceholderTyping();
    }
  }, 18);
}

function stopPlaceholderTyping() {
  window.clearInterval(placeholderTypingTimer);
}

function showPage(view) {
  pageViews.forEach((page) => {
    page.classList.toggle("active", page.dataset.pageView === view);
  });

  navViewButtons.forEach((button) => {
    const isActive = button.dataset.navView === view;
    if (button.classList.contains("sidebar-action")) {
      button.classList.toggle("active", isActive);
    }

    if (button.classList.contains("conversation-item")) {
      button.classList.toggle("active", isActive);
      button.classList.toggle("view-active", isActive);
    }
  });
}

applyVariant("current");
showPage("profile");
updateComposerState();
