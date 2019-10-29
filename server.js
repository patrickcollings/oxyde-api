require('rootpath')();
require('dotenv').config()

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const campaignService = require('./campaigns/campaign.service');
const emailService = require('./emails/email.service');

var Recaptcha = require('express-recaptcha').RecaptchaV3;
//import Recaptcha from 'express-recaptcha'
var recaptcha = new Recaptcha('6LfEtr4UAAAAAIvQyrgJi0K01l_5RrKk3YHe0RB2', '6LfEtr4UAAAAAI22Xoo373Y0GdK7RFc_PqA1nVvb');
//or with options
var options = { 'hl': 'en' };
var recaptcha = new Recaptcha('6LfEtr4UAAAAAIvQyrgJi0K01l_5RrKk3YHe0RB2', '6LfEtr4UAAAAAI22Xoo373Y0GdK7RFc_PqA1nVvb', options);


const origins = process.env.NODE_ENV === 
    'production' ? ['https://dashboard.oxydetechnologies.com', 'https://www.oxydetechnologies.com', 'https://oxyde-phishing.herokuapps.com'] :
        ['http://localhost:4200', 'http://localhost:4444', 'http://localhost:4222'];

app.use(cors({
    origin: origins
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use('/manager', require('./managers/manager.controller'));
app.use('/employee', require('./employees/employee.controller'));
app.use('/campaign', require('./campaigns/campaign.controller'));
app.use('/email', require('./emails/email.controller'));

app.post('/recaptcha', recaptcha.middleware.verify, function (req, res) {
    if (!req.recaptcha.error) {
        // success code
        console.log("Success");
        res.send(200);
    } else {
        // error code
        console.log(req.recaptcha.error);
        res.send(500);
    }
});

// global error handler
app.use(errorHandler);

setInterval(campaignService.checkCampaign, 30000);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, function () {
    console.log('Server listening on port ' + port);
});

module.exports = app;
