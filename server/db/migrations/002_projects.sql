ALTER TABLE profile
  ADD COLUMN intro text NOT NULL DEFAULT '',
  ADD COLUMN photo_url text;

CREATE TABLE projects (
  id          serial PRIMARY KEY,
  title       text NOT NULL,
  tagline     text NOT NULL,
  description text NOT NULL,
  tech        text[] NOT NULL DEFAULT '{}',
  live_url    text,
  repo_url    text,
  image_url   text,
  featured    boolean NOT NULL DEFAULT false,
  position    integer NOT NULL
);

DROP TABLE experience;
DROP TABLE education;
