import passport from "passport";
import { Strategy } from "passport-local";
import userModel from "../models/userModel.js";

passport.serializeUser((user,done)=>{
    done(null,user.email)
})
passport.deserializeUser(async(email,done)=>{
    try{
        const user = await userModel.getFromEmail(email); // Await here
        if ( user) 
         done(null, user); // Pass the user object to done
        
    }catch(err){
        done(err,null)
    }
})
export default passport.use(
    new Strategy({usernameField:"email"},async(username,password,done)=>{
        console.log("Username:", username);
        console.log("Password:", password);

        try {
            const user = await userModel.getUserData(username, password); // Await here
            done(null, user); // Pass the user object to done
        } catch (err) {
            console.error('Error in strategy:', err.message);
            done(null, false, { message: err.message }); // Handle errors properly
        }
    })
)