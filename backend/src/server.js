require('dotenv').config();
const app = require('./app');
const { PORT } = require('./config/constants');

app.listen(PORT, () => {
  console.log(`Page Pulse API running on port ${PORT}`);
});