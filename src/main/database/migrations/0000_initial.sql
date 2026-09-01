CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_name TEXT NOT NULL CHECK(length(trim(group_name)) > 0),
  drug TEXT NOT NULL CHECK(length(trim(drug)) > 0),
  dose TEXT NOT NULL CHECK(length(trim(dose)) > 0),
  presentation TEXT NOT NULL CHECK(length(trim(presentation)) > 0),
  commercial_brand TEXT NOT NULL CHECK(length(trim(commercial_brand)) > 0),
  quantity INTEGER NOT NULL CHECK(quantity >= 0),
  expiration_date TEXT NOT NULL,
  acquisition TEXT NOT NULL CHECK(length(trim(acquisition)) > 0),
  location TEXT NOT NULL CHECK(length(trim(location)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS biomedical_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0),
  quantity INTEGER NOT NULL CHECK(quantity >= 0),
  expiration_date TEXT NOT NULL,
  location TEXT NOT NULL CHECK(length(trim(location)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
