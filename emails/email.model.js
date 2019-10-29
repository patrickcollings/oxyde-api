const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    event_type: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Email', schema);