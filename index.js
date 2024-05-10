import express from 'express';
import bodyParser  from 'body-parser';
import pg from 'pg';
import morgan from 'morgan';
import aws from 'aws-sdk';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import cors from 'cors'
const { Client } = pg

dotenv.config();
const app = express();
const port = 3000;
const db = new pg.Client({
    user : 'postgres',
    host : 'localhost',
    database : 'moviedb',
    password : 'root',
    port : 5432
});
app.use(cors()); 

const awsS3Client = new aws.S3({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: 'nyc3',
    credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_ID,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY
    }
});
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'))
await db.connect();

app.get('/movies/count',async(req,res)=>{
    const result = (await db.query("SELECT COUNT (*)FROM Movie")).rows[0];
    console.log(result.count)
    res.send(result.count);
})
app.get('/movies/toprated',async(req,res)=>{
    const result = await db.query("SELECT * FROM Movie ORDER BY imdbrating DESC");
    res.send(result.rows);
})
app.get('/movies/:id',async(req ,res)=>{
    let imdbID = req.params.id;
    const result = await db.query("SELECT title FROM Movie WHERE imdbID = $1;",[imdbID]);
    res.send(result.rows[0])
})
app.get('/movies',async(req,res)=>{
    const result = await db.query("SELECT * FROM Movie;");
    res.send(result.rows)
})
app.get('/movies/title/:name',async(req,res)=>{
    let name = req.params.name;
    const result = await db.query("SELECT * FROM Movie WHERE title ILIKE $1",[`%${name}%`]);
    res.send(result.rows);
})
app.get('/movies/toprated',async(req,res)=>{
    const result = await db.query("SELECT * FROM Movie ORDER BY imdbrating DESC");
    res.send(result.rows);
})
app.get('/movies/genre/:genre',async(req,res)=>{
    const genre = req.params.genre;
    const result = await db.query("SELECT * FROM Movie WHERE genre ILIKE $1",[`%${g}%`])
})

app.post('/movies/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const movie = JSON.parse(req.body.data);
    console.log(movie);
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const s3Response = await awsS3Client.upload({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: movie.imdbID+'.mp4',
            Body: fs.createReadStream(file.path),
            ContentType: 'video/mp4',
            ACL:'public-read'
        }).promise();
        const query = `
            INSERT INTO movie ("title", "year", "rated", "released", "runtime", "genre", "actors", "plot", "country", "poster", "imdbrating", "imdbid", "cdnpath", "backdrop")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        const values = [
            movie.Title,
            movie.Year,
            movie.rated,
            movie.Released,
            movie.Runtime,
            movie.Genre,
            movie.Actors,
            movie.Plot,
            movie.Country,
            movie.Poster,
            movie.imdbRating,
            movie.imdbID,
            s3Response.Location,
            movie.Backdrop
        ];
        const result = await db.query(query, values);
        console.log(result)
        return res.status(200).json({ message: 'File uploaded successfully', data: s3Response });
    } catch (err) {
        console.error('Error uploading file to S3:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.delete('/movies/delete/:id',async(req,res)=>{
    const id =req.params.id;
    const result =  await db.query("DELETE * FROM Movie WHERE imdbid = $1",[id])
})

app.listen(port,()=>{
    console.log(`Server started on ${port} succesfully !`)
})