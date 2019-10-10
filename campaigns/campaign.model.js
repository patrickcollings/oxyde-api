const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    length: { type: Number, required: true },
    employees: [
        {
            id: {type: Schema.Types.ObjectId, ref: 'Employee'},
            caught: { type: Number, default: 0 }
        }
    ],
    phished: { type: Number },
    avoided: { type: Number },
    domain:  { type: String },
    emailProvider: { type: String },
    manager: { type: Schema.Types.ObjectId, ref: 'Manager', required: true },
    companyName: { type: String }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', schema);