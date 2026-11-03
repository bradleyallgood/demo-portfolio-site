# Personal portfolio site

A portfolio site template with home, projects, about, and contact pages. Make a copy, swap in your own content, and deploy it. React (Vite) front end, Node/Express API, PostgreSQL.

Made by Bradley Allgood. Free to use under the [MIT License](LICENSE).

## Getting started

### What you need

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 22 or newer
- [Docker Desktop](https://www.docker.com/products/docker-desktop/). The site and Postgres both run in containers, so you don't need to install Postgres yourself.

### First run

1. On this repo's GitHub page, click **Use this template**, then **Create a new repository**. This gives you your own copy under your account, so your changes and pushes go to your repo, not this one.
2. Clone your new repo and start it, replacing `your-username` and `your-repo` with your own:

```sh
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
npm run dev
```

Answer `Y` when asked to start the project. Before starting, the script:

- creates `.env` from [.env.example](.env.example) if you don't have one
- starts Docker Desktop if it isn't running, or tells you how to install it if it's missing
- stops with an explanation if another program is using port 5432 or 5173
- recreates containers that lost their network connection, which can happen after Docker Desktop restarts

The first run downloads the Node and Postgres images and installs dependencies inside the container, so it can take a few minutes. Later runs are much faster.

The site is ready at http://localhost:5173 once the log shows Vite's local URL. On startup the container applies database migrations and loads [content.json](server/db/content.json), so you start with a working site full of placeholder content.

### Day to day

- Leave `npm run dev` running while you work. Saved changes to the React app, the server code, or `content.json` apply by themselves.
- Press Ctrl+C to stop the containers. The database is kept for next time.
- In VS Code, opening the folder asks the same "Start the project?" question. VS Code asks once whether to allow automatic tasks in this folder. Choose **Allow** to turn this on.
- After adding a dependency, run `npm install` as usual. Compose rebuilds the container when `package-lock.json` changes.
- To start over with an empty database, run `docker compose down -v`, then `npm run dev`.

### If something goes wrong

- **"Another program is already using a port."** Usually a Postgres installed on your computer (port 5432) or another Vite project (port 5173). Stop it, or change the first number in the matching `ports` line in [docker-compose.yml](docker-compose.yml).
- **Docker Desktop did not start.** Open Docker Desktop yourself, wait for it to say it's running, then run `npm run dev` again. On Windows, Docker Desktop needs WSL 2. The installer sets this up.
- **Migrations fail with `getaddrinfo ENOTFOUND db`.** `npm run dev` normally fixes this by itself. If it still happens, run `docker compose down`, then `npm run dev`. This recreates the containers and keeps your data.
- **"content.json has a problem."** The message lists each mistake, with the line number for a missing comma or bracket, or the name of the field that's wrong. Nothing changes until the file is fixed. Fix it and save, and the site reloads with your content.
- **The site loads but shows no content.** Run `npm run db:seed` while the containers are running.

## Make it your own

Once the site runs, work through this list. The [Edit the content](#edit-the-content) section below explains the details.

- [ ] **Your content.** Replace the "Alex Sample" placeholder text in [server/db/content.json](server/db/content.json): your name, headline, intro, location, and about text, plus your skills, projects, hobbies, and pets. Delete any entries you don't want.
- [ ] **Your links.** Set your LinkedIn, GitHub, and any other profile links. See [LinkedIn, GitHub, and other links](#linkedin-github-and-other-links).
- [ ] **Your photos.** Add your portrait and other images to `client/public/images/`, and point `content.json` at them. Then delete the sample images: `portrait.svg`, `hobby-1.svg`, `hobby-2.svg`, and the files in `images/pets/`.
- [ ] **Page title and link previews.** In [client/index.html](client/index.html), replace `Your Name` in the `<title>` and the two `<meta>` tags. This is what search results and shared links show.
- [ ] **Icon.** Replace [client/public/favicon.svg](client/public/favicon.svg) with your own, or keep the sample.
- [ ] **Page wording.** A few headings are written into the pages rather than `content.json`, such as "Let’s talk." on [Contact.jsx](client/src/pages/Contact.jsx) and the intro on [Projects.jsx](client/src/pages/Projects.jsx). Change them if you'd like.
- [ ] **Contact form email (optional).** Set `SMTP_URL` and `NOTIFY_EMAIL` in `.env` to get each message by email. See [Read contact messages](#read-contact-messages).
- [ ] **This README.** Rewrite the top of this file to describe your site. Keep the [LICENSE](LICENSE) file as it is. The MIT License requires it to stay with the code.
- [ ] **Deploy.** See [Deploy](#deploy).

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

### LinkedIn, GitHub, and other links

Your profile links appear in the footer of every page. Set them in the `"links"` list inside `"profile"` in [content.json](server/db/content.json), replacing `your-handle` with your own profile names:

```json
"links": [
  { "label": "LinkedIn", "url": "https://www.linkedin.com/in/your-handle" },
  { "label": "GitHub", "url": "https://github.com/your-handle" }
]
```

`label` is the text shown on the site, and `url` must be the full address, starting with `https://`. Links appear in the order listed. To add another site, like a blog, add an entry. To leave one out, delete its entry. Each link opens in a new tab.

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
