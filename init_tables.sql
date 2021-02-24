CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  date TEXT,
  time TEXT,
  day TEXT,
  duration INT,
  behaviour TEXT,
  flocksize INT,
  habitat TEXT,
  user_id INT,
  species_id INT
);

CREATE TABLE  IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  password TEXT
);

CREATE TABLE  IF NOT EXISTS species (
  id SERIAL PRIMARY KEY,
  name TEXT,
  scientific_name TEXT
);


CREATE TABLE IF NOT EXISTS behaviour (
  id SERIAL PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS notes_behaviour (
  id SERIAL PRIMARY KEY,
  notes_id INT,
  behaviour_id INT
);

CREATE TABLE  IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INT,
  note_id INT,
  description TEXT
);