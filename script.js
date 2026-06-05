const textarea = document.querySelector("textarea");
const callButton = document.querySelector(".call-button");
const switcherButtons = document.querySelectorAll("[data-variant]");

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

switcherButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyVariant(button.dataset.variant);
  });
});

textarea.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  textarea.value = "";
  fitTextarea();
});

callButton.addEventListener("click", () => {
  callButton.classList.toggle("active");
  callButton.querySelector("span").textContent = callButton.classList.contains("active")
    ? "Calling"
    : "Call";
});

function fitTextarea() {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

textarea.addEventListener("input", fitTextarea);

function applyVariant(key) {
  const variant = variants[key];

  switcherButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.variant === key);
  });

  textarea.placeholder = variant.placeholder;
}

applyVariant("current");
