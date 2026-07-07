# lucnt

Marketing site for lucnt — a policy-and-ledger layer that sits between an AI agent and the
money it spends: policy checked first, payment second, a balanced ledger written automatically.

Static single-page site. Plain HTML/CSS/JS, no build step, no framework, no dependencies.

## Run locally

Serve the directory with any static file server and open `lucnt.html`.

```bash
python3 -m http.server 8080
# then visit http://localhost:8080/lucnt.html
```

VS Code's Live Server extension (or any other static server) works the same way — there's
nothing to install or build first.

## File layout

```
lucnt.html      # the whole site: hero, platform, ledger sections, blog posts, forms
css/styles.css  # all styles
js/main.js      # SPA hash router, hero book-fall/shelf animation, scroll-driven scenes,
                # ledger loop, form submission
```

`lucnt.html` is a single page. A small hash-based router in `js/main.js` swaps between the
home page and a few blog-post sections (`#blog`, `#post-agent-economy`, `#post-policy`,
`#post-books`) without a page reload.

## Forms (Netlify Forms)

Two forms post to [Netlify Forms](https://docs.netlify.com/forms/setup/):

| Form | `name` | Fields |
|---|---|---|
| Hero "Get access" capture | `hero-access` | `email` |
| Waitlist (`#cta` section) | `waitlist` | `email`, `role` |

Each form carries `data-netlify="true"`, a hidden `form-name` input, and a `bot-field`
honeypot for spam filtering. Because the forms are static markup in `lucnt.html` (not
injected by JS after load), Netlify's build bot detects them automatically at deploy time —
no extra configuration is needed on the Netlify side.

On submit, `js/main.js` intercepts the event and POSTs the form data to `/` via `fetch()`
(the way Netlify Forms expects for AJAX submissions), then swaps in the existing success
state on a 2xx response or an inline error message if the request fails. Submissions appear
in the Netlify dashboard under **Site configuration → Forms**.
