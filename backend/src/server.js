const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { startScheduler } = require('./jobs/followUpJob');

const start = async () => {
  await connectDB();
  startScheduler();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

start();
