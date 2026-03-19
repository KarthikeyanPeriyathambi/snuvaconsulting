import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
  '',
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

const findJobInAnyDB = async () => {
  try {
    await sequelize.authenticate();
    const [databases] = await sequelize.query("SHOW DATABASES;");
    
    for (const dbRow of databases) {
      const dbName = dbRow.Database;
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) continue;
      
      console.log(`Checking database: ${dbName}`);
      try {
        const dbConn = new Sequelize(
          dbName,
          process.env.DB_USER,
          process.env.DB_PASSWORD,
          {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            dialect: 'mysql',
            logging: false,
          }
        );
        
        const [tables] = await dbConn.query("SHOW TABLES;");
        const hasJobsTable = tables.some(t => Object.values(t)[0].toLowerCase() === 'jobs');
        
        if (hasJobsTable) {
          const [count] = await dbConn.query("SELECT COUNT(*) as count FROM jobs;");
          console.log(`  Table jobs exists. Row count: ${count[0].count}`);
          if (count[0].count > 0) {
            const [jobs] = await dbConn.query("SELECT title FROM jobs LIMIT 1;");
            console.log(`  Sample job: ${jobs[0].title}`);
          }
        }
        await dbConn.close();
      } catch (e) {
        console.log(`  Could not access ${dbName}: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
};

findJobInAnyDB();
