# Personal portfolio site

By Bradley Allgood.

Personal site with home, projects, about, and contact pages. React (Vite) front end, Node/Express API, PostgreSQL.

## Run locally

Requires Node 22+ and Docker Desktop. The site and Postgres both run in Docker.

```sh
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

`npm run dev` asks whether to start the containers, then applies migrations, loads `content.json`, and starts the site. VS Code asks the same question when you open this folder, after you allow its automatic task once. Leave it running while you work. Saved changes to the React app, the server code, or `content.json` all apply by themselves. Ctrl+C stops the containers.

After adding a dependency, run `npm install` as usual. Compose rebuilds the container when `package-lock.json` changes.

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

With the database running and seeded:

```sh
npm test
```
