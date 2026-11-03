# Personal portfolio site

By Bradley Allgood.

Personal site with home, projects, about, and contact pages. React (Vite) front end, Node/Express API, PostgreSQL.

## Getting started

### What you need

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 22 or newer
- [Docker Desktop](https://www.docker.com/products/docker-desktop/). The site and Postgres both run in containers, so you don't need to install Postgres yourself.

### First run

```sh
git clone https://github.com/bradleyallgood/demo-portfolio-site.git
cd demo-portfolio-site
npm install
cp .env.example .env     # Windows Command Prompt: copy .env.example .env
npm run dev
```

Answer `Y` when asked to start the project. If Docker Desktop isn't running, the script starts it for you. The first run downloads the Node and Postgres images and installs dependencies inside the container, so it can take a few minutes. Later runs are much faster.

The site is ready at http://localhost:5173 once the log shows Vite's local URL. On startup the container applies database migrations and loads [content.json](server/db/content.json), so you start with a working site full of placeholder content.

### Day to day

- Leave `npm run dev` running while you work. Saved changes to the React app, the server code, or `content.json` apply by themselves.
- Press Ctrl+C to stop the containers. The database is kept for next time.
- In VS Code, opening the folder asks the same "Start the project?" question. VS Code asks once whether to allow automatic tasks in this folder. Choose **Allow** to turn this on.
- After adding a dependency, run `npm install` as usual. Compose rebuilds the container when `package-lock.json` changes.
- To start over with an empty database, run `docker compose down -v`, then `npm run dev`.

### If something goes wrong

- **Port 5432 or 5173 is already in use.** Another Postgres or Vite server is running on your machine. Stop it, or change the left-hand port in [docker-compose.yml](docker-compose.yml).
- **Docker Desktop did not start.** Open Docker Desktop yourself, wait for it to say it's running, then run `npm run dev` again. On Windows, Docker Desktop needs WSL 2. The installer sets this up.
- **Migrations fail with `getaddrinfo ENOTFOUND db`.** The web container can't reach the database container. This can happen after Docker Desktop restarts. Run `docker compose down`, then `npm run dev` again. This recreates the containers and keeps your data.
- **The site loads but shows no content.** Run `npm run db:seed` while the containers are running.

## Commit signing

```sh
npm run signing
```

This checks for an SSH signing key and creates one if there isn't one, uploads it to GitHub if needed, makes this repo sign every commit and tag, and turns on the GitHub rule that rejects unsigned commits on `main`. It's safe to run again. It needs the GitHub CLI, and offers to install it on Windows.

## Edit the content

All site content lives in [server/db/content.json](server/db/content.json), which starts out as placeholder content for "Alex Sample". Replace it with your own, and put your photos in `client/public/images/`. While the containers are running, saving the file updates the database and refreshes the browser. Otherwise, run `npm run db:seed`. Seeding replaces the content tables but leaves contact messages alone.

Files go in `client/public/`, and `content.json` points to them with a path starting at `/`. Anything left as `null` stays hidden. Images must be hosted on this site, because the security headers block images from other domains.

| What | Save as | Set in `content.json` |
| --- | --- | --- |
| Portrait on Home | `client/public/images/me.jpg` | `"photoUrl": "/images/me.jpg"` |
| Hobby on About | `client/public/images/name.jpg` | Add an entry to `"hobbies"` |
| Pet carousel on About | `client/public/images/pets/name.jpg` | Add an entry to `"pets"` |
| Project screenshot | `client/public/projects/name.png` | `"imageUrl": "/projects/name.png"` |

Set `"featured": true` on the projects to show on the home page. The first three appear.

## Read contact messages

Messages are saved to the `contact_messages` table:

```sh
docker compose exec db psql -U portfolio -c "SELECT * FROM contact_messages ORDER BY created_at DESC"
```

Set `SMTP_URL` and `NOTIFY_EMAIL` to also get each message by email. See [.env.example](.env.example). `NOTIFY_EMAIL` stays on the server and never appears on the site.

## Deploy

The Express server serves both the API and the built React app, so it deploys as one service with a Postgres database. The [Dockerfile](Dockerfile) builds the production image by default, and that image applies migrations and loads `content.json` each time it starts.

Set `DATABASE_URL` on the host. The host normally provides `PORT`.

## Test

The tests run on your machine, not in a container. They connect to the database through `DATABASE_URL` in `.env`, so do the first-run steps first. Then, with `npm run dev` running in another terminal:

```sh
npm test
```

To run the tests without starting the whole site, start only the database:

```sh
npm run db:up
npm run db:migrate
npm run db:seed
npm test
npm run db:down      # when you're done
```
