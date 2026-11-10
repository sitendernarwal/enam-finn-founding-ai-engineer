# Deployment checklist

The prototype is static and needs no build step, build command, environment variables, or secrets. Each assignment folder is independently deployable. The included `netlify.toml`, `vercel.json`, and `.nojekyll` provide basic static-host settings and response headers.

1. Put the contents of this folder at the root of its own GitHub repository, or select this folder as the project root in your static host.
2. Deploy with Netlify (publish directory `.`), Vercel (static project root `.`), or GitHub Pages (branch `main`, root folder). There is no build command.
3. Locally, preview with `python3 -m http.server 8000` from this folder and open `http://localhost:8000`.
4. After deployment, open the public URL on desktop and a phone-sized viewport. Confirm Daily brief, Research, Network, ticker search, alert thresholds, and privacy dialogs work.
5. Add the published URL and repository URL to `COVERING_NOTE.md` and `SUBMISSION_CHECKLIST.md`.
6. Export/share the Codex build conversation and add that link to the covering note.

Do not publish the files until you are comfortable making the prototype and its sample data public. The current values and stories are marked illustrative and the profile data is synthetic.
