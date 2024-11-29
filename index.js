import express from 'express';
import bodyParser  from 'body-parser';
import morgan from 'morgan';
import multer from 'multer';
import cors from 'cors'
import movieModel from './models/movieModel.js';
import movieRouter from './routes/movieRoutes.js';
import userRouter from './routes/userRoutes.js';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import './strategies/local-strategy.mjs';
import connectPgSimple from 'connect-pg-simple';


dotenv.config();

const app = express();
const port = process.env.PORT ;

app.use(cors()); 
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized :  false,
    cookie:{
      maxAge : 60000 * 60 
    },
    store: new (connectPgSimple(session))({
      conString:`postgres://${process.env.DB_USER}:${process.env.DO_PG_PW}@${process.env.DO_HOST}:${process.env.DO_DOCKER_PORT}/${process.env.DO_DB}`
    }),
  }))

app.use(passport.initialize())
app.use(passport.session())
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'))
app.use('/movies',movieRouter)
app.use('/users',userRouter)


app.listen(port,()=>{
    console.log(`Server started on ${port} succesfully !`)
})