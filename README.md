# Mood Jar

A gentle mood journal where every feeling becomes a colorful orb in a glass jar. Entries are private by default and can optionally be published onchain.

Built with [Arc Studio](https://studio.arc.io)

## What you can do

- Capture a feeling: pick a mood (Happy, Calm, Tired, Anxious, Sad) and write a short note.
- Watch the new orb fall into the jar, then tap any orb to revisit its entry.
- Save privately (stored in this browser only) or publish onchain on Arc Testnet after reviewing exactly what becomes public.
- A wallet is only requested when you choose to publish.

Private entries live in your browser's local storage. If you clear your browser data, they may be lost. Onchain entries are public and may remain accessible permanently.

## Tech stack

React, Vite, TypeScript, Tailwind CSS, framer-motion, wagmi, viem, ConnectKit.

## Development

Prerequisites: [Bun](https://bun.sh).

```bash
bun install
bun run dev      # start the dev server on port 5173
bun run check    # lint and typecheck
```

### Environment variables

None.
