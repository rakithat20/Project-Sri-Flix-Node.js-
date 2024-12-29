import pkg from 'aws-sdk';
const { S3 } = pkg;
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import logger from '../logger.js';

dotenv.config();

const { Client } = pg;
const db = new Client({
  user: 'postgres',
  host: process.env.DO_HOST,
  database: process.env.DO_DB,
  password: process.env.DO_PG_PW,
  port: process.env.DO_DOCKER_PORT,
});

const s3Client = new S3({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_ID,
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
  },
});

db.connect();

class movieModel {
  static async getCount() {
    try {
      const result = (await db.query('SELECT COUNT(*) FROM Movie')).rows[0];
      logger.info('Fetched movie count successfully');
      return result.count;
    } catch (err) {
      logger.error(`Error fetching movie count: ${err}`);
      throw err;
    }
  }

  static async getTopRated() {
    try {
      const result = (await db.query('SELECT * FROM Movie ORDER BY imdbrating DESC')).rows;
      logger.info('Fetched top-rated movies successfully');
      return result;
    } catch (err) {
      logger.error(`Error fetching top-rated movies: ${err}`);
      throw err;
    }
  }

  static async getById(imdbID) {
    try {
      const result = await db.query('SELECT * FROM Movie WHERE imdbID = $1;', [imdbID]);
      logger.info(`Fetched movie by ID: ${imdbID}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Error fetching movie by ID ${imdbID}: ${err}`);
      throw err;
    }
  }

  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM Movie;');
      logger.info('Fetched all movies successfully');
      return result.rows;
    } catch (err) {
      logger.error(`Error fetching all movies: ${err}`);
      throw err;
    }
  }

  static async getByTitle(name) {
    try {
      const result = await db.query('SELECT * FROM Movie WHERE title ILIKE $1', [`%${name}%`]);
      logger.info(`Fetched movies by title: ${name}`);
      return result.rows;
    } catch (err) {
      logger.error(`Error fetching movies by title "${name}": ${err}`);
      throw err;
    }
  }

  static async getByGenre(genre) {
    try {
      const result = await db.query('SELECT * FROM Movie WHERE genre ILIKE $1', [`%${genre}%`]);
      logger.info(`Fetched movies by genre: ${genre}`);
      return result.rows;
    } catch (err) {
      logger.error(`Error fetching movies by genre "${genre}": ${err}`);
      throw err;
    }
  }
  static async uploadMovie(file, movie) {
    const fileStream = fs.createReadStream(file.path);
  
    try {
      // Check if the movie already exists in the database
      const existingMovie = await db.query('SELECT * FROM Movie WHERE imdbID = $1', [movie.imdbID]);
      if (existingMovie.rows.length > 0) {
        logger.error(`Duplicate movie ID found: ${movie.imdbID}`);
        throw new Error(`Movie with ID ${movie.imdbID} already exists`);
      }
  
      // Upload to S3
      const s3Response = await s3Client
        .upload({
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: `${movie.imdbID}.mp4`,
          Body: fileStream,
          ContentType: 'video/mp4',
          ACL:'public-read'
        })
        .promise();
      logger.info(`File uploaded to S3 successfully: ${movie.imdbID}`);
      
      fs.unlink(file.path, (err) => {
        if (err) {
          logger.error(`Error deleting local file ${file.path}: ${err}`);
        } else {
          logger.info(`Local file deleted successfully: ${file.path}`);
        }
      });
      // Insert into the database
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
        `https://moviesb.sgp1.cdn.digitaloceanspaces.com/${movie.imdbID}.mp4`,
        movie.Backdrop,
      ];
      await db.query(query, values);
  
      logger.info(`Movie data inserted into database: ${movie.imdbID}`);
      return { message: 'File uploaded successfully', data: s3Response };
    } catch (err) {
      logger.error(`Error uploading movie to S3: ${err}`);
      throw err;
    }
  }
  

  static async getPresignedUrl(movieId) {
    try {
      const res = await db.query('SELECT cdnpath FROM Movie WHERE imdbid = $1', [movieId])
      if (res.rows.length === 0) {
        throw new Error(`No movie found with ID: ${movieId}`);
      }
      else{
        const url = res.rows;
        return url
      }
      
    } catch (err) {
      logger.error(`Error Getting presigned URL: ${err}`);
      throw err;
    }
  }

  static async deleteById(imdbID) {
    try {
      await s3Client
        .deleteObject({
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: `${imdbID}.mp4`,
        })
        .promise();

      const result = await db.query('DELETE FROM Movie WHERE imdbid = $1', [imdbID]);
      logger.info(`Deleted movie with ID: ${imdbID}`);
      return result;
    } catch (err) {
      logger.error(`Error deleting movie with ID ${imdbID}: ${err}`);
      throw err;
    }
  }
}

export default movieModel;
