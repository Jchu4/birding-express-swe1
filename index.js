// Import dependencies.
import express, { urlencoded } from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

// Initialise database connection.
const { Pool } = pg;

// Separate DB connection configs for production vs non-production environments.
let poolConfig;
if (process.env.ENV === 'PRODUCTION') {
  // Set up remote Postgres server
  poolConfig = {
    user: 'postgres',
    password: process.env.DB_PASSWORD,     // DB_PASSWORD - environment variable for security.
    host: 'localhost',
    database: 'birding',
    port: 5432,
  };
} else {
  // Set up Local Postgres server
  poolConfig = {
    user: 'jchua',
    host: 'localhost',
    database: 'birding',
    port: 5432,
  };
}

const pool = new Pool(poolConfig);

// Initialise Express.
const app = express();
const PORT = process.argv[2];

// Configure Express settings.
app.set('view engine', 'ejs'); // Use 'ejs' templates.
app.use('/public', express.static('public')); // Serve CSS file found in 'public' directory.
app.use(methodOverride('_method')); // Override DELETE/POST with ?_method=PUT
app.use(express.urlencoded({extended : false}));  // Set up our middleware to parse POST data as follows.
app.use(cookieParser()); // Configure usage of cookie-parser.

// Note - GET. 
app.get('/note', (req, res) => {
  // const { userId } = req.cookies;

  console.log('/note GET request came in! ---')

  // Query 1 - Get user name for personalisation.
  const getNameQuery = `
  SELECT users.name 
  FROM users`;

  pool.query(getNameQuery, (getNameQueryErr, getNameQueryResult) => {
    if (getNameQueryErr) {
      console.log("getNameQuery error: ---", getNameQueryErr);
    }

    const { name } = getNameQueryResult.rows;

    // Query 2 - Get species name for user to select.
    const getSpeciesQuery = `
    SELECT *
    FROM species`;

    pool.query(getSpeciesQuery, (getSpeciesQueryErr, getSpeciesQueryResult) => {
      if (getSpeciesQueryErr) {
        console.log('getSpeciesQuery error: ---', getSpeciesQueryErr);
      }
      const birdSpeciesArr = getSpeciesQueryResult.rows;

      // Query 3 - Get behaviour.
      const getBehaviourQuery = `
      SELECT * FROM behaviour
      `;

      pool.query(getBehaviourQuery, (getBehaviourQueryErr, getBehaviourQueryResult) => {
        console.log('getBehaviourQueryErr error: ---', getBehaviourQueryErr)

        const behaviourArr = getBehaviourQueryResult.rows;
        console.log(behaviourArr);

        res.render('note', { name, birdSpeciesArr, behaviourArr });
      });
    });
  });
});

// Note - POST. 
app.post('/note', (req, res) => {
  console.log('/note POST request came in! ---')
  const { userId } = req.cookies;
  const formDetails = req.body;

  const values = Object.values(formDetails); // => [ 'date', 'time', 'day', 'duration', 'behaviour', 'habitat', 'flocksize', 'user_id', species_id' ]
  values.push(userId);


  const insertIntoNotesQuery = `
  INSERT INTO notes
  (date, time, day, duration, behaviour, habitat, flocksize, species_id, user_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING *`;


  // Send our INSERT INTO query to DB, & redirect user to indiviudal completed form page.
  pool.query(insertIntoNotesQuery, values, (err, result) => {
    if (err) {
      console.log("insertIntoNotesQuery error: ----", err.stack);
    } 

    let index = result.rows[0].id;
    console.log("result rows", result);

    res.redirect(`/note/${index}`);
  });
});

// Note:/Index - GET. 
app.get('/note/:id', (req, res) => {
  console.log('/note/:id GET request came in! ---')

  const { id } = req.params;

  // Query 1: Display notes section.
  const sqlQuery = `SELECT * FROM notes WHERE id = ${id}`

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log("Query error: ----", err.stack);
    }

    const sightingNotes = result.rows[0];

    // Query 2: Display comments section.
    const commentsUsersNotesQuery = `
    SELECT 
      notes.id AS notes_id, 
      comments.description,
      users.name,
      users.id AS users_id
    FROM comments
    INNER JOIN notes ON comments.note_id = notes.id
    INNER JOIN users ON comments.user_id = users.id
    WHERE notes.id = ${id}
    `;

    pool.query(commentsUsersNotesQuery, (commentsUsersNotesErr, commentsUsersNotesResult) => {
      if(commentsUsersNotesErr) {
        console.log('commentsUsersNotes error:', commentsUsersNotesErr)
      }

      const commentsArr = commentsUsersNotesResult.rows;
      console.log(commentsArr);
      
      res.render('note-id', { sightingNotes, commentsArr, id }); 
    });
  });
});

// Note:/Index/comment - POST. 
app.post('/note/:id/comment', (req, res) => {
  console.log('/note/:id/comment POST request came in! ---');

  const { userId } = req.cookies;
  const { id } = req.params;
  const { newComment } = req.body;

  const values = [userId, id, newComment]

  const insertQuery = `
  INSERT INTO comments (user_id, note_id, description)
  VALUES ($1, $2, $3)
  RETURNING *
  `;

  pool.query(insertQuery, values, (err, result) => {
    if (err) {
      console.log('insertQuery error: ---', err);
    }

    console.log("insertQuery results: ---", result);

    res.redirect(`/note/${id}`);
  });
});

// Note:/Index/edit - GET.
app.get('/note/:id/edit', (req, res) => {
  console.log('/note/:id/edit GET Request came in! ---');

  const { id } = req.params;
  const { userId } = req.cookies;

  const selectQuery = `
  SELECT notes.*, users.name
  FROM notes 
  INNER JOIN users ON notes.user_id = users.id
  WHERE notes.id = ${id}`;

  pool.query(selectQuery, (err, result) => {
    if (err) {
      console.log("selectQuery error: ----", err.stack)
    }
    const sightingNotes = result.rows[0];

    res.render('note-id-edit', { sightingNotes, id, userId })
  })
});

// Note:/Index/edit - PUT.
app.put('/note/:id/edit', (req, res) => {
  const formDetails = req.body;
  const { id } = req.params;

  console.log('/note/:id/edit PUT Request came in! ---');

  console.log("PUT request body here!: ---- ", formDetails)
  const values = Object.values(formDetails);

  const updateQuery = `
  UPDATE notes 
  SET habitat = $1,
      duration = $2,
      flocksize = $3,
      behaviour = $4,
      date = $5,
      time = $6,
      day = $7
  WHERE id = ${id}
  `;

  pool.query(updateQuery, values, (err, result) => {
    if (err) {
      console.log("updateQuery error: ---", err);
    }

    console.log("updateQuery successful!");
    console.log("updateQuery results: ", result);

    res.redirect(`/note/${id}`);
  });
});

// Note:/Index/edit - DELETE.
app.delete('/note/:id/edit', (req, res) => {
  const { id } = req.params;
  console.log('/note/:id/edit DELETE Request came in! ---');
  
  const deleteQuery = `
  DELETE FROM notes
  WHERE id = ${id}
  `
  
  pool.query(deleteQuery, (err, result) => {
    if (err) {
      console.log("deleteQuery error: ---", err);
    }
     console.log(`Successfully deleted ID #{id}`);
     res.render('note-id-deleted');
  });
});

// Root - GET. 
app.get('/', (req, res) => {
  // Verify Login cookie.
  console.log('/ root GET request came in! ---');

  const sqlQuery = `
  SELECT *
  FROM notes`;

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Error executing SQL query: ---', err.stack);
      res.status(503).send("Not working!");
      return;
    }

    // Use entire array for the view.
    const sightingsList = result.rows;

    res.render('root', { sightingsList } );
  });
});

// Users/:id - GET.
app.get('/users/:id', (req, res) => {
  const { id } = req.params;

  console.log('/ root GET request came in! ---');

  const sqlQuery = `
  SELECT notes.*, users.name 
  FROM notes
  INNER JOIN users ON notes.user_id = users.id
  WHERE notes.user_id = ${id}`;

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Error executing SQL query: ---', err.stack);
      res.status(503).send("Please sign in!");
      return;
    }

    // Use entire array for the view.
    const sightingsList = result.rows;
    console.log(sightingsList);

    res.render('users-individual', { sightingsList } );
  });
});

// Signup - GET.
app.get('/signup', (req, res) => {
  console.log('/signup GET request came in! ---')

  res.render('signup')
});

// Signup - POST.
app.post('/signup', (req, res) => {
  const userDetails = req.body; 
  console.log("USER DETS ----", userDetails)

  console.log('/signup POST request came in! ---')

  const values = Object.values(userDetails);

  // CREATE user in `users` table with form details from POST request.
  const insertUserQuery = `
  INSERT INTO users (name, email, password) 
  VALUES ($1, $2, $3)
  `;

  pool.query(insertUserQuery, values, (err, result) => {
    if (err) {
      console.log('insertUserQuery Error: ---', err);
    }

    console.log('insertUserQuery Succeess!');
    res.render('signup-confirmed');
  });
});

// Login - GET.
app.get('/login', (req, res) => {
  console.log('/login GET request came in! ---')

  res.render('login');
})

// Login - POST.
app.post('/login', (req, res) => {
  const loginDetails = req.body;

  console.log('/login POST request came in! ---')
  console.log("loginDetails: ---", loginDetails);

  const email = loginDetails.email;
  const getUserQuery = `
  SELECT * FROM users
  WHERE email = '${email}'`;


  pool.query(getUserQuery, (err, result) => {
     if (err) {
      console.log('getUserQuery Error: ---', err);
      res.status(503).send(result.rows);
      return;
    }

    // Check `users` table whether empty or not.
    if (result.rows.length === 0) {
      res.status(403).send("Woops! User details keyed in doesn't exist, please refresh to try again.");
    }

    // Assign results from getUserQuery to user variable.
    const user = result.rows[0];

    // When the user logs in succesfully, set their user Id in a cookie.
    if (user.password === loginDetails.password) {
      res.cookie('userId', user.id); 
      res.redirect('/');
    } else {
      res.status(403).send("Password entered incorrect, please refresh to try again.");
    }
  });
});

// Logout - DELETE. [Delete cookie `userId` to log user out].
app.delete('/logout', (req, res) => {
  console.log('/logout DELETE request came in! ---');

  res.clearCookie('userId');
  res.redirect('login')
});

// Species - GET. [Render form that creats new bird species].
app.get('/species', (req, res) => {
  console.log('/species GET request came in! ---');

  const selectQuery = `
  SELECT * 
  FROM species`;

  pool.query(selectQuery, (err, result) => {
    if (err) {
      console.log("selectQuery errors", err);
    }

    const birdSpeciesArr = result.rows;

    res.render('species', { birdSpeciesArr });
  });
});

// Species - POST. [Accept POST request to create a new species].
app.post('/species', (req, res) => {
  console.log('/species POST request came in! ---');

  const formDetails = req.body; 

  const values = [formDetails.commonName, formDetails.scienceName];

  const insertQuery = `
  INSERT INTO species (name, scientific_name)
  VALUES ($1, $2)
  RETURNING *`;

  pool.query(insertQuery, values, (err, result) => {
    if (err) {
      console.log("insertQuery errors", err);
    }

    console.log("Results of insertQuery!: -----", result.rows[0]);

    res.send('Species recorded. Thanks!');
  });
});

// Species/all - GET. [Render a list of species in addition to the previous data rendered on the root route.].
app.get('/species/all', (req, res) => {
  console.log('/species/all GET request came in! ---')

  const joinQuery = `
  SELECT notes.id AS notes_id, species.id AS species_id, species.name, notes.user_id
  FROM notes
  INNER JOIN species ON notes.species_id = species.id
  `

  pool.query(joinQuery, (joinQueryErr, joinQueryResult) => {
    if (joinQueryErr) {
      console.log('joinQueryErr error: ---',joinQueryErr)
    }

    const notesArr = joinQueryResult.rows;
    const uniqueSpeciesArr = [];
    for (let i = 0; i < notesArr.length; i ++) {
      if (!uniqueSpeciesArr.includes(notesArr[i].name)) {
        uniqueSpeciesArr.push(notesArr[i].name);
      };
    }

    res.render('species-all', { notesArr, uniqueSpeciesArr });
  });
});

// Species/:index - GET. [Render a single species along with list of all notes associated with this species].
app.get('/species/:index', (req, res) => {
  console.log('/species/:index GET request came in! ---')

  const { index } = req.params;

  const joinQuery = `
  SELECT 
    notes.id AS notes_id, 
    notes.date, 
    notes.time, 
    notes.day, 
    notes.duration,
    notes.habitat,
    notes.behaviour,
    notes.species_id,
    species.name,
    species.scientific_name
  FROM notes
  INNER JOIN species ON notes.species_id = species.id
  WHERE notes.species_id = ${index}
  `

  pool.query(joinQuery, (joinQueryErr, joinQueryResult) => {
    if (joinQueryErr) {
      console.log('joinQueryErr error: ---',joinQueryErr)
    }
    let notesArr = joinQueryResult.rows;

    res.render('species-individual', { notesArr });
  });
});

// Species/:index/edit - GET. [Render a form to edit a species].
app.get('/species/:index/edit', (req, res) => {
  console.log('/species/:index/edit GET request came in! ---')
  const { index } = req.params;

  const joinQuery = `
  SELECT 
    notes.id AS notes_id, 
    notes.date, 
    notes.time, 
    notes.day, 
    notes.duration,
    notes.habitat,
    notes.behaviour,
    notes.species_id,
    species.name,
    species.scientific_name
  FROM notes
  INNER JOIN species ON notes.species_id = species.id
  WHERE notes.species_id = ${index}
  `

  pool.query(joinQuery, (joinQueryErr, joinQueryResult) => {
    if (joinQueryErr) {
      console.log('joinQueryErr error: ---',joinQueryErr)
    }
    const notesArr = joinQueryResult.rows;

    res.render('species-individual-edit', { notesArr });
  });
});

// Species/:index/edit - PUT. [Accept a PUT request to edit a single species].
app.put('/species/:index/edit', (req, res) => {
  console.log('/species/:index/edit PUT request came in! ---');

  const { index } = req.params;
  const formDetails = req.body;
  const values = Object.values(formDetails);

  const updateQuery = `
    UPDATE species
    SET name = $1, scientific_name = $2
    WHERE id = ${index}
  `;

  pool.query(updateQuery, values, (err, result) => {
    if (err) {
      console.log('updateQuery error: ---', err);
    }
    
    console.log('updateQuery results: ---',result);

    res.redirect(`/species/${index}`);
  });
});

// Species/:index/edit - DELETE. [Accept a PUT request to edit a single species].
app.delete('/species/:index/edit', (req, res) => {
  console.log('/species/:index/edit DELETE request came in! ---');

  const { index } = req.params;

  const deleteQuery = `
  DELETE FROM species
  WHERE id = ${index}
  RETURNING *
  `;

  pool.query(deleteQuery, (err, result) => {
    if (err) {
      console.log('deleteQuery error: ---', err)
    }
    console.log("Deleted species succesfullie!");

    console.log('deleteQuery results: ---', result);


    res.render('note-id-deleted')
  });
});

// Behaviours - GET. []Render a list of behaviours].
app.get('/behaviours', (req, res) => {
  console.log('/behaviours GET request came in! ---');

  const getBehavioursQuery = `
    SELECT behaviour.name, notes_behaviour.notes_id
    FROM behaviour
    INNER JOIN notes_behaviour ON behaviour.id = notes_behaviour.behaviour_id
   `
  pool.query(getBehavioursQuery, (err, result) => {
    if (err) {
      console.log('getBehavioursQuery error: ---', err);
    }

    const behaviourArr = result.rows;
    console.log(behaviourArr)

    res.render('behaviours', { behaviourArr })
  });
});

// Behaviours - GET. []Render a list of behaviours].
app.get('/behaviours/:index', (req, res) => {
  console.log('/behaviours/:index GET request came in! ---');

  const { index } = req.params;

  const getBehavioursQuery = `
    SELECT *
    FROM behaviour
    WHERE id = ${index}
   `
  pool.query(getBehavioursQuery, (err, result) => {
    if (err) {
      console.log('getBehavioursQuery error: ---', err);
    }
    
    const behaviourArr = result.rows;
    console.log(behaviourArr)

    res.render('behaviours-individual', { behaviourArr })
  });
});

app.listen(PORT, (err) => {
  if (err) {
    console.log('Trouble connecting to PORT');
  }
  console.log('Connected successfullly to port', PORT);
});