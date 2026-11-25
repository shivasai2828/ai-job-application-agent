const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
// just adding logs 

app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv === 'development') app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Job outreach API is running' });
});

app.use('/api', require('./routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
