CREATE TABLE pet_photos (
  id        serial PRIMARY KEY,
  image_url text NOT NULL,
  alt       text NOT NULL,
  caption   text,
  position  integer NOT NULL
);
