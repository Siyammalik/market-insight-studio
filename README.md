# Market Insight Studio

A fast, dependency-free marketing website for **Market Insight Studio**, an AI-assisted competitor research service for small businesses.

The site is a sales tool: it explains the Competitor Snapshot Report, shows an illustrative sample, states pilot pricing honestly, and gives visitors a real way to prepare and send an enquiry. It does not pretend to be a SaaS product, a dashboard, or a business with existing clients.

---

## What is included

- Premium minimalist, responsive one-page website.
- Separate illustrative sample report with a print / save-as-PDF action.
- Services, process, pricing, about/trust, FAQ, and contact sections.
- Mobile navigation with keyboard support and a no-JavaScript fallback that keeps the links visible.
- Real enquiry flow: a brief builder that prepares an email or a copyable brief. Nothing is sent or stored by the site.
- The form collects only name, contact method, business profile, target market, research question, and optional competitors. Pilot pricing is derived from the selected target market.
- Optional Google Form link, configured in one place.
- Custom 404 page.
- Favicon, Apple touch icon, Open Graph/Twitter metadata, and a generated social image.
- No frameworks, no build step, no external fonts, no analytics, no cookies, no backend, no payment gateway.
- A dependency-free site check script.

---

## Stack and rationale

Plain **HTML, CSS, and JavaScript**. The project was empty, so a static site is the simplest option that can be hosted for free. It works on GitHub Pages, Netlify, Cloudflare Pages, or any static file host without a build step.

All paths are relative, so the site works from a domain root or a project subpath such as `https://username.github.io/market-insight-studio/`.

---

## Project structure

```text
market-insight-studio/
├── index.html                  # Main marketing page
├── sample-report.html          # Illustrative sample report
├── 404.html                    # Custom not-found page
├── assets/
│   ├── css/styles.css          # All site styles, responsive and print rules
│   ├── js/config.js            # Contact configuration — edit this first
│   ├── js/main.js              # Navigation, brief builder, copy actions
│   └── img/
│       ├── favicon.svg
│       ├── apple-touch-icon.png
│       └── og-cover.png
├── scripts/check-site.mjs      # Link, metadata, and safety checks
├── robots.txt
├── .nojekyll                   # Keeps GitHub Pages from running Jekyll
└── README.md
```

---

## Prerequisites

- A modern browser.
- **Python 3** for the recommended local preview server, or any static file server.
- **Node.js 18+** only if you want to run the site check script. The website itself has no Node dependency.

No package installation is required.

---

## Run the website locally

From the project folder:

```bash
python -m http.server 4173
```

Open <http://localhost:4173>.

You can also open `index.html` directly, but a local server is closer to production and avoids browser restrictions on clipboard access.

If Python is unavailable, any static server works. For example, with Node installed:

```bash
npx serve .
```

`npx` may download a package; the Python option needs no download.

---

## Test the website

Run the dependency-free checks:

```bash
node scripts/check-site.mjs
```

The script checks:

- Required metadata on every page.
- Duplicate IDs and broken in-page anchors.
- Internal links and local asset paths.
- ARIA references and form label targets.
- Explicit button types and image alt text.
- Local Open Graph/Twitter image paths.
- Common secret patterns.
- External font and analytics references.
- Placeholder email warnings in the configuration and HTML fallbacks.

Expected result before launch:

```text
Result: PASS
```

There will be warnings while the placeholder email remains in `assets/js/config.js` and in the no-JavaScript fallbacks in `index.html` and `sample-report.html`. The `TODO` marker in `config.js` also produces a warning. These warnings are intentional until you configure the site.

### Manual QA checklist

- [ ] Open every page at mobile (360 px), tablet (768 px), and desktop (1440 px) widths.
- [ ] Check there is no horizontal page overflow.
- [ ] Open the mobile menu; check Escape closes it and focus returns to the Menu button.
- [ ] Tab through the page and confirm every interactive element has a visible focus ring.
- [ ] Submit the enquiry form with missing fields; confirm the browser reports them.
- [ ] Fill the form, choose a pricing card, and confirm the target market select is preselected.
- [ ] Prepare an enquiry; confirm the brief appears and no success message claims it was sent.
- [ ] Use “Copy blank template” and “Copy brief”; confirm the status text is honest.
- [ ] Open the email link and confirm it addresses the configured email.
- [ ] Open the sample report and use “Print / save as PDF”; confirm the fictional-example banner is visible in print.
- [ ] Check the 404 page by visiting a nonexistent path on the deployed host.
- [ ] Confirm no browser console errors.

---

## Configure before launch

### 1. Business email (configured)

The confirmed business email is set in `assets/js/config.js`:

```js
window.SITE_CONFIG = {
  email: "marketinsightstudio.bd@gmail.com",
  googleFormUrl: "",
  emailSubject: "Competitor Research Enquiry — Market Insight Studio"
};
```

This value drives every JavaScript-updated contact link, the footer email, and the generated enquiry email (recipient and subject line included). The raw `mailto:` fallbacks for visitors without JavaScript are written directly in the HTML:

- `index.html`: form action, "Open in email app" button, contact card, footer.
- `sample-report.html`: footer.

If the email ever changes, update `config.js` and search both HTML files for the old address so the no-JavaScript fallbacks stay in sync. The `mailto:` links carry the encoded subject `Competitor Research Enquiry — Market Insight Studio`.

### 2. Optional: Google Form

Create a Google Form with these fields:

- Name
- Email or contact method
- Business website or public profile
- Target market
- Research question
- Known competitors (optional)

Then paste its public URL into `googleFormUrl` in `assets/js/config.js`. The link is hidden while the value is empty.

If you use a Google Form, remember that responses are stored by Google under Google’s terms. Add a short privacy note if your use requires one.

### 3. Social sharing image

`og-cover.png` is generated at 1200 × 630 and referenced with a relative path. Some social platforms require an absolute URL. After you know your domain, update the `og:image` and `twitter:image` values in `index.html` and `sample-report.html` to the full URL, for example:

```html
<meta property="og:image" content="https://your-domain.example/assets/img/og-cover.png">
```

### 4. Business details to review

- Confirm the two pilot prices: **৳1,500 BDT** and **$25 USD**.
- Confirm the deliverables and the “not included” list.
- Confirm you can deliver the about/trust claims: public sources only, no private competitor data, human verification of every factual claim, and no guaranteed business outcomes.
- Confirm the wording about delivery timing. The site deliberately says timing is agreed in the brief rather than promising a fixed turnaround.
- Confirm the payment wording. The site says arrangements are confirmed directly; there is no checkout.
- Do not add testimonials, client logos, case studies, credentials, or sales figures until they are real and verifiable.

---

## Free deployment

### GitHub Pages (recommended for a free static site)

A free GitHub account can publish Pages only from a **public** repository (private repositories require a paid plan). Publishing therefore makes both the live site and this site's source code public — that is the moment you decide to launch. The project contains no secrets or private client data, so the code is safe to publish.

1. Create a new repository on GitHub.
2. From this folder, initialize Git and push:

   ```bash
   git init
   git add .
   git commit -m "Build Market Insight Studio website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder, then save.
6. Wait for the deployment to finish. The URL will look like `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

The included `.nojekyll` file prevents Jekyll processing. Relative paths work under the repository subpath. The custom `404.html` is used automatically by GitHub Pages.

### Netlify Drop

1. Go to Netlify Drop.
2. Drag the whole project folder onto the page.
3. No build command is needed; the publish directory is the project root.

### Cloudflare Pages

1. Create a Pages project and connect the repository.
2. Use no framework preset.
3. Leave the build command empty.
4. Set the output directory to `/` (or the repository root).

### Before publishing

- ~~Replace the placeholder email~~ — done; the confirmed business email is configured (see "Configure before launch").
- Run `node scripts/check-site.mjs` and fix any errors.
- Test the enquiry flow on the deployed URL, not just locally.
- Update social image URLs to absolute URLs if your host requires them.
- Confirm the host serves the custom 404 page.
- Do not publish the repository or site until you explicitly decide to.

---

## Known limitations

- **No backend.** The site cannot receive or store form submissions. The brief builder prepares text in the browser; the visitor must send it through their email app or copy it. This is intentional for a zero-budget, privacy-conscious launch.
- **JavaScript is required for the brief builder and copy actions.** Without JavaScript, the mobile navigation remains visible and the contact email is shown directly, but the form falls back to a plain mailto submission and the copy buttons are unavailable.
- **No payment integration.** Prices are displayed, but payment is arranged directly after scope is agreed.
- **Mailto depends on the visitor’s email client.** Some visitors may not have a desktop mail client configured. The copyable brief is the fallback.
- **Google Form is optional and external.** If configured, it is subject to Google’s terms and privacy practices.
- **No analytics.** The site makes no tracking claims beyond what is implemented. If you add analytics later, update the footer and privacy wording.
- **Illustrative sample only.** `sample-report.html` uses fictional brands and fictional data. Do not present it as a real client report.
- **Email is configured, not hosted.** `assets/js/config.js` holds the confirmed business address; the site itself never sends email — visitors send from their own mail app, so delivery depends on their email client.
- **No delivery-time promise.** Turnaround is agreed per project until the workflow is tested and reliable.

---

## Editing content

| Content | Location |
| --- | --- |
| Contact email and optional form URL | `assets/js/config.js` |
| Main page copy, services, process, pricing, FAQ | `index.html` |
| Sample report copy and fictional data | `sample-report.html` |
| Colours, spacing, responsive and print styles | `assets/css/styles.css` |
| Navigation, brief builder, copy actions | `assets/js/main.js` |
| Social image | `assets/img/og-cover.png` |
| Site checks | `scripts/check-site.mjs` |

If you change the email in `config.js`, also replace the matching address in the raw `mailto:` fallbacks in `index.html` and `sample-report.html` so no-JavaScript visitors see the right address.

---

## Verification status

Tested locally on 24 October 2026:

- `node scripts/check-site.mjs` — **PASS**, with no warnings (the business email is configured; the placeholder and TODO markers are gone).
- Lighthouse in the desktop browser — **Accessibility 100, Best Practices 100, SEO 100** on all three pages, including `404.html`. (A Lighthouse run against a path that does not exist locally audits the Python test server's bare “404” text page, not the custom page; host-level 404 routing can only be checked after deployment.)
- Browser width sweep at 320, 360, 390, 414, 768, 820, 920, 1024, 1280, and 1440 px on all three pages — no horizontal page overflow. Report tables scroll internally on narrow screens and show a hint; the main-page preview table also shows a hint at narrow phone widths. The configured business email fits on one line in the contact card and footer down to 320 px.
- Keyboard checks — the skip link moves focus to `<main>`, the mobile menu closes with Escape and returns focus to the Menu button, and interactive elements have visible focus rings.
- Enquiry flow — empty-field validation, template-conforming brief generation, honest “nothing sent” status, copy actions, and pricing-card preselection of the target market all work. The generated email draft follows the confirmed enquiry template; the “Copy blank template” text includes the recipient (To:) and subject lines. Clipboard read-back could not be independently verified because the test browser blocks clipboard reads; copy content was verified by instrumenting both clipboard code paths. Sending and actual email delivery cannot be tested in the test browser.
- Sample report — print action is wired, table-of-contents anchors scroll correctly, and the fictional-example banner is visible in print styles.
- 404 page — `404.html` loads directly and its links work. Host-level 404 routing has not been tested because the site is not deployed.
- No console errors, missing local assets, or external network references on any page.

Deployment has **not** been performed. No public repository was created, no email was sent, and no account settings were changed. The site is not live until you publish it and verify the deployed URL.
