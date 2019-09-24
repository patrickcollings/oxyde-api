const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    email: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    completed_campaigns: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
    current_campaign: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    manager: { type: Schema.Types.ObjectId, ref: 'Manager', required: true}
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Employee', schema);