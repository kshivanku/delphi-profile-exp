const textarea = document.querySelector("textarea");
const composer = document.querySelector(".inline-composer");
const callButton = document.querySelector(".call-button");
const sendButton = document.querySelector(".send-button");
const navViewButtons = document.querySelectorAll("[data-nav-view]");
const pageViews = document.querySelectorAll("[data-page-view]");
const signalCards = document.querySelectorAll("[data-signal]");
const starterCard = document.querySelector("[data-starter-card]");
const starterSource = document.querySelector("[data-starter-source]");
const starterTitle = document.querySelector("[data-starter-title]");
const starterLink = document.querySelector("[data-starter-link]");
const starterRows = document.querySelector("[data-starter-rows]");
const profileModalButtons = document.querySelectorAll("[data-profile-modal]");
const profileDialog = document.querySelector("[data-profile-dialog]");
const profileModalTitle = document.querySelector("[data-modal-title]");
const profileModalKicker = document.querySelector("[data-modal-kicker]");
const profileModalBody = document.querySelector("[data-modal-body]");
const profileModalFollowTitle = document.querySelector("[data-modal-follow-title]");
const profileModalCloseButtons = document.querySelectorAll(".modal-close, .modal-backdrop");

const defaultPlaceholders = [
  "How would you evaluate my city mobility idea?",
  "What should I ask you about public trust?",
  "How do mission-led companies explain themselves well?",
  "What would you tell a journalist covering urban mobility?",
];

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

const profileDescriptions = {
  john: {
    kicker: "About John",
    title: "John Zimmer",
    paragraphs: [
      "John is the co-founder of Yes& and the former co-founder and President of Lyft.",
      "At Yes&, he is building companies around the idea that business can create positive impact at scale. Before that, he helped turn Lyft into one of the defining transportation platforms of the last decade.",
      "He has also appeared on The Library of Minds podcast, and his Delphi is especially useful for questions about cities, transportation, startup leadership, and mission-led company building.",
    ],
  },
  ben: {
    kicker: "About Ben",
    title: "Ben Greenfield",
    paragraphs: [
      "Ben is the founder of Ben Greenfield Life, a health consultant, speaker, and New York Times bestselling author across fitness, nutrition, parenting, cooking, endurance, and spiritual wellness.",
      "His background spans collegiate sports, bodybuilding, Ironman triathlons, obstacle course racing, and personal training recognition from major health and fitness organizations.",
      "His Delphi is useful for questions about functional exercise, nutrition, gut health, supplementation, performance, recovery, and finding a healthier balance between ambition and wellbeing.",
    ],
  },
};

let activeSuggestion = defaultPlaceholders[0];
let placeholderIndex = 0;
let placeholderTimer;
let placeholderTypingTimer;
let isStarterCardOpen = false;

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

profileModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openProfileModal(button.dataset.profileModal);
  });
});

profileModalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeProfileModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !profileDialog.hidden) {
    closeProfileModal();
  }
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
  return defaultPlaceholders;
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

function openProfileModal(profile) {
  const description = profileDescriptions[profile];

  if (!description) {
    return;
  }

  profileModalKicker.textContent = description.kicker;
  profileModalTitle.textContent = description.title;
  profileModalFollowTitle.textContent = `Follow ${description.title.split(" ")[0]} for more`;
  profileModalBody.innerHTML = "";

  description.paragraphs.forEach((paragraph) => {
    const node = document.createElement("p");
    node.textContent = paragraph;
    profileModalBody.append(node);
  });

  profileDialog.hidden = false;
  document.body.classList.add("modal-open");
}

function closeProfileModal() {
  profileDialog.hidden = true;
  document.body.classList.remove("modal-open");
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

updateRotatingPlaceholder();
showPage("profile");
updateComposerState();
