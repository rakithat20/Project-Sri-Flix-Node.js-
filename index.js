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
import logger from './logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000

// Logger for requests
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// CORS Middleware
app.use(cors({
  origin: ['https://sriflix.tharupathir.live', 'http://localhost:3001'], // Allow multiple origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow cookies
}));

// Trust proxy for cookies and sessions in production
app.set('trust proxy', 1);

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: {
    path: '/',
    maxAge: 60000 * 60, // 1 hour
    httpOnly: true, // Prevent client-side access to cookies
    sameSite: 'lax', // Adjust for your frontend-backend interaction
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  },
  store: new (connectPgSimple(session))({
    conString: `postgres://${process.env.DB_USER}:${process.env.DO_PG_PW}@${process.env.DO_HOST}:${process.env.DO_DOCKER_PORT}/${process.env.DO_DB}`,
  }),
}));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Middleware
const upload = multer({ dest: 'uploads/' });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/movies', movieRouter);
app.use('/users', userRouter);

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message} at ${req.method} ${req.url} from ${req.ip}`);
  res.status(500).send('Internal Server Error');
});

// Start Server
app.listen(port, () => {
  logger.info(`Server started on port ${port} successfully!`);
  console.log(`Server started on port ${port} successfully!`);
});
