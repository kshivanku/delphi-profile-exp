const textarea = document.querySelector("textarea");
const composer = document.querySelector(".inline-composer");
const callButton = document.querySelector(".call-button");
const sendButton = document.querySelector(".send-button");
const switcherButtons = document.querySelectorAll("[data-variant]");
const navViewButtons = document.querySelectorAll("[data-nav-view]");
const pageViews = document.querySelectorAll("[data-page-view]");
const interestPills = document.querySelectorAll("[data-topic]");
const starterCard = document.querySelector("[data-starter-card]");
const starterRows = document.querySelector("[data-starter-rows]");

const variants = {
  current: {
    placeholder: "How would you evaluate my city mobility idea?",
  },
  common: {
    placeholder: "Where do my interests overlap most with your work?",
  },
  trends: {
    placeholder: "What are people asking you about most right now?",
  },
};

const topicStarters = {
  cities: [
    "What makes a city feel trustworthy to the people who live there?",
    "How did Lyft change the way you think about urban behavior?",
    "Where do you see the biggest gap between city policy and daily life?",
    "What should journalists understand about transportation systems?",
    "How can mission-led companies improve cities without overpromising?",
  ],
  trust: [
    "How do mission-led companies earn public trust before they are widely understood?",
    "What did Lyft teach you about changing public behavior at scale?",
    "How should journalism and startups think differently about credibility?",
    "What makes a company’s story feel authentic instead of manufactured?",
    "How do you rebuild trust after a public mistake?",
  ],
  stories: [
    "What stories helped people understand Lyft in the early days?",
    "How do founders know which story about their company is actually true?",
    "What makes a public narrative move from interesting to useful?",
    "How should a mission-led company talk about impact without sounding polished?",
    "What do you wish more journalists asked startup leaders?",
  ],
  mobility: [
    "What transportation problem still feels under-covered?",
    "How should cities balance convenience, safety, and access?",
    "What did ride-sharing reveal about what people really need from transit?",
    "Where are mobility companies most likely to misunderstand local context?",
    "What would you look for in a new urban mobility idea today?",
  ],
  leadership: [
    "What leadership habits mattered most as Lyft scaled?",
    "How do you keep a mission useful when a company grows quickly?",
    "What should leaders communicate during uncertain public moments?",
    "How do you decide when to listen to customers, teams, or critics?",
    "What mistakes taught you the most about building at scale?",
  ],
};

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
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  textarea.value = "";
  fitTextarea();
  updateComposerState();
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
});

interestPills.forEach((button) => {
  button.addEventListener("click", () => {
    toggleStarterCard(button.dataset.topic);
  });
});

function fitTextarea() {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

textarea.addEventListener("input", () => {
  fitTextarea();
  updateComposerState();
});

function applyVariant(key) {
  const variant = variants[key];

  switcherButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.variant === key);
  });

  textarea.placeholder = variant.placeholder;
}

function toggleStarterCard(topic) {
  const selectedPill = [...interestPills].find((button) => button.dataset.topic === topic);
  const isOpenTopic = selectedPill?.classList.contains("active") && !starterCard.hidden;

  if (isOpenTopic) {
    closeStarterCard();
    return;
  }

  openStarterCard(topic);
}

function openStarterCard(topic) {
  const starters = topicStarters[topic];

  if (!starters) {
    return;
  }

  interestPills.forEach((button) => {
    button.classList.toggle("active", button.dataset.topic === topic);
  });

  starterRows.innerHTML = "";

  starters.forEach((starter) => {
    const row = document.createElement("button");
    row.className = "starter-row";
    row.type = "button";
    row.textContent = starter;
    row.addEventListener("click", () => {
      textarea.value = starter;
      fitTextarea();
      updateComposerState();
      textarea.focus();
      closeStarterCard();
    });
    starterRows.append(row);
  });

  starterCard.hidden = false;
}

function closeStarterCard() {
  starterCard.hidden = true;
  interestPills.forEach((button) => {
    button.classList.remove("active");
  });
}

function updateComposerState() {
  composer.classList.toggle("has-text", textarea.value.trim().length > 0);
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
