import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Environment Variables Loaded:');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

const checkDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const [results, metadata] = await sequelize.query("SHOW TABLES;");
    console.log('Tables in database:', results);

    for (const row of results) {
        const tableName = Object.values(row)[0];
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName};`);
        console.log(`Table ${tableName}: ${count[0].count} rows`);
        if (count[0].count > 0 && (tableName === 'jobs' || tableName === 'Jobs')) {
            const [jobs] = await sequelize.query(`SELECT title FROM ${tableName} LIMIT 5;`);
            console.log(`First few job titles:`, jobs.map(j => j.title));
        }
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
};

checkDB();
