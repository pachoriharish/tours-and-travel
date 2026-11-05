/* =====================================================================
   GRACIOUS WORLD - BEHAVIOUR FILE (JavaScript)
   ---------------------------------------------------------------------
   The HTML files hold all the content (text, prices, photos).
   The CSS file holds the design.
   This file only makes things MOVE and RESPOND:

     1. Sliders (home banner and testimonials)
     2. Mobile menu button
     3. Menu colour change while scrolling
     4. Popup forms and sending them by email
     5. Read More / Read Less on package cards
     6. Animations when things scroll into view
   ===================================================================== */

/* ---------------------------------------------------------------------
   SMALL HELPER TOOLS
   --------------------------------------------------------------------- */

// Finds the first element on the page that matches the selector
function find(selector, inside = document) {
  return inside.querySelector(selector);
}

// Finds every element on the page that matches the selector
function findAll(selector, inside = document) {
  return [...inside.querySelectorAll(selector)];
}

// Fills in the current year in the footer
findAll(".current-year").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

/* ---------------------------------------------------------------------
   1. SLIDERS: automatic, swipe, arrows and dots
   The slider always moves FORWARD. After the last slide, a copy of the
   first slide slides in from the right, then the row quietly jumps back
   to the real first slide without anyone noticing. So the slider never
   rewinds backwards through all the slides.
   --------------------------------------------------------------------- */
function startSlider(slider, secondsPerSlide, pauseWhenMouseIsOver) {
  const track = find(".slider-track", slider);
  const dotsBox = find(".slider-dots", slider);
  const realSlides = [...track.children];
  const total = realSlides.length;

  // Add a copy of the first slide at the end of the row
  const copyOfFirst = realSlides[0].cloneNode(true);
  copyOfFirst.setAttribute("aria-hidden", "true");
  track.appendChild(copyOfFirst);
  const allSlides = [...track.children];

  // position: 0 = first slide ... total - 1 = last slide, total = the copy of the first slide
  let position = 0;
  let timer = null;
  let swipeStartX = null;

  // One small dot for each real slide
  dotsBox.innerHTML = realSlides
    .map((slide, index) => `<button aria-label="Slide ${index + 1}"></button>`)
    .join("");
  const dots = findAll("button", dotsBox);

  // Highlights the visible slide and its dot
  function updateMarkers() {
    const visibleIndex = position % total;

    allSlides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index % total === visibleIndex);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === visibleIndex);
    });
  }

  // Moves the row to a slide. animate = false makes an instant, invisible jump.
  function moveTo(newPosition, animate) {
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translateX(-${newPosition * 100}%)`;
    position = newPosition;
    updateMarkers();

    if (!animate) {
      void track.offsetHeight; // makes the browser apply the jump right now
      track.style.transition = ""; // animations work normally again
    }
  }

  // If the copy of the first slide is showing, jump to the real first slide
  function snapBackToStart() {
    if (position === total) {
      moveTo(0, false);
    }
  }

  function goNext() {
    snapBackToStart();
    moveTo(position + 1, true);
  }

  function goPrevious() {
    if (position === 0) {
      moveTo(total, false); // jump (unseen) to the copy of the first slide
    }
    moveTo(position - 1, true); // then slide back one step
  }

  function goToSlide(index) {
    snapBackToStart();
    moveTo(index, true);
  }

  // When the slide into the copy finishes, jump to the real first slide
  track.addEventListener("transitionend", (event) => {
    if (event.target === track) {
      snapBackToStart();
    }
  });

  // Automatic sliding
  function stopTimer() {
    clearInterval(timer);
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(goNext, secondsPerSlide * 1000);
  }

  // Dots and arrows
  dots.forEach((dot, index) => {
    dot.onclick = () => goToSlide(index);
  });
  find(".previous", slider).onclick = goPrevious;
  find(".next", slider).onclick = goNext;

  // Swipe with a finger, or drag with the mouse
  slider.addEventListener("pointerdown", (event) => {
    swipeStartX = event.clientX;
  });

  slider.addEventListener("pointerup", (event) => {
    if (swipeStartX !== null && Math.abs(event.clientX - swipeStartX) > 40) {
      if (event.clientX < swipeStartX) {
        goNext();
      } else {
        goPrevious();
      }
    }
    swipeStartX = null;
  });

  // The testimonials pause while the mouse is on them
  if (pauseWhenMouseIsOver) {
    slider.addEventListener("mouseenter", stopTimer);
    slider.addEventListener("mouseleave", startTimer);
  }

  updateMarkers();
  startTimer();
}

// Start every slider on the page (5 seconds per slide)
findAll(".slider").forEach((slider) => {
  const isTestimonialSlider = slider.classList.contains("testimonial-slider");
  startSlider(slider, 5, isTestimonialSlider);
});

/* ---------------------------------------------------------------------
   2. MOBILE MENU BUTTON
   --------------------------------------------------------------------- */
const menu = find("#menu");
const menuButton = find("#menu-toggle");

// Opens or closes the menu (and tells screen readers which one it is)
function setMenuOpen(isOpen) {
  menu.classList.toggle("is-open", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen);
}

menuButton.onclick = () => {
  setMenuOpen(!menu.classList.contains("is-open"));
};

// Close the menu after a link is tapped
findAll("#menu a").forEach((link) => {
  link.onclick = () => setMenuOpen(false);
});

/* ---------------------------------------------------------------------
   3. MENU COLOUR CHANGE WHILE SCROLLING
   Transparent over the big photo, solid ivory after scrolling.
   The menu link of the section you are viewing turns terracotta.
   --------------------------------------------------------------------- */
const header = find("#site-header");
const pageHasBanner = find(".hero") !== null; // privacy and terms pages have no banner

// Each in-page menu link together with the section it points to (looked up once, not on every scroll)
const sectionLinks = findAll('#menu a[href^="#"]')
  .map((link) => ({ link: link, section: find(link.hash) }))
  .filter((item) => item.section);

function updateHeader() {
  // Solid menu after scrolling (and always solid on pages without a banner)
  header.classList.toggle("is-solid", !pageHasBanner || window.scrollY > 40);

  // The last section whose top has passed the menu is the one we are in
  let currentLink = null;

  sectionLinks.forEach((item) => {
    if (item.section.getBoundingClientRect().top <= 120) {
      currentLink = item.link;
    }
  });

  // At the very bottom of the page, highlight the last link
  const atPageBottom =
    window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
  if (atPageBottom && sectionLinks.length > 0) {
    currentLink = sectionLinks[sectionLinks.length - 1].link;
  }

  sectionLinks.forEach((item) => {
    item.link.classList.toggle("is-current", item.link === currentLink);
  });
}

// Scrolling fires many events. We only do the work once per screen refresh.
let headerUpdateWaiting = false;

window.addEventListener(
  "scroll",
  () => {
    if (headerUpdateWaiting) {
      return;
    }
    headerUpdateWaiting = true;
    requestAnimationFrame(() => {
      updateHeader();
      headerUpdateWaiting = false;
    });
  },
  { passive: true },
);

updateHeader();

/* ---------------------------------------------------------------------
   4. POPUP FORMS: open, close and send by email
   --------------------------------------------------------------------- */

let openPopup = null;

// ==========================================
// EMAILJS CONFIGURATION
// ==========================================

const EMAIL_SETTINGS = {
  publicKey: "uM5gfmkNOnnI80XDq",
  serviceId: "service_55cxq0b",

  templates: {
    "enquiry-popup": "template_xx8jm33",
    "plan-popup": "template_81pf8lh",
  },
};

// ==========================================
// POPUP CLOSE FUNCTION
// ==========================================

function closePopup() {
  if (!openPopup) return;

  openPopup.classList.remove("is-open");
  document.body.style.overflow = "";
  openPopup = null;
}

// ==========================================
// OPEN AND CLOSE POPUPS
// ==========================================

document.addEventListener("click", (event) => {
  // Open popup
  const opener = event.target.closest("[data-open]");

  if (opener) {
    event.preventDefault();

    const popupId = opener.dataset.open;
    const popup = document.getElementById(popupId);

    if (!popup) {
      console.error("Popup not found:", popupId);
      return;
    }

    // Close previously opened popup
    closePopup();

    openPopup = popup;

    const form = popup.querySelector("form");

    form.reset();

    const message = form.querySelector(".popup-message");
    message.textContent = "";
    message.className = "popup-message";

    // Fill package details automatically
    if (opener.dataset.package) {
      const headingInput = form.querySelector('[name="heading"]');
      const messageInput = form.querySelector('[name="message"]');

      if (headingInput) {
        headingInput.value = opener.dataset.package;
        headingInput.readOnly = true;
      }

      if (messageInput) {
        messageInput.value = `Hi, I'm interested in ${opener.dataset.package}. Please share the itinerary and best price.`;
      }
    }

    popup.classList.add("is-open");
    document.body.style.overflow = "hidden";

    return;
  }

  // Close popup using backdrop or close button
  if (
    event.target.classList.contains("popup") ||
    event.target.closest(".popup-close")
  ) {
    closePopup();
  }
});

// Close popup using Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePopup();
  }
});

// ==========================================
// EMAILJS FORM SUBMISSION
// ==========================================

document.querySelectorAll(".popup-box").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const popup = form.closest(".popup");
    const popupId = popup.id;

    const message = form.querySelector(".popup-message");
    const submitButton = form.querySelector(".popup-submit");

    // Find the correct template
    const templateId = EMAIL_SETTINGS.templates[popupId];

    if (!templateId) {
      message.className = "popup-message error";
      message.textContent = "Email template not configured.";
      return;
    }

    // Check EmailJS configuration
    if (
      typeof emailjs === "undefined" ||
      !EMAIL_SETTINGS.publicKey ||
      !EMAIL_SETTINGS.serviceId ||
      !templateId ||
      EMAIL_SETTINGS.publicKey.startsWith("YOUR") ||
      EMAIL_SETTINGS.serviceId.startsWith("YOUR") ||
      templateId.startsWith("YOUR")
    ) {
      message.className = "popup-message error";
      message.textContent = "Email service is not configured.";
      console.error("Check your EmailJS credentials.");
      return;
    }

    // Collect fields from the submitted form
    const details = Object.fromEntries(new FormData(form).entries());

    // Add additional information
    details.form_type =
      popupId === "plan-popup" ? "Plan a Trip" : "Package Enquiry";

    details.page = window.location.href;

    // Disable button while sending
    submitButton.disabled = true;
    message.className = "popup-message";
    message.textContent = "Sending your enquiry...";

    try {
      // Send email using the correct template
      await emailjs.send(EMAIL_SETTINGS.serviceId, templateId, details, {
        publicKey: EMAIL_SETTINGS.publicKey,
      });

      message.className = "popup-message success";
      message.textContent =
        "Thank you! Your enquiry has been sent successfully.";

      // Reset submitted form
      form.reset();

      // Close only the submitted popup
      setTimeout(() => {
        if (openPopup === popup) {
          closePopup();
        }
      }, 2200);
    } catch (error) {
      console.error("EmailJS submission error:", error);

      message.className = "popup-message error";
      message.textContent =
        "Unable to send your enquiry. Please try again or contact us.";
    } finally {
      submitButton.disabled = false;
    }
  });
});

/* ---------------------------------------------------------------------
   5. READ MORE / READ LESS ON PACKAGE CARDS
   Shows or hides the hidden itinerary box inside the same card only.
   The gold line inside the itinerary grows as you scroll through it.
   --------------------------------------------------------------------- */
function updateTimelineLine(details) {
  const list = find("ol", details);
  if (!list) {
    return;
  }

  const seenFraction =
    (details.scrollTop + details.clientHeight - list.offsetTop) /
    list.offsetHeight;
  const progress = Math.max(0, Math.min(1, seenFraction));
  list.style.setProperty("--progress", progress);
}

document.addEventListener("click", (event) => {
  const readMoreButton = event.target.closest(".read-more");
  if (!readMoreButton) {
    return;
  }

  const details = find(".more-details", readMoreButton.parentNode);
  const isNowOpen = details.classList.toggle("is-open");

  // Change the button text, and turn its little arrow upside down
  readMoreButton.classList.toggle("is-open", isNowOpen);
  find(".read-more-text", readMoreButton).textContent = isNowOpen
    ? "Read Less"
    : "Read More";
  updateTimelineLine(details);
});

// Scroll events do not bubble, so we listen in "capture" mode
document.addEventListener(
  "scroll",
  (event) => {
    const box = event.target;
    if (box.classList && box.classList.contains("more-details")) {
      updateTimelineLine(box);
    }
  },
  true,
);

/* ---------------------------------------------------------------------
   6. ANIMATIONS WHEN THINGS SCROLL INTO VIEW
   --------------------------------------------------------------------- */

// Mark the things that should fade in. Cards and boxes appear one after another.
findAll(".card-grid, .why-grid, .stats-grid").forEach((group) => {
  [...group.children].forEach((item, index) => {
    item.classList.add("reveal");
    item.style.transitionDelay = (index % 3) * 120 + "ms";
  });
});

findAll(
  ".section-heading, .about-grid > div:last-child, footer, .contact-grid > div",
).forEach((element) => {
  element.classList.add("reveal");
});

findAll(".testimonial-slider").forEach((element) => {
  element.classList.add("reveal", "from-right");
});

// Counts a number up from 0 to its final value
function countUp(element) {
  const target = Number(element.dataset.countTo);
  const suffix = element.dataset.countSuffix || "";
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - startTime) / 1600);
    const eased = 1 - Math.pow(1 - progress, 3); // starts fast, ends gently
    element.textContent = Math.round(target * eased) + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// Plays the animation once, then removes the animation classes so
// the hover effects work normally afterwards
function revealElement(element) {
  element.classList.add("is-visible");

  const counter = find("[data-count-to]", element);
  if (counter) {
    countUp(counter);
  }

  setTimeout(() => {
    element.classList.remove(
      "reveal",
      "from-right",
      "reveal-from-left",
      "is-visible",
    );
    element.style.transitionDelay = "";
  }, 1800);
}

const animatedItems = findAll(".reveal, .reveal-from-left");

if ("IntersectionObserver" in window) {
  // A photo that is fully hidden (clipped) before it animates in cannot be
  // "seen" by the observer. So for those photos we watch their parent box
  // instead, and reveal the photo when that box comes into view.
  const elementToReveal = new Map();

  // Reveal each item the first time it comes into view
  const watcher = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          watcher.unobserve(entry.target);
          revealElement(elementToReveal.get(entry.target));
        }
      });
    },
    { threshold: 0.12 },
  );

  animatedItems.forEach((element) => {
    const watchedBox = element.classList.contains("reveal-from-left")
      ? element.parentElement
      : element;

    elementToReveal.set(watchedBox, element);
    watcher.observe(watchedBox);
  });
} else {
  // Very old browsers: just show everything
  animatedItems.forEach(revealElement);
}
