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
                    console.log(password);
                    return true;
                } else {
                    console.log('Password incorrect');
                    return false;
                }
            } else {
                console.log('User does not exist');
                return false;
            }
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }
    static async isLogged(req){
        return req.isAuthenticated();
        
    }
    static async count(){
        const result = await db.query("SELECT * FROM users");
        return result.rowCount; 
    }


    
 static async getUserData(access_token) {

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    
    //console.log('response',response);
    const data = await response.json();
    console.log('data',data);
  }
}

export default userModel;