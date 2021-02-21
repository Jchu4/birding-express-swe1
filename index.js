import express, { urlencoded } from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

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
  console.log('/note GET request came in! ---')

  res.render('note');
});

// Note - POST. 
app.post('/note', (req, res) => {
  console.log('/note POST request came in! ---')

  const formDetails = req.body;
  const insertIntoNotesQuery = `
  INSERT INTO notes
  (date, time, day, duration, behaviour, habitat, flocksize)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *`;
  const values = Object.values(formDetails); // => [ 'date', 'time', 'day', 'duration', 'behaviour', 'habitat', 'flocksize' ]

  // Send our INSERT INTO query to DB, & redirect user to indiviudal completed form page.
  pool.query(insertIntoNotesQuery, values, (err, result) => {
    if (err) {
      console.log("insertIntoNotesQuery error: ----", err.stack);
    } 
    let index = result.rows[0].id;
    console.log("insertIntoNotesQuery results:\n ---- ", result.rows);

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
  const selectQuery = `SELECT * FROM notes WHERE id = ${id}`

  pool.query(selectQuery, (err, result) => {
    if (err) {
      console.log("selectQuery error: ----", err.stack)
    }
    const sightingNotes = result.rows[0]

    res.render('note-id-edit', { sightingNotes })
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
  console.log('/ root request came in! ---');

  const sqlQuery = `SELECT * FROM notes`

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log('Error executing SQL query: ---', err.stack);
      res.status(503).send("Not working!");
      return;
    }
    console.log("Query result: ---", result.rows);
    const sightingsList = result.rows;
    
    res.render('root', { sightingsList } );
  });
});

app.listen(PORT, (err) => {
  if (err) {
    console.log('Trouble connecting to PORT');
  }
  console.log('Connected successfullly to port ', PORT);
});