(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------
     Loader
  ------------------------------------------------- */
  window.addEventListener("load", function () {
    var loader = document.getElementById("loader");
    if (loader) {
      setTimeout(function () {
        loader.classList.add("is-done");
      }, 250);
    }
  });

  /* -------------------------------------------------
     Footer year
  ------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------------------------------------
     Header: scrolled state + mobile nav
  ------------------------------------------------- */
  var header = document.getElementById("header");
  var hamburger = document.getElementById("hamburger");
  var mainNav = document.getElementById("mainNav");

  function onScrollHeader() {
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  if (hamburger && mainNav) {
    hamburger.addEventListener("click", function () {
      var open = mainNav.classList.toggle("is-open");
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* -------------------------------------------------
     Back to top
  ------------------------------------------------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) toTop.classList.add("is-visible");
      else toTop.classList.remove("is-visible");
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* -------------------------------------------------
     Scroll-reveal (IntersectionObserver)

     Variants (data-reveal): up/left/right/fade (generic content),
     eyebrow + curtain (heading pairs), rise (property/service cards,
     auto-staggered below), image (large feature photos), testi
     (testimonial block), pop (badges/CTAs, land after their parent).
  ------------------------------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");

  // Auto-stagger card grids: index within each shared parent, capped so a
  // grid with many items never leaves the last card waiting too long.
  function capStaggerByParent(selector, delayStep, maxDelay) {
    var counts = new Map();
    document.querySelectorAll(selector).forEach(function (el) {
      var parent = el.parentElement;
      var i = counts.get(parent) || 0;
      counts.set(parent, i + 1);
      if (el.hasAttribute("data-delay")) return; // explicit delay wins
      el.setAttribute("data-delay", String(Math.min(i * delayStep, maxDelay)));
    });
  }
  capStaggerByParent('[data-reveal="rise"]', 70, 200);

  // Badges/CTAs tagged "pop" land shortly after the nearest revealing
  // ancestor so they feel like they arrive once their card/photo has landed.
  document.querySelectorAll('[data-reveal="pop"]').forEach(function (el) {
    if (el.hasAttribute("data-delay")) return; // explicit delay wins
    var host = el.closest('[data-reveal="rise"], [data-reveal="image"], [data-reveal="left"], [data-reveal="right"], [data-reveal="up"]');
    var base = host ? parseInt(host.getAttribute("data-delay") || "0", 10) : 0;
    el.setAttribute("data-delay", String(base + 420));
  });

  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.getAttribute("data-delay") || 0;
          setTimeout(function () {
            el.classList.add("is-visible");
            // Free the compositing layer once the transition settles —
            // will-change should not be left on indefinitely.
            el.addEventListener("transitionend", function clear() {
              el.style.willChange = "auto";
              el.removeEventListener("transitionend", clear);
            });
          }, reduceMotion ? 0 : parseInt(delay, 10));
          io.unobserve(el);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px 150px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -------------------------------------------------
     Hero parallax (subtle, transform only)
  ------------------------------------------------- */
  var heroBg = document.getElementById("heroBg");
  if (heroBg && !reduceMotion) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var y = window.scrollY;
          if (y < window.innerHeight * 1.2) {
            heroBg.style.transform = "translateY(" + (y * 0.18) + "px) scale(1.08)";
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  var scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      var target = document.querySelector(".strip") || document.getElementById("ingatlanok");
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* -------------------------------------------------
     Search card tabs (visual only)
  ------------------------------------------------- */
  document.querySelectorAll(".search-card__tabs").forEach(function (tabs) {
    var buttons = tabs.querySelectorAll(".search-card__tab");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
      });
    });
  });

  /* -------------------------------------------------
     Property filter pills
  ------------------------------------------------- */
  var filterPills = document.querySelectorAll(".filters__pill");
  var cards = document.querySelectorAll("#listingsGrid .card");
  var emptyMsg = document.getElementById("listingsEmpty");

  filterPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      filterPills.forEach(function (p) { p.classList.remove("is-active"); });
      pill.classList.add("is-active");
      var filter = pill.getAttribute("data-filter");
      var visibleCount = 0;

      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var match = filter === "all" || tags.indexOf(filter) !== -1;
        if (match) {
          card.classList.remove("is-hidden");
          visibleCount++;
        } else {
          card.classList.add("is-hidden");
        }
      });

      if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
    });
  });

  /* -------------------------------------------------
     Favourite heart toggle
  ------------------------------------------------- */
  document.querySelectorAll(".card__like, .hero__float-card-like").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      btn.classList.toggle("is-liked");
    });
  });

  /* -------------------------------------------------
     Animated stat counters
  ------------------------------------------------- */
  var statEls = document.querySelectorAll(".stat__num");
  if (statEls.length) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (reduceMotion) {
        el.textContent = target;
        return;
      }
      var duration = 1200;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic, odometer feel
        el.textContent = Math.floor(eased * target);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3, rootMargin: "0px 0px 100px 0px" });
      statEls.forEach(function (el) { statIo.observe(el); });
    } else {
      statEls.forEach(animateCount);
    }
  }

  /* -------------------------------------------------
     Testimonials carousel
  ------------------------------------------------- */
  var track = document.getElementById("testiTrack");
  if (track) {
    var slides = track.children.length;
    var index = 0;
    var prevBtn = document.getElementById("testiPrev");
    var nextBtn = document.getElementById("testiNext");

    function goTo(i) {
      index = (i + slides) % slides;
      track.style.transition = reduceMotion ? "none" : "transform .6s cubic-bezier(.22,1,.36,1)";
      track.style.transform = "translateX(-" + (index * 100) + "%)";
    }
    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });

    var autoplay;
    function startAutoplay() {
      if (reduceMotion) return;
      autoplay = setInterval(function () { goTo(index + 1); }, 6500);
    }
    function stopAutoplay() { clearInterval(autoplay); }
    startAutoplay();
    track.closest(".testimonials").addEventListener("mouseenter", stopAutoplay);
    track.closest(".testimonials").addEventListener("mouseleave", startAutoplay);
  }

  /* -------------------------------------------------
     FAQ accordion
  ------------------------------------------------- */
  document.querySelectorAll(".faq__item").forEach(function (item) {
    var q = item.querySelector(".faq__q");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      item.closest(".faq").querySelectorAll(".faq__item").forEach(function (i) {
        i.classList.remove("is-open");
        i.querySelector(".faq__q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

})();
