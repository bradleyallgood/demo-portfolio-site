CREATE TABLE hobbies (
  id          serial PRIMARY KEY,
  title       text NOT NULL,
  description text NOT NULL,
  image_url   text NOT NULL,
  alt         text NOT NULL,
  position    integer NOT NULL
);
