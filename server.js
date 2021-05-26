const express = require('express');
const logger = require('morgan');
const mongoose = require('mongoose');
const compression = require('compression');

const PORT = 3000;

const app = express();

app.use(logger('dev'));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));

// connecting to mongodb atlas or local db
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/budget", {
  // allowing app to fall back to old parser incase of bug finds
  useNewUrlParser: true,
  // removes connection options that are no longer relevant with new topology engine
  useUnifiedTopology: true,
  // using mongoose default engine build
  useCreateIndex: true,
  // using native findOneAndUpdate()
  useFindAndModify: false,
});

// routes
app.use(require('./routes/api.js'));

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
