const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const logger = require('morgan');

const app = express();

const decryption = require('./routes/decryption');
const port = process.env.PORT || 3000;
const host = '0.0.0.0';

app.use(express.json());
app.use(logger('dev'));

app.use('/', decryption);

app.listen(port, host, () => console.log(`Listening on port: ${port}`));
