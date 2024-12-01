import express from 'express'
import userModel from '../models/userModel.js'
import passport from 'passport';
const router = express.Router();
import logger from '../logger.js';

router.get('/',async (req,res)=>{
    if (req.user) {
        const result = await userModel.getAll();
        res.send(result);
    } else {
        res.status(401).send('Unauthorized');
    }
    
})

router.post('/user',async (req,res)=>{
    let username = req.body.username
    let email = req.body.email
    let password = req.body.password
    let role = req.body.role

    const result = await userModel.addUser(username,password,email,role) 
    res.send(result)
})
router.post('/user/login',passport.authenticate('local'),async(req,res)=>{
    if(req.user){
        
        logger.info(`User logged in: ${req.user.email}`);
        res.send(true)
    }
    else{
        res.send(false)
    }
})
router.post('/user/logout',(req,res)=>{
    if(!req.user)res.sendStatus(401);
    else{
        console.log(req.user)
        logger.info(`User logged out: ${req.user.email}`);
        req.logOut((err=>{
            if(err)res.sendStatus(400);
            res.sendStatus(200)
        }))
    }
})
router.get('/checkLogin',async(req,res)=>{
    
    req.user?res.send(200):res.sendStatus(403)
})
router.get('/checkAdmin' ,(req,res)=>{
    if(req.user){
        req.user.role==='admin'?res.send({'role':'admin'}):res.send(401)
    }
    else{
        res.sendStatus(403)
    }
})
router.get('/count',async(req,res)=>{
    const result = await userModel.count();
    res.status(200).send({result})
})

router.post('/getemail',async(req,res)=>{
    const result = await userModel.getFromEmail(req.body.email)
    console.log(result);
    res.sendStatus(201)
})

export default router