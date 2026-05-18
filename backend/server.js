const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const socketService = require('./services/socket.service');

const authRoutes = require('./routes/auth.routes');
const wheelRoutes = require('./routes/wheel.routes');
const transactionRoutes = require('./routes/transaction.routes');

const app = express();
const server = http.createServer(app);

// Connect DB
connectDB();

// Init Socket.io
socketService.init(server);

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wheels', wheelRoutes);
app.use('/api/transactions', transactionRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
