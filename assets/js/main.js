/* Market Insight Studio — progressive enhancement */
(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};
  var email = String(config.email || "").trim();
  var formUrl = String(config.googleFormUrl || "").trim();
  var emailSubject = String(config.emailSubject || "Competitor Research Enquiry — Market Insight Studio").trim();
  var contactHref = email ? "mailto:" + email + "?subject=" + encodeURIComponent(emailSubject) : "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Enquiry message template ---------- */

  function buildEnquiryBody(values) {
    var value = function (key) {
      var raw = values && values[key] ? values[key] : "";
      return String(raw).trim();
    };
    var field = function (label, key) {
      var filled = value(key);
      return filled ? label + " " + filled : label;
    };

    return [
      "Hello Market Insight Studio,",
      "",
      "I would like to enquire about a Competitor Snapshot Report.",
      "",
      field("Name:", "name"),
      field("Email or contact method:", "contact"),
      field("Business name:", "businessName"),
      field("Business website or public profile:", "website"),
      field("Target market:", "market"),
      field("Industry:", "industry"),
      "Research question:",
      value("question"),
      "",
      "Known competitors (optional):",
      value("competitors"),
      "",
      "Please let me know the recommended scope, expected delivery timeframe, and payment arrangements before work begins.",
      "",
      "Thank you."
    ].join("\n");
  }

  var blankTemplate = (email ? "To: " + email + "\n" : "") + "Subject: " + emailSubject + "\n\n" + buildEnquiryBody({});

  /* ---------- Contact configuration ---------- */

  document.querySelectorAll("[data-contact-email]").forEach(function (link) {
    if (!email) {
      link.textContent = "Email address not configured";
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      return;
    }

    link.textContent = email;
    if (link.tagName === "A") {
      link.href = contactHref;
    }
  });

  var enquiryForm = document.getElementById("enquiry-form");
  if (enquiryForm) {
    if (email) {
      enquiryForm.action = contactHref;
    } else {
      enquiryForm.removeAttribute("action");
    }
  }

  var googleFormWrap = document.getElementById("google-form-wrap");
  if (googleFormWrap && formUrl) {
    var googleFormLink = document.createElement("a");
    googleFormLink.href = formUrl;
    googleFormLink.textContent = "Use the online enquiry form";
    googleFormLink.rel = "noopener";
    googleFormWrap.appendChild(document.createTextNode("Prefer a form? "));
    googleFormWrap.appendChild(googleFormLink);
    googleFormWrap.appendChild(document.createTextNode("."));
    googleFormWrap.hidden = false;
  }

  /* ---------- Mobile navigation ---------- */

  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.getElementById("site-nav");

  if (navToggle && siteNav) {
    var toggleLabel = navToggle.querySelector(".nav-toggle-text");

    var setNavOpen = function (open) {
      navToggle.setAttribute("aria-expanded", String(open));
      siteNav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (toggleLabel) {
        toggleLabel.textContent = open ? "Close" : "Menu";
      }
    };

    navToggle.addEventListener("click", function () {
      setNavOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setNavOpen(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 920 && navToggle.getAttribute("aria-expanded") === "true") {
        setNavOpen(false);
      }
    });
  }

  /* ---------- Header state and footer year ---------- */

  var header = document.querySelector(".site-header");
  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  document.querySelectorAll("[data-year]").forEach(function (year) {
    year.textContent = String(new Date().getFullYear());
  });

  /* ---------- Pricing buttons preselect the target market ---------- */

  document.querySelectorAll("[data-market]").forEach(function (button) {
    button.addEventListener("click", function () {
      var marketSelect = document.getElementById("market");
      if (marketSelect) {
        marketSelect.value = button.getAttribute("data-market");
      }
    });
  });

  /* ---------- Clipboard helpers ---------- */

  var status = document.getElementById("form-status");
  var statusTimer;

  function setStatus(message, isError) {
    if (!status) {
      return;
    }
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
    window.clearTimeout(statusTimer);
    if (message) {
      statusTimer = window.setTimeout(function () {
        status.textContent = "";
        status.classList.remove("is-error");
      }, 7000);
    }
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        // Fall through to the legacy copy path if the clipboard API is blocked.
      }
    }

    var helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-1000px";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();

    var copied = document.execCommand("copy");
    helper.remove();

    if (!copied) {
      throw new Error("Copy command failed");
    }
  }

  var copyTemplateButton = document.getElementById("copy-template");
  if (copyTemplateButton) {
    copyTemplateButton.addEventListener("click", async function () {
      try {
        await copyText(blankTemplate);
        setStatus("Blank template copied. Paste it into your email or notes.");
      } catch (error) {
        setStatus("Copy failed. Select the text in the brief field and copy it manually.", true);
      }
    });
  }

  /* ---------- Enquiry brief builder ---------- */

  var enquiryResult = document.getElementById("enquiry-result");
  var enquiryOutput = document.getElementById("enquiry-output");
  var enquiryEmail = document.getElementById("enquiry-email");
  var copyEnquiryButton = document.getElementById("copy-enquiry");

  if (enquiryForm && enquiryResult && enquiryOutput) {
    enquiryForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!enquiryForm.checkValidity()) {
        enquiryForm.reportValidity();
        return;
      }

      var data = new FormData(enquiryForm);
      var get = function (name) {
        return String(data.get(name) || "").trim();
      };

      var brief = buildEnquiryBody({
        name: get("name"),
        contact: get("contact"),
        website: get("business"),
        market: get("market"),
        question: get("question"),
        competitors: get("competitors")
      });

      enquiryOutput.value = brief;
      enquiryResult.hidden = false;

      if (email) {
        enquiryEmail.href = "mailto:" + email + "?subject=" + encodeURIComponent(emailSubject) + "&body=" + encodeURIComponent(brief);
        enquiryEmail.removeAttribute("aria-disabled");
        enquiryEmail.textContent = "Open in email app";
      } else {
        enquiryEmail.removeAttribute("href");
        enquiryEmail.setAttribute("aria-disabled", "true");
        enquiryEmail.textContent = "Email address not configured";
      }

      setStatus("Brief prepared. Nothing has been sent.");

      enquiryResult.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "start"
      });
      enquiryOutput.focus({ preventScroll: true });
    });
  }

  if (copyEnquiryButton && enquiryOutput) {
    copyEnquiryButton.addEventListener("click", async function () {
      if (!enquiryOutput.value) {
        setStatus("Prepare the brief first, then copy it.", true);
        return;
      }

      try {
        await copyText(enquiryOutput.value);
        setStatus("Brief copied to clipboard.");
      } catch (error) {
        setStatus("Copy failed. Select the brief text and copy it manually.", true);
      }
    });
  }

  /* ---------- Print the sample report ---------- */

  var printButton = document.getElementById("print-report");
  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }
})();
