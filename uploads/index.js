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



dotenv.config();

const app = express();
const port = process.env.PORT ;

app.use(cors()); 
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized :  true,
    cookie:{
      maxAge : 1000 * 60 *60*24
    }
  }))


app.use(passport.initialize())
app.use(passport.session())
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('short'))
app.use('/movies',movieRouter)
app.use('/users',userRouter)


app.listen(port,()=>{
    console.log(`Server started on ${port} succesfully !`)
})