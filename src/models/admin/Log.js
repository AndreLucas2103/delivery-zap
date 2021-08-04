const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
*/

const Log = new Schema({
    text: String,
    date: Date,
    code: String,
    description: String,

},{ timestamps: true})

mongoose.model("logs", Log)
