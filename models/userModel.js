import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcrypt';
import logger from '../logger.js';

dotenv.config();

const { Client } = pg;
const saltRounds = 10;

const db = new Client({
    user: 'postgres',
    host: process.env.DO_HOST,
    database: process.env.DO_DB,
    password: process.env.DO_PG_PW,
    port: process.env.DO_DOCKER_PORT,
});

db.connect();

class UserModel {
    // Get all users
    static async getAll() {
        try {
            const result = await db.query('SELECT * FROM users');
            return result.rows;
        } catch (error) {
            logger.error('Error fetching all users:', error);
            throw error;
        }
    }

    // Get user by email
    static async getFromEmail(email) {
        try {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error fetching user by email (${email}):`, error);
            throw error;
        }
    }

    // Check if a user exists
    static async checkExist(email) {
        try {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows.length > 0;
        } catch (error) {
            logger.error(`Error checking if user exists (${email}):`, error);
            throw error;
        }
    }

    // Get user's hashed password
    static async getUserHash(email) {
        try {
            const result = await db.query('SELECT hash FROM users WHERE email = $1', [email]);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error fetching hash for user (${email}):`, error);
            throw error;
        }
    }

    // Add a new user
    static async addUser(userName, password, email, role) {
        try {
            const hash = bcrypt.hashSync(password, saltRounds);
            const userExists = await this.checkExist(email);

            if (!userExists) {
                await db.query('INSERT INTO users (username, hash, email, role) VALUES ($1, $2, $3, $4)', [
                    userName,
                    hash,
                    email,
                    role,
                ]);
                return { success: true, message: 'User added successfully' };
            } else {
                logger.warn(`Attempted to add user that already exists (${email})`);
                return { success: false, message: 'User already exists' };
            }
        } catch (error) {
            logger.error('Error adding user:', error);
            throw error;
        }
    }

    // Log in user
    static async logIn(email, password) {
        try {
            const userExists = await this.checkExist(email);

            if (userExists) {
                const hash = await this.getUserHash(email);
                const match = await bcrypt.compare(password, hash.hash);

                if (match) {
                    logger.info(`User logged in successfully (${email})`);
                    return { success: true, message: 'Login successful' };
                } else {
                    logger.warn(`Password incorrect for user (${email})`);
                    throw new Error('Incorrect password');
                }
            } else {
                logger.warn(`Login attempted for non-existent user (${email})`);
                throw new Error('User does not exist');
            }
        } catch (error) {
            logger.error('Error during login:', error);
            throw error;
        }
    }

    // Check if user is logged in
    static async isLogged(req) {
        return req.session.authenticated === 'true';
    }

    // Get user count
    static async count() {
        try {
            const result = await db.query('SELECT * FROM users');
            return result.rowCount;
        } catch (error) {
            logger.error('Error fetching user count:', error);
            throw error;
        }
    }

    // Get user data for a given email and password
    static async getUserData(email, password) {
        try {
            const userExists = await this.checkExist(email);

            if (userExists) {
                const hash = await this.getUserHash(email);
                const match = await bcrypt.compare(password, hash.hash);

                if (match) {
                    return { email, password }; // Simplified user object
                } else {
                    logger.warn(`Password mismatch for user (${email})`);
                    throw new Error('Password does not match');
                }
            } else {
                logger.warn(`Data requested for non-existent user (${email})`);
                throw new Error('User not found');
            }
        } catch (error) {
            logger.error('Error fetching user data:', error);
            throw error;
        }
    }
}

export default UserModel;
