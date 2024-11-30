import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import * as Minio from 'minio';
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

const minioClient = new Minio.Client({
  endPoint: process.env.DO_SPACES_ENDPOINT,
  useSSL: true,
  accessKey: process.env.DO_SPACES_ACCESS_ID,
  secretKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
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
    const fileStat = fs.statSync(file.path);

    try {
      const minioResponse = await new Promise((resolve, reject) => {
        minioClient.putObject('movies', movie.imdbID + '.mp4', fileStream, fileStat.size, (err, objInfo) => {
          if (err) {
            logger.error(`Error uploading file to MinIO: ${err}`);
            return reject(err);
          }
          resolve(objInfo);
        });
      });
      logger.info(`File uploaded to MinIO successfully: ${movie.imdbID}`);

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
        `https://console.tharupathir.live/browser/movies/${movie.imdbID}`,
        movie.Backdrop,
      ];
      const result = await db.query(query, values);
      logger.info(`Movie data inserted into database: ${movie.imdbID}`);

      return { message: 'File uploaded successfully', data: minioResponse };
    } catch (err) {
      logger.error(`Error uploading movie to MinIO: ${err}`);
      throw err;
    }
  }

  static async getPresignedUrl(movieId) {
    try {
      const url = await new Promise((resolve, reject) => {
        minioClient.presignedUrl('GET', 'movies', movieId + '.mp4', 24 * 60 * 60, (err, presignedUrl) => {
          if (err) {
            logger.error(`Error generating presigned URL for movieId ${movieId}: ${err}`);
            return reject(err);
          }
          resolve(presignedUrl);
        });
      });
      logger.info(`Presigned URL generated for movieId: ${movieId}`);
      return url;
    } catch (err) {
      logger.error(`Error generating presigned URL: ${err}`);
      throw err;
    }
  }

  static async deleteById(imdbID) {
    try {
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
