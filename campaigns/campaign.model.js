const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    endTime: { type: Date, required: true },
    length: { type: Number, required: true },
    employees: [
        {
            id: {type: Schema.Types.ObjectId, ref: 'Employee'},
            caught: { type: Boolean, default: false },
            emailOpened: { type: Number, default: 0},
            linkOpened: { type: Number, default: 0}
        }
    ],
    phished: { type: Number, default: 0 },
    avoided: { type: Number, default: 0 },
    domain:  { type: String, required: true },
    manager: { type: Schema.Types.ObjectId, ref: 'Manager', required: true },
    fromName: { type: String, required: true },
    startTime: { type: Date, required: true },
    templateId: { type: String, required: true },
    dynamic_template_data: { type: Object },
    active: { type: Boolean, default: false },
    complete: { type: Boolean, default: false },
    report: {
        totalOpenedLinks: { type: Number, default: 0 },
        totalEmployeesOpenedLinks: { type: Number, default: 0 },
        totalEmployeesCaught: { type: Number, default: 0 },
        percentageLinksOpened: { type: Number, default: 0},
        percentageCaught: { type: Number, default: 0 },
        file_URL: { type: String } 
    }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', schema);