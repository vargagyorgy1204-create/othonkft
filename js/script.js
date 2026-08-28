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
     Custom-styled select dropdowns (Helyszín / Ingatlantípus /
     Árkategória). Trigger button + role="listbox" panel, synced to a
     hidden native <select> for fallback. Mouse, keyboard (Enter/Space
     to open, Up/Down to move, Enter to pick, Escape to close) and
     click-outside are all supported.
  ------------------------------------------------- */
  var openCustomSelect = null;

  function closeCustomSelect(instance, focusTrigger) {
    if (!instance || !instance.root.classList.contains("is-open")) return;
    instance.root.classList.remove("is-open");
    instance.trigger.setAttribute("aria-expanded", "false");
    instance.trigger.removeAttribute("aria-activedescendant");
    if (openCustomSelect === instance) openCustomSelect = null;
    if (focusTrigger) instance.trigger.focus();
  }

  function setActiveOption(instance, index) {
    instance.options.forEach(function (opt, i) {
      opt.classList.toggle("is-active", i === index);
    });
    instance.activeIndex = index;
    instance.trigger.setAttribute("aria-activedescendant", instance.options[index].id);
    instance.options[index].scrollIntoView({ block: "nearest" });
  }

  function chooseOption(instance, index, opts) {
    opts = opts || {};
    var option = instance.options[index];
    instance.options.forEach(function (opt) {
      opt.classList.remove("is-selected");
      opt.setAttribute("aria-selected", "false");
    });
    option.classList.add("is-selected");
    option.setAttribute("aria-selected", "true");
    instance.valueEl.textContent = option.textContent;
    if (instance.native) instance.native.selectedIndex = index;
    instance.selectedIndex = index;
    if (!opts.silent) closeCustomSelect(instance, true);
  }

  function initCustomSelects() {
    document.querySelectorAll("[data-custom-select]").forEach(function (root) {
      var trigger = root.querySelector(".custom-select__trigger");
      var panel = root.querySelector(".custom-select__panel");
      var valueEl = root.querySelector(".custom-select__value");
      var native = root.querySelector(".custom-select__native");
      var options = Array.prototype.slice.call(panel.querySelectorAll(".custom-select__option"));
      if (!trigger || !panel || !options.length) return;

      var instance = {
        root: root, trigger: trigger, panel: panel, valueEl: valueEl,
        native: native, options: options, activeIndex: 0, selectedIndex: 0
      };
      options.forEach(function (opt, i) { if (opt.classList.contains("is-selected")) instance.selectedIndex = i; });

      function open() {
        if (openCustomSelect && openCustomSelect !== instance) closeCustomSelect(openCustomSelect, false);
        root.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        setActiveOption(instance, instance.selectedIndex);
        openCustomSelect = instance;
      }

      trigger.addEventListener("click", function () {
        root.classList.contains("is-open") ? closeCustomSelect(instance, false) : open();
      });

      trigger.addEventListener("keydown", function (e) {
        if (["ArrowDown", "ArrowUp", "Enter", " ", "Spacebar"].indexOf(e.key) !== -1) e.preventDefault();
        if (!root.classList.contains("is-open")) {
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") open();
          return;
        }
        if (e.key === "ArrowDown") setActiveOption(instance, Math.min(instance.activeIndex + 1, options.length - 1));
        else if (e.key === "ArrowUp") setActiveOption(instance, Math.max(instance.activeIndex - 1, 0));
        else if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") chooseOption(instance, instance.activeIndex);
        else if (e.key === "Escape") closeCustomSelect(instance, true);
        else if (e.key === "Tab") closeCustomSelect(instance, false);
      });

      options.forEach(function (opt, i) {
        opt.addEventListener("click", function () { chooseOption(instance, i); });
        opt.addEventListener("mouseenter", function () { setActiveOption(instance, i); });
      });

      root.__customSelectInstance = instance;
    });

    document.addEventListener("click", function (e) {
      if (openCustomSelect && !openCustomSelect.root.contains(e.target)) {
        closeCustomSelect(openCustomSelect, false);
      }
    });
    document.addEventListener("focusin", function (e) {
      if (openCustomSelect && !openCustomSelect.root.contains(e.target)) {
        closeCustomSelect(openCustomSelect, false);
      }
    });
  }
  initCustomSelects();

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
      if (listings) listings.scrollTo({ left: 0, behavior: "auto" });
    });
  });

  /* -------------------------------------------------
     Listings carousel
  ------------------------------------------------- */
  var listings = document.getElementById("listingsGrid");
  var previousListings = document.querySelector("[data-listings-prev]");
  var nextListings = document.querySelector("[data-listings-next]");
  if (listings && previousListings && nextListings) {
    function moveListings(direction) {
      var firstVisibleCard = listings.querySelector(".card:not(.is-hidden)");
      var maxScroll = listings.scrollWidth - listings.clientWidth;
      var step = firstVisibleCard ? firstVisibleCard.getBoundingClientRect().width + 28 : listings.clientWidth;
      if (direction > 0 && listings.scrollLeft >= maxScroll - 2) {
        listings.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      if (direction < 0 && listings.scrollLeft <= 2) {
        listings.scrollTo({ left: maxScroll, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      listings.scrollBy({ left: direction * step, behavior: reduceMotion ? "auto" : "smooth" });
    }
    previousListings.addEventListener("click", function () { moveListings(-1); });
    nextListings.addEventListener("click", function () { moveListings(1); });
  }

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
    var avatarBtns = document.querySelectorAll(".avatars__item[data-index]");
    var dotBtns = document.querySelectorAll("#testiDots button[data-index]");

    function goTo(i, opts) {
      opts = opts || {};
      index = (i + slides) % slides;
      Array.prototype.forEach.call(track.children, function (slide, i2) {
        slide.classList.toggle("is-active", i2 === index);
      });
      avatarBtns.forEach(function (btn) {
        btn.classList.toggle("avatars__item--active", Number(btn.dataset.index) === index);
      });
      dotBtns.forEach(function (btn) {
        btn.classList.toggle("is-active", Number(btn.dataset.index) === index);
      });
    }
    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });
    avatarBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { goTo(Number(btn.dataset.index)); });
    });
    dotBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { goTo(Number(btn.dataset.index)); });
    });
    /* Autoplay removed per request - testimonials now only change via
       explicit prev/next/dot/avatar clicks, never on their own. */
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
