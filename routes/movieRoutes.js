import express from 'express'
import multer from 'multer'
import movieModel from '../models/movieModel.js'

const router = express.Router();
const upload = multer({dest:'uploads/'});

router.get('/count',async(req,res)=>{
    let count = await movieModel.getCount();
    res.send(count);
})
router.get('/toprated',async(req,res)=>{
    let result = await movieModel.getTopRated();
    res.send(result)
})
router.get('/:id',async(req,res)=>{
    let imdbId = req.params.id;
    let result = await movieModel.getById(imdbId);
    res.send(result)
})

router.get('/',async(req,res)=>{
    const result = await movieModel.getAll();
    res.send(result)
})
router.get('/title/:name',async(req,res)=>{
    let name = req.params.name;
    const result = await movieModel.getByTitle(name);
    res.send(result);
})

router.get('/genre/:genre',async(req,res)=>{
    const genre = req.params.genre;
    const result = await movieModel.getByGenre(genre)
    res.send(result)
})

router.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const movie = JSON.parse(req.body.data);
    console.log(movie);
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const result = await movieModel.uploadMovie(file,movie);
    } catch (err) {
        console.error('Error uploading file to S3:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
router.delete('/delete/:id',async(req,res)=>{
    const id =req.params.id;
    console.log(id)
    const result =  await movieModel.deleteById(id);
    res.send('succesfully deleted');
})



export default router;