import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt, { hash } from 'bcrypt'

const { Client } = pg;
const saltRounds = 10;
const db = new Client({
    user: 'postgres',
    host: process.env.DO_HOST,
    database: process.env.DO_DB,
    password: process.env.DO_PG_PW,
    port: process.env.DO_DOCKER_PORT,
});


dotenv.config();
db.connect();


class userModel{
    static async getAll(){
        const result =  await db.query("SELECT * FROM users")
        return result.rows;
    }
    static async getFromEmail(email){
        const result = await db.query("SELECT * FROM users WHERE email = $1",[email])
       return(result.rows[0])
    }

    static async checkExist(email){
        const result = await db.query("SELECT * FROM users WHERE email = $1",[email])
        if(result.rows.length===0){
            return false
        }
        else{
            return true
        }
    }
    static async getUserHash(email){
            const result = await db.query("SELECT hash FROM users WHERE email = $1",[email]);
            return result.rows[0];
    }
    static async addUser(userName,password,email,role){
        try {
            const hash = bcrypt.hashSync(password, saltRounds);
            const checkExist = await this.checkExist(email);

            if (!checkExist) {
                const result = await db.query("INSERT INTO users (username, hash, email, role) VALUES ($1, $2, $3, $4)", [userName, hash, email, role]);
                return result.rows[0];
            } else {
                console.log('User already exists');
                return null;
            }
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }
    static async logIn(email, password) {
        try {
            const userExists = await this.checkExist(email);
            if (userExists) {
                const hash = await this.getUserHash(email);
                const match = await bcrypt.compare(password, hash.hash);
                if (match) {
                    return true;
                } else {
                    console.log('Password incorrect');
                    throw new Error("Incorrect PW")
                    return false;
                }
            } else {
                console.log('User does not exist');
                throw new Error("User Does not exist")
                return false;
            }
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }
    static async isLogged(req){
        return req.session.authenticated==='true'
        
    }
    static async count(){
        const result = await db.query("SELECT * FROM users");
        return result.rowCount; 
    }


    
 static async getUserData(email, password) {
    try {
        const userExists = await this.checkExist(email); // Await here
        if (userExists) {
            const userHash = await this.getUserHash(email); // Await here
            const match = await bcrypt.compare(password, userHash.hash); // Await here
            if (match) {
                return { email, password }; // User object
            } else {
                throw new Error('Password does not match');
            }
        } else {
            throw new Error('User not found');
        }
    } catch (err) {
        console.error('Error in getUserData:', err.message);
        throw err;
    }
  }
}

export default userModel;