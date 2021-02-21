// Import dependencies.
import express, { urlencoded } from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import e from 'express';

// Initialise database connection.
const { Pool } = pg;
const poolConfig = {
  user: 'jchua',
  database: 'birding',
  host: 'localhost',
  port: 5432,
};

const pool = new Pool(poolConfig);

// Initialise Express.
const app = express();
const PORT = 3004;

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
  // console.log("userId cookie: --", userId);

  const getNameQuery = `
  SELECT users.name 
  FROM users`;

  pool.query(getNameQuery, (err, result) => {
    if (err) {
      console.log("getNameQuery error: ---", err);
    }

    const { name } = result.rows;
    console.log(result.rows);

    res.render('note', { name });
  });
});

// Note - POST. 
app.post('/note', (req, res) => {
  console.log('/note POST request came in! ---')

  // const { userId } = req.cookies;
  const formDetails = req.body;
  const insertIntoNotesQuery = `
  INSERT INTO notes
  (date, time, day, duration, behaviour, habitat, flocksize, user_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *`;
  const values = Object.values(formDetails); // => [ 'date', 'time', 'day', 'duration', 'behaviour', 'habitat', 'flocksize' ]

  // Send our INSERT INTO query to DB, & redirect user to indiviudal completed form page.
  pool.query(insertIntoNotesQuery, values, (err, result) => {
    if (err) {
      console.log("insertIntoNotesQuery error: ----", err.stack);
    } 

    let index = result.rows[0].id;


    res.redirect(`/note/${index}`);
  });
});

// Note:/Index - GET. 
app.get('/note/:id', (req, res) => {
  console.log('/note/:id GET request came in! ---')

  const { id } = req.params;
  const sqlQuery = `SELECT * FROM notes WHERE id = ${id}`
  
  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log("Query error: ----", err.stack);
    }

    console.table(result.rows);
    const sightingNotes = result.rows[0];

    res.render('note-id', { sightingNotes }); 
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
    console.log(sightingsList);

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
    console.log("DA LIST ---", sightingsList)
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

// Logout - DELETE.
app.delete('/logout', (req, res) => {
  console.log('/logout DELETE request came in! ---');

  res.clearCookie('userId');
  res.redirect('login')
});

app.listen(PORT, (err) => {
  if (err) {
    console.log('Trouble connecting to PORT');
  }
  console.log('Connected successfullly to port ', PORT);
});