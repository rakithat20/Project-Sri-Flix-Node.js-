import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import multer from 'multer';
import cors from 'cors';
import movieRouter from './routes/movieRoutes.js';
import userRouter from './routes/userRoutes.js';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import './strategies/local-strategy.mjs';
import connectPgSimple from 'connect-pg-simple';
import { createLogger, format, transports } from 'winston';
import path from 'path';
import logger from './logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT;


app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Error logging middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message} at ${req.method} ${req.url} from ${req.ip}`);
  res.status(500).send('Internal Server Error');
});
app.use(cors({
  origin: 'https://sriflix.tharupathir.live', // Your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // If using cookies
}));
app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      path: '/',
      maxAge: 60000 * 60,
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
    },
    store: new (connectPgSimple(session))({
      conString: `postgres://${process.env.DB_USER}:${process.env.DO_PG_PW}@${process.env.DO_HOST}:${process.env.DO_DOCKER_PORT}/${process.env.DO_DB}`,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/movies', movieRouter);
app.use('/users', userRouter);

app.set('trust proxy', 1);

app.listen(port, () => {
  logger.info(`Server started on port ${port} successfully!`);
  console.log(`Server started on ${port} successfully!`);
});
