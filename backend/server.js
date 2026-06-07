const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/users', require('./routes/users'));
app.use('/api/families', require('./routes/families'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/points', require('./routes/points'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/wishes', require('./routes/wishes'));
app.use('/api/rules', require('./routes/rules'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'Fast-Time Backend API' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
