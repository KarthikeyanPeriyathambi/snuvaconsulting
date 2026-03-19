import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00', // Use UTC to prevent date shifting
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected Successfully`);

    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database tables synchronized');
  } catch (error) {
    console.error(`Unable to connect to the database: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { sequelize };