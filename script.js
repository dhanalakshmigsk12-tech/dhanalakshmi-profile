const header = document.querySelector(".site-header");
const progress = document.getElementById("scroll-progress");
const nav = document.getElementById("site-nav");
const menuToggle = document.getElementById("menu-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateScrollState() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progress.style.width = `${amount}%`;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.classList.toggle("is-open");
  nav.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -35px 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const ticker = document.querySelector(".ticker-track");
if (ticker) {
  [...ticker.children].forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    ticker.append(clone);
  });
}

const filters = document.querySelectorAll(".filter-button");
const workCards = document.querySelectorAll(".work-card");
filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    const category = filter.dataset.filter;
    filters.forEach((button) => {
      const isActive = button === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    workCards.forEach((card) => {
      const show = category === "all" || card.dataset.category === category;
      card.classList.toggle("is-hidden", !show);
    });
  });
});

const showcase = document.querySelector("[data-carousel]");
if (showcase) {
  const slides = [...showcase.querySelectorAll(".project-slide")];
  const dotsHost = showcase.querySelector(".carousel-dots");
  const previous = showcase.querySelector(".carousel-prev");
  const next = showcase.querySelector(".carousel-next");
  let active = 0;
  let timer;
  let paused = false;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show project image ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index, true));
    dotsHost.append(dot);
    return dot;
  });

  function showSlide(index, resetTimer = false) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === active;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === active;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
    if (resetTimer) restartTimer();
  }

  function stopTimer() {
    window.clearInterval(timer);
    timer = undefined;
  }

  function startTimer() {
    if (!reducedMotion.matches && !paused && !document.hidden && timer === undefined) {
      timer = window.setInterval(() => showSlide(active + 1), 4800);
    }
  }

  function restartTimer() {
    stopTimer();
    startTimer();
  }

  previous.addEventListener("click", () => showSlide(active - 1, true));
  next.addEventListener("click", () => showSlide(active + 1, true));
  showcase.addEventListener("mouseenter", () => { paused = true; stopTimer(); });
  showcase.addEventListener("mouseleave", () => { paused = false; startTimer(); });
  showcase.addEventListener("focusin", () => { paused = true; stopTimer(); });
  showcase.addEventListener("focusout", (event) => {
    if (!showcase.contains(event.relatedTarget)) { paused = false; startTimer(); }
  });
  document.addEventListener("visibilitychange", () => document.hidden ? stopTimer() : startTimer());
  showSlide(0);
  startTimer();
}

document.getElementById("year").textContent = new Date().getFullYear();

const feedbackForm = document.getElementById("feedback-form");
const feedbackStatus = document.getElementById("feedback-status");
const publicFeedbackList = document.getElementById("public-feedback-list");
const feedbackClient = window.supabase?.createClient
  ? window.supabase.createClient(
      "https://ckjcbbikcjuprchkhazu.supabase.co",
      "sb_publishable_Y9DfcvpoSKiurc8dh0tGIQ_2UqqfGST"
    )
  : null;

function showFeedbackStatus(message, state = "") {
  feedbackStatus.textContent = message;
  if (state) feedbackStatus.dataset.state = state;
  else delete feedbackStatus.dataset.state;
}

async function loadPublicFeedback() {
  if (!publicFeedbackList) return;
  if (!feedbackClient) {
    publicFeedbackList.innerHTML = '<p class="visitor-note-empty">Feedback is temporarily unavailable.</p>';
    return;
  }

  const { data, error } = await feedbackClient
    .from("portfolio_feedback")
    .select("name, rating, message, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    publicFeedbackList.innerHTML = '<p class="visitor-note-empty">Feedback could not be loaded right now.</p>';
    return;
  }
  if (!data?.length) {
    publicFeedbackList.innerHTML = '<p class="visitor-note-empty">No feedback yet. Be the first to leave a note.</p>';
    return;
  }

  const cards = data.map((review) => {
    const card = document.createElement("article");
    card.className = "visitor-note";
    const header = document.createElement("div");
    header.className = "visitor-note-header";
    const name = document.createElement("strong");
    name.textContent = review.name;
    header.append(name);
    if (review.created_at) {
      const date = document.createElement("time");
      date.dateTime = review.created_at;
      date.textContent = new Date(review.created_at).toLocaleDateString();
      header.append(date);
    }
    card.append(header);
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const stars = document.createElement("p");
    stars.className = "visitor-note-rating";
    stars.setAttribute("aria-label", `${rating} out of 5 stars`);
    stars.textContent = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
    card.append(stars);
    const message = document.createElement("p");
    message.className = "visitor-note-message";
    message.textContent = review.message;
    card.append(message);
    return card;
  });
  publicFeedbackList.replaceChildren(...cards);
}

loadPublicFeedback();

feedbackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!feedbackClient) {
    showFeedbackStatus("Feedback is temporarily unavailable. Please try again later.", "error");
    return;
  }

  const formData = new FormData(feedbackForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const rating = Number(formData.get("rating"));
  const message = String(formData.get("message") || "").trim();
  const submitButton = feedbackForm.querySelector('button[type="submit"]');
  if (!name || !email || !Number.isInteger(rating) || rating < 1 || rating > 5 || !message) {
    showFeedbackStatus("Please complete each field and choose a rating.", "error");
    return;
  }

  submitButton.disabled = true;
  showFeedbackStatus("Sending your feedback…");
  try {
    const { error } = await feedbackClient
      .from("portfolio_feedback")
      .insert({ name, email, rating, message });
    if (error) throw error;
    feedbackForm.reset();
    showFeedbackStatus("Thank you! Your feedback has been saved.", "success");
    await loadPublicFeedback();
  } catch (error) {
    showFeedbackStatus("We couldn’t save your feedback. Please try again.", "error");
    console.error("Feedback submission failed:", error.message);
  } finally {
    submitButton.disabled = false;
  }
});
