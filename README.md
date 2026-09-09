# Task Tracker

A small Next.js app created to learn the complete workflow:

1. Build and test locally.
2. Store the code on GitHub.
3. Deploy automatically through Vercel.
4. Publish future changes with git push.

## Features

- Add, complete, filter, and delete tasks.
- Completion progress.
- Browser storage so tasks remain after refresh.
- Responsive desktop and mobile layout.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run build
```

Tasks are saved only in the current browser. A later version can add a database for shared access.
