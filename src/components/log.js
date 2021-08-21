
const mongoose = require("mongoose");

require("../models/admin/Log")
const Log = mongoose.model("logs")

module.exports = {
    registerLog: function(props){
        new Log({
            'text': props.text,
            'date': new Date(),
            'code': props.code,
            'description': props.description,
            'obj': props.obj,
        }).save().then( () => {
            return {status: 200}
        }).catch(err => {
            return { status: 500}
        })
    }
}
