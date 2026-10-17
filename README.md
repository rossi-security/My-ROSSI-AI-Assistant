# Rossi AI Assistant

Rossi is a private, responsive chat app for learning to code, designing interfaces and animations, planning general fitness, talking through feelings, making decisions, explaining maths and brainstorming ideas. It supports English, Tamil and Tanglish. Its icon and interface were created for this project.

## What works

- **Cloud AI:** a server-side `/api/chat` route calls the OpenAI Responses API. The API key remains in the hosting environment and is never sent to the browser or committed to Git.
- **Local AI option:** a WebGPU-capable browser can download a pretrained Qwen model and run it on the device. The first download is large and local answers may be less capable.
- **Conversation tools:** mode and language selectors, browser-local chat history, delete history, code copying, stop response and mobile navigation.
- **Safety:** fitness guidance is general, emotional guidance is non-diagnostic, and immediate danger prompts direct the user to local emergency services or nearby human help. The app does not invent hotline numbers.

The mode instructions tailor a pretrained model. They do not constitute training a new model, guarantee accuracy, or establish that Rossi is better than another assistant.

## Run locally

Node.js 24 or newer is recommended. Create a private `.env.local` containing `OPENAI_API_KEY`; it is ignored by Git. Then run:

```sh
node scripts/dev.mjs
```

Open `http://127.0.0.1:4173`. Local preview binds to the loopback interface. With no API key, use Settings to start a local model. No key is ever required in browser code.

## Deploy on Sites

The tracked `.openai/hosting.json` identifies the private Site. Run `node scripts/build.mjs` to create `dist/server/index.js` and deploy the built Worker with Sites. Configure `OPENAI_API_KEY` as a **secret** runtime variable, and optionally set `OPENAI_MODEL` (default `gpt-6.1-sol`). API billing must be active in the selected OpenAI Platform project for cloud replies to work. Keep the Site private while using the project key; a public audience needs additional abuse and cost controls.

## Try these prompts

| Focus | Example |
| --- | --- |
| Code | “Python-la habit tracker app build panni, run panna steps sollu.” |
| Java | “Explain Java classes with a small runnable example.” |
| Web | “Create accessible HTML, CSS and JavaScript for an animated portfolio; support reduced motion.” |
| Fitness | “Ask about my goals and injuries, then suggest a gentle beginner routine.” |
| Support | “I’m stressed about an exam. Help me take the next small step.” |
| Think | “Help me compare two job options and identify what I still need to know.” |
| Maths | “தமிழில் quadratic equation-ஐ படிப்படியாக விளக்கு.” |
| Ideas | “Suggest unusual but practical ideas for a student app.” |

Responses can contain mistakes. For health concerns, seek qualified care; for immediate danger, contact local emergency services or a trusted person nearby.
