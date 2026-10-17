# Rossi — Independent Studio

Rossi is an installable web app for focused thinking and creation. It works without an OpenAI API, another AI service, a downloaded model, or a user account. Chat prompts and generated media stay in the browser. The interface supports English, Tamil, and Tanglish.

Open the current independent app: **https://rossi-security.github.io/My-ROSSI-AI-Assistant/**. The site redirects to the app in `web/`. The older private Site URL has not been updated with this version.

## What Rossi can do

- Choose a focus: Code, Design, Fitness, Support, Reason, Decide, Maths, Chemistry, Physics, Ideas, or Imagine. All mode routes a question to a relevant local module.
- Calculate arithmetic and simple linear equations with steps; calculate molar masses for supported chemical formulas; apply selected physics formulas with units.
- Give starter code for Python, Java, and HTML/CSS/JavaScript, plus limited curated explanations for other topics.
- Produce original procedural SVG artwork and short, silent animated video clips in supported browsers. Images and clips are drawn locally. This is not photorealistic text-to-image or cinematic video generation.
- Install as a Progressive Web App (PWA) from the same website. A service worker caches the interface for offline use; conversations stay in that browser or installed app and do not sync between devices.

Rossi uses deterministic algorithms, curated examples, and a small built-in reference. It is **not** a newly trained general-purpose neural model and will not match a large AI model on arbitrary questions. It states its coverage and asks for a narrower question when needed. Fitness advice is general, emotional support is non-diagnostic, and urgent safety messages direct the user to nearby human help or local emergency services without inventing a number.

## Run and test locally

Node.js 24 or newer is recommended. No API key, environment file, package installation, or account is required.

```sh
npm run check
npm run dev
```

Open `http://127.0.0.1:4173`. The local server binds only to the loopback interface. `npm run build` creates the deployable Worker at `dist/server/index.js`.

## Install the app

On desktop or Android, open the hosted Rossi website and use the browser's **Install app** command, or press **Install Rossi** in Settings when the browser offers an install prompt. On iPhone, use Safari's **Share → Add to Home Screen**. The app and website use the same source; browser support determines whether video export and offline installation are available.

## Source and privacy

`web/engine.js` contains Rossi's local subject modules; `web/studio.js` draws media; `web/sw.js` caches the PWA; `worker/handler.js` serves static assets only. There is no chat API endpoint or outbound AI call in this version. The tracked `.openai/hosting.json` identifies the existing private Site for deployment and does not contain credentials. Any old `.env.local` file from earlier development is ignored by Git and is not read by the app.

Try `2*(3+4)`, `H2O molar mass`, `force for 5 kg at 2 m/s²`, or ask for a Python starter app. Select **Create** for rose artwork or a short animated video. For a wider question, tell Rossi the goal, constraints, and a concrete example.
