import express from 'express'
import userModel from '../models/userModel.js'
import session, { Session } from 'express-session';
import passport from 'passport';
import localStrategy from '../strategies/local-strategy.mjs';
const router = express.Router();

router.get('/',async (req,res)=>{
    console.log("Session data at /:", req.session);

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
        res.send(true)
    }
    else{
        res.send(false)
    }
})
router.post('/user/logout',(req,res)=>{
    if(!req.user)res.sendStatus(401);
    else{
        req.logOut((err=>{
            if(err)res.sendStatus(400);
            res.sendStatus(200)
        }))
    }
})
router.get('/checkLogin',async(req,res)=>{
    console.log(req.sessionID)
    console.log(req.sessionStore.get(req.sessionID,(err,session)=>{
        console.log(session)
    }))
    res.send(200);
})
router.get('/count',async(req,res)=>{
    const result = await userModel.count();
    console.log(result)
    res.status(200).send({result})
})

export default router