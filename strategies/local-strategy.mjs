import passport from "passport";
import { Strategy } from "passport-local";
import userModel from "../models/userModel.js";

passport.serializeUser((user,done)=>{
    done(null,user.email)
})
passport.deserializeUser(async(email,done)=>{
    try {
        const user = await userModel.getFromEmail(email); // Await the user retrieval
        if (user) {
            done(null, user); // Pass the user object if it exists
        } else {
            console.error('User not found during deserialization');
            done(null, false); // No user found, pass `false`
        }
    } catch (err) {
        console.error('Error during deserialization:', err.message);
        done(err, null); // Pass the error if something goes wrong
    }
    
})
export default passport.use(
    new Strategy({usernameField:"email"},async(username,password,done)=>{
        try {
            const user = await userModel.getUserData(username, password); // Await here
            done(null, user); // Pass the user object to done
        } catch (err) {
            console.error('Error in strategy:', err.message);
            done(null, false, { message: err.message }); // Handle errors properly
        }
    })
)