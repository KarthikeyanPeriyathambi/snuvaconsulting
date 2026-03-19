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

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const simulateFiltering = async () => {
  try {
    await sequelize.authenticate();
    
    const [importedRaw] = await sequelize.query(`
      SELECT js.job_selection_id, rd.title_role, rd.start_date, rd.end_date, rd.req_status 
      FROM job_selections js 
      LEFT JOIN requisition_details rd ON js.job_selection_id = rd.job_selection_id;
    `);

    const today = new Date();
    const todayStr = formatDate(today);
    console.log('Current Date (Local Simulation):', todayStr);

    console.log('\n--- Simulation Results ---');
    const filtered = importedRaw.map(j => {
      const status = j.req_status === 'Open' ? 'Open' : 'Closed';
      const startDateStr = formatDate(j.start_date);
      const endDateStr = formatDate(j.end_date);

      const isActive = status === 'Open';
      const started = !startDateStr || startDateStr <= todayStr;
      const notExpired = !endDateStr || endDateStr >= todayStr;
      const isVisible = isActive && started && notExpired;

      return {
          id: j.job_selection_id,
          title: j.title_role,
          start: startDateStr,
          end: endDateStr,
          status: status,
          isVisible: isVisible,
          reason: !isActive ? 'Inactive' : (!started ? 'Not started' : (!notExpired ? 'Expired' : 'OK'))
      };
    });

    console.table(filtered);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

simulateFiltering();
