-- Exactly one row: id is a boolean primary key constrained to true.
CREATE TABLE profile (
  id         boolean PRIMARY KEY DEFAULT true CHECK (id),
  name       text NOT NULL,
  headline   text NOT NULL,
  location   text NOT NULL,
  email      text NOT NULL,
  about      text NOT NULL,
  links      jsonb NOT NULL DEFAULT '[]',
  resume_url text
);

CREATE TABLE skills (
  id       serial PRIMARY KEY,
  category text NOT NULL,
  name     text NOT NULL,
  position integer NOT NULL
);

CREATE TABLE experience (
  id           serial PRIMARY KEY,
  role         text NOT NULL,
  organization text NOT NULL,
  location     text,
  period       text NOT NULL,
  summary      text,
  highlights   text[] NOT NULL DEFAULT '{}',
  position     integer NOT NULL
);

CREATE TABLE education (
  id          serial PRIMARY KEY,
  credential  text NOT NULL,
  institution text NOT NULL,
  period      text NOT NULL,
  details     text,
  position    integer NOT NULL
);

CREATE TABLE contact_messages (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL,
  company    text,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
