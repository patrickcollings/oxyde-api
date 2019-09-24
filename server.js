require('rootpath')();
require('dotenv').config()

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use('/manager', require('./managers/manager.controller'));
app.use('/employee', require('./employees/employee.controller'));
app.use('/campaign', require('./campaigns/campaign.controller'));

// global error handler
app.use(errorHandler);

app.use(cors({
    origin: process.env.ANGULAR_URL
}));

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, function () {
    console.log('Server listening on port ' + port);
});

module.exports = app;
