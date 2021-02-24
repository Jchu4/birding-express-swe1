INSERT INTO notes (date, time, day, duration, behaviour, flocksize, habitat, user_id, species_id) 
VALUES
    (' 14/01/20', '09:30', 'Monday', 12, 'Looking for food', 5, 'By the pond, near vegetation. Weather cooling.', 1, 3),
    (' 04/03/20', '19:30', 'Saturday', 13, 'Looking for food  and water', 5, 'By the pond, near vegetation.', 1, 10),
    (' 02/01/20', '10:45', 'Friday', 40, 'Cautious to both prey & predators, working together to hunt for food.', 5, 'Nearby shrubs and flowers, next to pond teeming with fish.', 1, 1),
    (' 14/11/20', '14:00', 'Sunday', 15, ' Working in unison, eager to peck the sands to find food.', 5, 'Near the ocean, cliffs nearby, higher sea levels. ', 2, 12),
    (' 09/01/20', '07:45', 'Thursday', 43, 'Harmonious and subtle, seems to be looking for a safe place to build a nest', 5, 'Near river bodies and farmland, rich bio-diversity.', 1, 7),
    (' 25/12/20', '12:22', 'Monday', 33, 'Soaring in the sky, eagle-like ', 5, 'Open grasslands, strong winds', 3, 13),
    (' 01/01/21', '10:30', 'Wednesday', 12, 'Pecking on the grounds near the pond', 5, 'By the pond, near vegetation and villages.', 3, 1),
    (' 14/01/20', '09:30', 'Tuesday', 5, 'Hunting', 5, 'Near Grasslands', 3, 8),
    (' 20/02/21', '16:05', 'Monday', 10, 'Hunting for food', 5, 'Grasslands teeming with locusts', 1, 8);


INSERT INTO users (name, email, password)
VALUES 
    ('Jerome', 'jerome@test.com', 'test'),
    ('Matthew', 'matthew@test.com', 'test'),
    ('Meng', 'me@test.com', 'test'),
    ('Chua', 'chua@test.com', 'test');


INSERT INTO species (name, scientific_name) 
VALUES 
    ('Gadwall', 'Mareca strepera'),
    ('Red Junglefowl', 'Caprimulgus affinis'),
    ('Black-nest Swiftlet', 'Aerodramus maximus'),
    ('Asian Emerald Cuckoo', 'Chrysococcyx maculatus'),
    ('Common Moorhen', 'Gallinula chloropus'),
    ('Barred Buttonquail ', 'Turnix suscitator'),
    ('Pied Stilt', 'Himantopus leucocephalus'),
    ('Grey Plover', 'Pluvialis squatarola'),
    ('Greater Sand Plover', 'Charadrius leschenaultii');


 INSERT INTO behaviour (name)
 VALUES 
    ('Walking'), 
    ('Resting'),
    ('Climbing Tree'),
    ('Perched'),
    ('Drinking'),
    ('Hovering'),
    ('Soaring'),
    ('Hunting'),
    ('Ground Feeding'),
    ('Finding Food');

INSERT INTO notes_behaviour (notes_id, behaviour_id)
VALUES 
    (1, 3),
    (2, 3),
    (2, 6),
    (3, 3),
    (3, 9),
    (4, 10),
    (4, 3),
    (5, 1),
    (5, 4),
    (6, 8),
    (7, 10),
    (7, 3),
    (7, 6),
    (7, 1);


INSERT INTO comments (user_id, note_id, description)
VALUES 
    (2, 1, 'Which area is this at?'),
    (1, 1, 'Near greenwood, they appear only in the mornings.'),
    (4, 1, 'Interesting.. any photos? @jerome'),
    (3, 2, 'Which area?'),
    (3, 3, 'Cool stuff!'),
    (3, 4, 'I have seen them in greater flock sizes!');