const config = require('config.json');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.connectionString, { useCreateIndex: true, useNewUrlParser: true });
mongoose.Promise = global.Promise;

module.exports = {
    Manager: require('../managers/manager.model'),
    Employee: require('../employees/employee.model'),
    Campaign: require('../campaigns/campaign.model'),
    Email: require('../emails/email.model')
};