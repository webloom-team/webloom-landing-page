/* Webloom exploration — shared, dependency-free interaction layer.
   Every behaviour is opt-in via data attributes so each direction keeps its own visual language. */

(function () {
  "use strict";

  var whatsappNumber = (document.body.dataset.waNumber || "6285771797706").replace(/\D/g, "");
  var preferredPlan = "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function WhatsAppMessage(plan) {
    var base = "Halo Webloom, saya ingin berkonsultasi tentang website dan CRM untuk bisnis saya.";
    if (!plan) return base;
    return (
      "Halo Webloom, saya ingin berkonsultasi tentang paket " +
      plan +
      " untuk bisnis saya. Saya sudah melihat informasi paket di website dan ingin membahas kebutuhan kami."
    );
  }

  function WhatsAppLink(plan) {
    return "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(WhatsAppMessage(plan));
  }

  function hydrateWhatsApp() {
    document.querySelectorAll("a[data-wa]").forEach(function (link) {
      var plan = link.dataset.waDynamic !== undefined ? preferredPlan : link.dataset.waPlan || "";
      link.setAttribute("href", WhatsAppLink(plan));
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  }

  function initPlanPickers() {
    document.querySelectorAll("[data-consult]").forEach(function (scope) {
      var options = Array.prototype.slice.call(scope.querySelectorAll("[data-plan-option]"));
      var label = scope.querySelector("[data-plan-label]");
      var defaultLabel = label ? label.textContent : "";

      function apply(plan, announce) {
        preferredPlan = plan;
        options.forEach(function (option) {
          var active = option.dataset.plan === plan;
          option.setAttribute("aria-pressed", active ? "true" : "false");
          option.classList.toggle("is-active", active);
        });
        if (label) label.textContent = plan || defaultLabel;
        scope.querySelectorAll("a[data-wa-dynamic]").forEach(function (link) {
          link.setAttribute("href", WhatsAppLink(plan));
        });
        if (announce) hydrateWhatsApp();
      }

      options.forEach(function (option) {
        if (option.getAttribute("aria-pressed") === "true") {
          apply(option.dataset.plan, false);
        }
        option.addEventListener("click", function () {
          var next = preferredPlan === option.dataset.plan ? "" : option.dataset.plan;
          apply(next, true);
        });
      });
    });
  }

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-panel]");
    if (!toggle || !panel) return;

    var open = false;

    function setOpen(next) {
      open = next;
      toggle.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      var iconLabel = toggle.querySelector("[data-nav-label]");
      if (iconLabel) iconLabel.textContent = open ? "Tutup menu" : "Buka menu";
      if (open) {
        var first = panel.querySelector("a, button");
        if (first) {
          window.setTimeout(function () {
            first.focus({ preventScroll: true });
          }, 80);
        }
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!open);
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024 && open) setOpen(false);
    });
  }

  function initReveal() {
    var elements = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!elements.length) return;

    elements.forEach(function (element) {
      element.classList.add("reveal");
      var delay = element.dataset.revealDelay;
      if (delay) element.style.setProperty("--reveal-delay", delay + "ms");
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach(function (element) {
        element.classList.add("is-inview");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    elements.forEach(function (element) {
      observer.observe(element);
    });
  }

  function initActiveNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav-link]"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      if (id) byId[id] = link;
    });

    var sections = Object.keys(byId)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
          });
          var active = byId[entry.target.id];
          if (active) {
            active.classList.add("is-active");
            active.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
      var buttons = Array.prototype.slice.call(tabs.querySelectorAll("[data-tab]"));
      var panels = Array.prototype.slice.call(tabs.querySelectorAll("[data-tab-panel]"));
      if (!buttons.length) return;

      function activate(name, focus) {
        buttons.forEach(function (button) {
          var active = button.dataset.tab === name;
          button.setAttribute("aria-selected", active ? "true" : "false");
          button.setAttribute("tabindex", active ? "0" : "-1");
          button.classList.toggle("is-active", active);
          if (active && focus) button.focus();
        });
        panels.forEach(function (panel) {
          var active = panel.dataset.tabPanel === name;
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
      }

      buttons.forEach(function (button, index) {
        if (!button.id) button.id = "tab-" + Math.random().toString(36).slice(2, 8);
        var panel = panels.find(function (item) {
          return item.dataset.tabPanel === button.dataset.tab;
        });
        if (panel) {
          if (!panel.id) panel.id = "panel-" + Math.random().toString(36).slice(2, 8);
          button.setAttribute("aria-controls", panel.id);
          panel.setAttribute("aria-labelledby", button.id);
        }
        button.addEventListener("click", function () {
          activate(button.dataset.tab, false);
        });
        button.addEventListener("keydown", function (event) {
          var next = null;
          if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
          if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = buttons.length - 1;
          if (next !== null) {
            event.preventDefault();
            activate(buttons[next].dataset.tab, true);
          }
        });
      });

      var initial = buttons.find(function (button) {
        return button.getAttribute("aria-selected") === "true";
      }) || buttons[0];
      activate(initial.dataset.tab, false);
    });
  }

  function initLeadDemo() {
    document.querySelectorAll("[data-lead-demo]").forEach(function (demo) {
      var form = demo.querySelector("[data-demo-form]");
      var list = demo.querySelector("[data-demo-leads]");
      var status = demo.querySelector("[data-demo-status]");
      if (!form || !list || !status) return;

      var nameInput = form.querySelector('input[name="nama"]');
      var needInput = form.querySelector('select[name="kebutuhan"]');
      var defaultStatus = status.textContent.trim();
      var timer = null;

      function initials(name) {
        return name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(function (part) {
            return part.charAt(0).toUpperCase();
          })
          .join("");
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = (nameInput.value || "").trim();
        if (!name) {
          nameInput.focus();
          return;
        }
        var need = needInput ? needInput.value : "";

        var row = document.createElement("li");
        row.className = "demo-lead demo-lead--new";

        var avatar = document.createElement("span");
        avatar.className = "demo-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = initials(name);

        var copy = document.createElement("span");
        copy.className = "demo-lead-copy";
        var strong = document.createElement("strong");
        strong.textContent = name;
        var small = document.createElement("small");
        small.textContent = need;
        copy.appendChild(strong);
        copy.appendChild(small);

        var badge = document.createElement("span");
        badge.className = "badge badge-new";
        badge.textContent = "New";

        row.appendChild(avatar);
        row.appendChild(copy);
        row.appendChild(badge);
        list.insertBefore(row, list.firstChild);

        status.textContent = "Lead baru masuk ke daftar dengan status New.";
        form.reset();

        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          list.querySelectorAll(".demo-lead--new").forEach(function (item) {
            item.remove();
          });
          status.textContent = defaultStatus;
          timer = null;
        }, 12000);
      });
    });
  }

  function initProjectDialogs() {
    document.querySelectorAll("[data-project-dialog]").forEach(function (dialog) {
      var panels = Array.prototype.slice.call(dialog.querySelectorAll("[data-project-panel]"));
      var close = dialog.querySelector("[data-dialog-close]");
      var lastTrigger = null;

      document.querySelectorAll("[data-project-open]").forEach(function (trigger) {
        trigger.addEventListener("click", function () {
          var name = trigger.dataset.projectOpen;
          var panel = panels.find(function (item) {
            return item.dataset.projectPanel === name;
          });
          if (!panel) return;
          lastTrigger = trigger;
          panels.forEach(function (item) {
            item.hidden = item !== panel;
          });
          if (typeof dialog.showModal === "function") {
            dialog.showModal();
          } else {
            dialog.setAttribute("open", "");
          }
          document.body.classList.add("dialog-open");
          if (close) close.focus();
        });
      });

      function closeDialog() {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
        document.body.classList.remove("dialog-open");
        if (lastTrigger) lastTrigger.focus();
      }

      if (close) close.addEventListener("click", closeDialog);
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeDialog();
      });
      dialog.addEventListener("close", function () {
        document.body.classList.remove("dialog-open");
      });
      dialog.addEventListener("cancel", function () {
        document.body.classList.remove("dialog-open");
      });
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  function init() {
    hydrateWhatsApp();
    initPlanPickers();
    initHeader();
    initNav();
    initReveal();
    initActiveNav();
    initTabs();
    initLeadDemo();
    initProjectDialogs();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.WebloomUI = {
    refreshWhatsApp: hydrateWhatsApp
  };
})();
