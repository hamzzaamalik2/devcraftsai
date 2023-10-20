const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    testName: {type: String},
    testURL: {type: String},
    testTodo: {type: String},
    expectedResult: {type: String},
    eventSteps: Array,
    mainSteps: {type: String},
    testcaseBody: {type: String},
    testcaseOutput: {type: String},
    authorization: {type: String},
    loginurl: {type: String},
    username: {type: String},
    password: {type: String},
})


const testcase = mongoose.model('testcase' , testCaseSchema);

module.exports = testcase;