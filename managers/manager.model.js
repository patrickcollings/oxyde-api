const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    email: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    employees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    companyName: { type: String },
    whitelistingSetup: { type: Boolean, default: false },
    emailTest: { type: Boolean, default: false },
    reset: {
        token: { type: String, unique: true },
        expires: { type: Date }
    },
    verified: { type: Boolean, default: false }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Manager', schema);