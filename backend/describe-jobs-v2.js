import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

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

const describeJobs = async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("DESCRIBE jobs;");
    fs.writeFileSync('jobs-schema.json', JSON.stringify(results, null, 2));
    console.log('Schema written to jobs-schema.json');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

describeJobs();
