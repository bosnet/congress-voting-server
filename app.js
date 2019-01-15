const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const Sentry = require('@sentry/node');
const session = require('express-session');

const logger = require('./lib/logger');

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session
const sessionOption = {
  saveUninitialized: false,
  resave: false,
  name: 'boscoin.sid',
  secret: 'XxhA2.xapH#v7v8DX^sbpa&8',
  httpOnly: true,
  cookie: {},
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  // TODO: use postgreSQL
  // sessionOption.store = new RedisStore({
  //   host: process.env.SESSION_STORE_HOST,
  //   port: process.env.SESSION_STORE_PORT,
  // });
  sessionOption.cookie.secure = true;
}

app.use(session(sessionOption));

// APIs
app.use('/', require('./routes/index'));
app.use('/api/v1', require('./routes/v1/memberships'));
app.use('/api/v1', require('./routes/v1/proposals'));

// website
app.use('/', require('./routes/web/users'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});


if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  // TODO: error logging(sentry?)
  if (status >= 500) {
    logger.error(err);
  }
  res.status(status).json({
    error: err.message,
  });
});

module.exports = app;
