const express = require('express');
const cors = require('cors');
const auditRoutes = require('./routes/audit.routes');
const errorMiddleware = require('./utils/errorMiddleware');
const AppError = require('./utils/AppError');

const app = module.exports = express();

app.use(cors());
app.use(express.json());

app.use('/api', auditRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Unmatched routes → clean 404 instead of Express's default HTML error page.
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404, 'NOT_FOUND'));
});

app.use(errorMiddleware);