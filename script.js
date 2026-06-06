const profileMiniJump = document.querySelector("[data-profile-jump]");
const johnConversationRows = document.querySelectorAll("[data-reveal-on-john]");
const navViewButtons = document.querySelectorAll("[data-nav-view]");
const pageViews = document.querySelectorAll("[data-page-view]");
const profileModalButtons = document.querySelectorAll("[data-profile-modal]");
const profileDialog = document.querySelector("[data-profile-dialog]");
const profileModalTitle = document.querySelector("[data-modal-title]");
const profileModalKicker = document.querySelector("[data-modal-kicker]");
const profileModalBody = document.querySelector("[data-modal-body]");
const profileModalFollowTitle = document.querySelector("[data-modal-follow-title]");
const profileModalCloseButtons = document.querySelectorAll(".modal-close, .modal-backdrop");

const defaultPlaceholders = {
  john: [
    "How would you evaluate my city mobility idea?",
    "What should I ask you about public trust?",
    "How do mission-led companies explain themselves well?",
    "What would you tell a journalist covering urban mobility?",
  ],
  ben: [
    "Could you share some tips to unlock better gut health?",
    "How do I sort useful wellness advice from hype?",
    "What recovery habit has the biggest impact?",
    "What should a journalist ask about performance culture?",
  ],
};

const profileDescriptions = {
  john: {
    kicker: "About John",
    title: "John Zimmer",
    paragraphs: [
      "I’m John, co-founder of Yes& and former co-founder and President of Lyft.",
      "At Yes&, we’re building companies around the idea that business can make positive impact at scale. Before that, I helped build Lyft into one of the defining transportation platforms of the last decade.",
      "I also recently appeared on The Library of Minds podcast. Ask me about cities, transportation, startup leadership, and building mission-led companies.",
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

const chatContexts = Array.from(document.querySelectorAll("[data-chat-profile]")).map((profile) => {
  const key = profile.dataset.profileKey;
  const typedIntro = profile.querySelector("[data-typed-intro]");
  const chatThread = profile.querySelector("[data-chat-thread]");
  const hasConversationHistory = Boolean(chatThread?.children.length);

  return {
    key,
    profile,
    view: profile.dataset.pageView,
    name: profile.dataset.profileName,
    image: profile.dataset.profileImage,
    header: profile.querySelector(".title-block"),
    textarea: profile.querySelector("textarea"),
    composer: profile.querySelector(".inline-composer"),
    callButton: profile.querySelector(".call-button"),
    sendButton: profile.querySelector(".send-button"),
    chatThread,
    questionSuggestions: profile.querySelectorAll(".question-suggestion"),
    typedIntro,
    introFullText: typedIntro?.textContent || "",
    activeSuggestion: defaultPlaceholders[key]?.[0] || "",
    placeholderIndex: 0,
    placeholderTimer: null,
    placeholderTypingTimer: null,
    introTypingTimer: null,
    chatStarted: profile.classList.contains("chat-started") || hasConversationHistory,
    introAnimationStarted: profile.classList.contains("chat-started") || hasConversationHistory,
  };
});

let activeContext = null;

navViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.navView);
  });
});

chatContexts.forEach((context) => {
  context.textarea?.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && context.activeSuggestion && !context.chatStarted) {
      event.preventDefault();
      acceptSuggestion(context, context.activeSuggestion);
      return;
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    sendComposerMessage(context);
  });

  context.textarea?.addEventListener("input", () => {
    fitTextarea(context);
    updateComposerState(context);
    updateRotatingPlaceholder(context);
  });

  context.callButton?.addEventListener("click", () => {
    context.callButton.classList.toggle("active");
    context.callButton.querySelector("span").textContent = context.callButton.classList.contains("active")
      ? "Calling"
      : "Call";
  });

  context.sendButton?.addEventListener("click", () => {
    sendComposerMessage(context);
  });

  context.questionSuggestions.forEach((button) => {
    button.addEventListener("click", () => {
      sendMessage(context, button.textContent.trim());
    });
  });
});

profileMiniJump?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
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

function fitTextarea(context) {
  context.textarea.style.height = "auto";
  context.textarea.style.height = `${Math.min(context.textarea.scrollHeight, 160)}px`;
}

function updateComposerState(context) {
  context.composer.classList.toggle("has-text", context.textarea.value.trim().length > 0);
}

function setActiveSuggestion(context, suggestion, options = {}) {
  const { animate = true } = options;
  context.activeSuggestion = suggestion;

  if (!animate || context.textarea.value.trim().length > 0) {
    stopPlaceholderTyping(context);
    context.textarea.placeholder = suggestion;
    return;
  }

  typePlaceholder(context, suggestion);
}

function acceptSuggestion(context, suggestion) {
  context.textarea.value = suggestion;
  stopPlaceholderTyping(context);
  fitTextarea(context);
  updateComposerState(context);
  context.textarea.focus();
  updateRotatingPlaceholder(context);
}

function sendComposerMessage(context) {
  sendMessage(context, context.textarea.value);
}

function sendMessage(context, message) {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return;
  }

  ensureChatStarted(context);
  addChatMessage(context, trimmedMessage, "user");
  context.textarea.value = "";
  fitTextarea(context);
  updateComposerState(context);
  updateRotatingPlaceholder(context);

  window.setTimeout(() => {
    addChatMessage(context, getDelphiReply(context, trimmedMessage), "delphi");
  }, 220);
}

function ensureChatStarted(context) {
  if (context.chatStarted || !context.chatThread) {
    return;
  }

  context.profile.classList.add("chat-started");
  context.profile.classList.remove(
    "intro-pending",
    "intro-profile-ready",
    "intro-typing",
    "intro-controls-ready",
  );
  stopIntroTyping(context);
  stopPlaceholderRotation(context);
  stopPlaceholderTyping(context);
  context.activeSuggestion = "";
  context.textarea.placeholder = "Write a message...";
  context.chatStarted = true;
  updateProfileMiniJump();

  const dateNode = document.createElement("div");
  dateNode.className = "chat-date";
  dateNode.innerHTML = `<strong>Today</strong> ${formatChatTime(new Date())}`;
  context.chatThread.append(dateNode);
}

function addChatMessage(context, message, sender) {
  if (!context.chatThread) {
    return;
  }

  const row = document.createElement("div");
  row.className = `message-row ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message;

  row.append(bubble);
  context.chatThread.append(row);
  scrollMessageAboveComposer(context, row);
  updateProfileMiniJump();
}

function updateProfileMiniJump() {
  if (!profileMiniJump) {
    return;
  }

  if (!activeContext?.header) {
    profileMiniJump.classList.remove("is-visible");
    profileMiniJump.hidden = true;
    return;
  }

  profileMiniJump.querySelector("img").src = activeContext.image;
  profileMiniJump.querySelector("[data-profile-mini-name]").textContent = activeContext.name;

  const shouldShow =
    activeContext.chatStarted &&
    activeContext.profile.classList.contains("active") &&
    activeContext.header.getBoundingClientRect().bottom < 24;

  if (shouldShow) {
    profileMiniJump.hidden = false;
    window.requestAnimationFrame(() => {
      profileMiniJump.classList.add("is-visible");
    });
    return;
  }

  profileMiniJump.classList.remove("is-visible");
  window.setTimeout(() => {
    if (!profileMiniJump.classList.contains("is-visible")) {
      profileMiniJump.hidden = true;
    }
  }, 180);
}

function scrollMessageAboveComposer(context, messageRow) {
  window.requestAnimationFrame(() => {
    const composerRect = context.composer.getBoundingClientRect();
    const messageRect = messageRow.getBoundingClientRect();
    const clearance = 18;
    const visibleBottom = context.chatStarted ? composerRect.top - clearance : window.innerHeight - clearance;
    const overlap = messageRect.bottom - visibleBottom;

    if (overlap > 0) {
      window.scrollBy({
        top: overlap,
        behavior: "smooth",
      });
      return;
    }

    if (messageRect.top < clearance) {
      messageRow.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }
  });
}

function scrollLatestMessageToComposer(context, options = {}) {
  const { behavior = "smooth", clearance = 10 } = options;
  const lastMessage = context.chatThread?.querySelector(".message-row:last-of-type");

  if (!lastMessage) {
    return;
  }

  window.requestAnimationFrame(() => {
    const composerRect = context.composer.getBoundingClientRect();
    const messageRect = lastMessage.getBoundingClientRect();
    const targetBottom = composerRect.top - clearance;
    const delta = messageRect.bottom - targetBottom;

    if (Math.abs(delta) < 2) {
      return;
    }

    window.scrollBy({
      top: delta,
      behavior,
    });
  });
}

function formatChatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDelphiReply(context, message) {
  const normalizedMessage = message.toLowerCase();

  if (context.key === "ben") {
    if (normalizedMessage.includes("gut")) {
      return "I’d start with the basics: consistent meals, enough protein and fiber, lower stress around eating, and noticing which foods reliably make Maya feel better or worse.";
    }

    if (normalizedMessage.includes("hype") || normalizedMessage.includes("journalist")) {
      return "A useful filter is whether the advice works for ordinary people without expensive gear, extreme routines, or fear-based claims. That’s where wellness coverage can become genuinely helpful.";
    }

    return "That’s a strong place to begin. I’d separate the practical behavior change from the performance-culture noise, then look at what someone could actually sustain in daily life.";
  }

  if (normalizedMessage.includes("trust")) {
    return "Trust usually comes from making the service predictable before asking people to change behavior. I’d look at reliability, safety, pricing clarity, and whether the city can explain the tradeoffs honestly.";
  }

  if (normalizedMessage.includes("remote work")) {
    return "Remote work changes the rhythm more than the need for mobility. The useful question is where cities now need flexible, all-day transportation instead of systems designed only around a commute peak.";
  }

  if (normalizedMessage.includes("behavior")) {
    return "Behavior changes when the new option is meaningfully easier than the old habit. At Lyft, that meant reducing friction enough that people could trust the experience before they had to think about the platform.";
  }

  return "That’s a good starting point. I’d frame it around what changed for people, what stayed hard, and where transportation choices shape how much trust a city earns from daily life.";
}

function getCurrentPlaceholders(context) {
  return defaultPlaceholders[context.key] || defaultPlaceholders.john;
}

function updateRotatingPlaceholder(context) {
  if (context.chatStarted) {
    stopPlaceholderRotation(context);
    stopPlaceholderTyping(context);
    context.textarea.placeholder = "Write a message...";
    return;
  }

  if (context.textarea.value.trim().length > 0) {
    stopPlaceholderRotation(context);
    return;
  }

  const placeholders = getCurrentPlaceholders(context);
  setActiveSuggestion(context, placeholders[context.placeholderIndex % placeholders.length]);
  startPlaceholderRotation(context);
}

function startPlaceholderRotation(context) {
  stopPlaceholderRotation(context);
  context.placeholderTimer = window.setInterval(() => {
    if (context.textarea.value.trim().length > 0) {
      stopPlaceholderRotation(context);
      return;
    }

    const placeholders = getCurrentPlaceholders(context);
    context.placeholderIndex = (context.placeholderIndex + 1) % placeholders.length;
    setActiveSuggestion(context, placeholders[context.placeholderIndex]);
  }, 3200);
}

function stopPlaceholderRotation(context) {
  window.clearInterval(context.placeholderTimer);
}

function typePlaceholder(context, suggestion) {
  stopPlaceholderTyping(context);
  context.textarea.placeholder = "";

  let index = 0;
  context.placeholderTypingTimer = window.setInterval(() => {
    if (context.textarea.value.trim().length > 0) {
      stopPlaceholderTyping(context);
      return;
    }

    index += 1;
    context.textarea.placeholder = suggestion.slice(0, index);

    if (index >= suggestion.length) {
      stopPlaceholderTyping(context);
    }
  }, 18);
}

function stopPlaceholderTyping(context) {
  window.clearInterval(context.placeholderTypingTimer);
}

function startEmptyChatIntro(context) {
  if (!context.profile || !context.typedIntro || context.chatStarted || context.introAnimationStarted) {
    return;
  }

  context.introAnimationStarted = true;
  context.typedIntro.textContent = "";

  window.setTimeout(() => {
    if (context.chatStarted) {
      return;
    }

    context.profile.classList.remove("intro-pending");
    context.profile.classList.add("intro-profile-ready");
  }, 120);

  window.setTimeout(() => {
    if (context.chatStarted) {
      return;
    }

    context.profile.classList.add("intro-typing");
    typeIntroText(context);
  }, 700);
}

function typeIntroText(context) {
  stopIntroTyping(context);

  let index = 0;
  context.introTypingTimer = window.setInterval(() => {
    if (context.chatStarted || !context.typedIntro) {
      stopIntroTyping(context);
      return;
    }

    index += 1;
    context.typedIntro.textContent = context.introFullText.slice(0, index);

    if (index >= context.introFullText.length) {
      stopIntroTyping(context);
      window.setTimeout(() => {
        if (!context.chatStarted) {
          context.profile.classList.add("intro-controls-ready");
        }
      }, 220);
    }
  }, 18);
}

function stopIntroTyping(context) {
  window.clearInterval(context.introTypingTimer);
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
  if (view === "profile") {
    revealJohnConversation();
  }

  if (view === "discover") {
    window.scrollTo({ top: 0, behavior: "auto" });
  }

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

  chatContexts.forEach((context) => {
    stopPlaceholderRotation(context);
    stopPlaceholderTyping(context);
  });

  activeContext = chatContexts.find((context) => context.view === view) || null;

  if (activeContext && !activeContext.chatStarted) {
    startEmptyChatIntro(activeContext);
    updateRotatingPlaceholder(activeContext);
  } else if (activeContext?.chatStarted) {
    activeContext.textarea.placeholder = "Write a message...";
    scrollLatestMessageToComposer(activeContext, { behavior: "auto", clearance: 10 });
  }

  updateProfileMiniJump();
}

function revealJohnConversation() {
  johnConversationRows.forEach((row) => {
    row.hidden = false;
  });
}

showPage("discover");
chatContexts.forEach(updateComposerState);
window.addEventListener("scroll", updateProfileMiniJump, { passive: true });
