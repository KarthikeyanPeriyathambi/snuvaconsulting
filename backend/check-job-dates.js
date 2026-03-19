import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

const checkJobDates = async () => {
  try {
    await sequelize.authenticate();
    console.log('--- Checking requisition_details titles and dates ---');
    const [results] = await sequelize.query("SELECT details_id, title_role, start_date, end_date, req_status FROM requisition_details;");
    console.table(results);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('Current Date (UTC):', todayStr);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

checkJobDates();
