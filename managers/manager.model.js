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
    reset: {
        token: { type: String, unique: true },
        expires: { type: Date }
    },
    verified: { type: Boolean, default: false },
    whitelisted: { type: Boolean, default: false },
    emailTested: { type: Boolean, default: false },
    quizCompleted: { type: Boolean, default: false },
    quiz: {
        companyName: { type: String },
        companyDomain: { type: String },
        managerName: { type: String },
        businessSector: { type: String },
        difficulty: { type: String, default: 2 },
        officeHours: { type: Array, default: [9,17] },
        employeeScammedBefore: { type: Boolean, default: false },
        employeeGoodTechnicalSkills: { type: Boolean, default: false },
        smallBusiness: { type: Boolean, default: false },
        mediumBusiness: { type: Boolean, default: false },
        largeBusiness: { type: Boolean, default: false },
        techDepartment: { type: Boolean, default: false },
        emailProvider: { type: String }
    },
    accountDetailsCompleted: { type: Boolean, default: false }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Manager', schema);