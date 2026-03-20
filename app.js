var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

// 1. Load Environment Variables (Crucial for Hosting)
require('dotenv').config(); 

// 2. Import Database Connection and Routers
var connectDb = require('./config/connection');
var patientsRouter = require('./routes/patients');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

var app = express();

// 3. Connect to MongoDB
connectDb();

// 4. View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// 5. Global Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 6. Session Configuration
app.use(session({
  // Uses SESSION_SECRET from Render's environment variables
  secret: process.env.SESSION_SECRET || 'hms-secret-key', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 Hours
    secure: false // Set to true only if using a custom domain with SSL
  }
}));

// 7. Context Middleware (Makes 'user' available in all .hbs files)
app.use(function(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
});

// 8. Routes Setup
app.use('/auth', authRouter);
app.use('/patients', patientsRouter);
app.use('/users', usersRouter);
app.use('/', indexRouter);

// 9. Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// 10. Error Handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// 11. SERVER LISTENER (Absolute bottom)
// Render will automatically assign a PORT, otherwise it uses 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HMS Core Server is running on port ${PORT}`);
});

module.exports = app;