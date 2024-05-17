import pg from 'pg';
import aws from 'aws-sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';

dotenv.config();
const upload = multer({ dest: 'uploads/' });


const { Client } = pg;
const db = new Client({
    user: 'postgres',
    host: process.env.DO_HOST,
    database: process.env.DO_DB,
    password: process.env.DO_PG_PW,
    port: process.env.DO_DOCKER_PORT,
});

const awsS3Client = new aws.S3({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: 'nyc3',
    credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_ID,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY
    }
});

db.connect();
class movieModel{
    static async getCount(){
        const result = (await db.query("SELECT COUNT (*)FROM Movie")).rows[0];
        return result.count;
    }
    static async getTopRated(){
        const result = (await db.query("SELECT * FROM Movie ORDER BY imdbrating DESC")).rows;
        return result;
    }
    static async getById(imdbID){
        const result = await db.query("SELECT * FROM Movie WHERE imdbID = $1;",[imdbID]);
        return result.rows[0];
    }
    static async getAll(){
        const result = await db.query("SELECT * FROM Movie;");
        return result.rows;
    }
    static async getByTitle(name){
        const result = await db.query("SELECT * FROM Movie WHERE title ILIKE $1",[`%${name}%`]);
        return result.rows;
    }
    static async getByGenre(genre){
        const result = await db.query("SELECT * FROM Movie WHERE genre ILIKE $1",[`%${genre}%`]);
        return result.rows
    }
    static async uploadMovie(file , movie){
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
        return status(200).json({ message: 'File uploaded successfully', data: s3Response });
    }
    static async deleteById(imdbID){
        console.log(imdbID)
        const result =  await db.query("DELETE FROM Movie WHERE imdbid = $1",[imdbID])
        return result;
    }
}

export default movieModel