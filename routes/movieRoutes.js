import express from 'express';
import multer from 'multer';
import movieModel from '../models/movieModel.js';
import logger from '../logger.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Route to get the total count of movies
router.get('/count', async (req, res) => {
  try {
    const count = await movieModel.getCount();
    logger.info('GET /count - Movie count retrieved successfully');
    res.send(count);
  } catch (err) {
    logger.error(`GET /count - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get top-rated movies
router.get('/top-rated', async (req, res) => {
  try {
    const topRated = await movieModel.getTopRated();
    logger.info('GET /top-rated - Top-rated movies retrieved successfully');
    res.json(topRated);
  } catch (err) {
    logger.error(`GET /top-rated - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get a movie by its ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const movie = await movieModel.getById(id);
    if (!movie) {
      logger.warn(`GET /${id} - Movie not found`);
      return res.status(404).json({ message: 'Movie not found' });
    }
    logger.info(`GET /${id} - Movie retrieved successfully`);
    res.json(movie);
  } catch (err) {
    logger.error(`GET /${id} - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await movieModel.getAll();
    logger.info('GET / - All movies retrieved successfully');
    res.json(movies);
  } catch (err) {
    logger.error(`GET / - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to search movies by title
router.get('/title/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const movies = await movieModel.getByTitle(name);
    logger.info(`GET /title/${name} - Movies retrieved successfully`);
    res.json(movies);
  } catch (err) {
    logger.error(`GET /title/${name} - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to search movies by genre
router.get('/genre/:genre', async (req, res) => {
  const { genre } = req.params;
  try {
    const movies = await movieModel.getByGenre(genre);
    logger.info(`GET /genre/${genre} - Movies retrieved successfully`);
    res.json(movies);
  } catch (err) {
    logger.error(`GET /genre/${genre} - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to upload a movie
router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const movie = req.body;

  if (!file || !movie) {
    logger.warn('POST /upload - File or movie data missing');
    return res.status(400).json({ message: 'File or movie data missing' });
  }

  try {
    const response = await movieModel.uploadMovie(file, movie);
    logger.info(`POST /upload - Movie ${movie.imdbID} uploaded successfully`);
    res.json(response);
  } catch (err) {
    logger.error(`POST /upload - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to generate a presigned URL for movie download
router.get('/presigned-url/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const url = await movieModel.getPresignedUrl(id);
    logger.info(`GET /presigned-url/${id} - Presigned URL generated successfully`);
    res.json({ presignedUrl: url });
  } catch (err) {
    logger.error(`GET /presigned-url/${id} - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to delete a movie by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await movieModel.deleteById(id);
    if (result.rowCount === 0) {
      logger.warn(`DELETE /${id} - Movie not found`);
      return res.status(404).json({ message: 'Movie not found' });
    }
    logger.info(`DELETE /${id} - Movie deleted successfully`);
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    logger.error(`DELETE /${id} - Error: ${err}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
