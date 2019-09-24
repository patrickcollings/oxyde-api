const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    length: { type: Number, required: true },
    employees: [{type: Schema.Types.ObjectId, ref: 'Employee'}],
    phished: { type: Number },
    avoided: { type: Number },
    manager: { type: Schema.Types.ObjectId, ref: 'Manager', required: true }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', schema);