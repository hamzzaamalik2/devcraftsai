const mongoose = require('mongoose');

const userCaseSchema = new mongoose.Schema({
    userID:{type: String},
    name:{type: String},
    email:{type: String},
    tour_guide:{type: Boolean,default: false,}
})


const user = mongoose.model('user' , userCaseSchema);

module.exports = user;