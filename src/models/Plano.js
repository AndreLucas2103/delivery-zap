const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
*/

const Plano = new Schema({
    nome: String,
    periodicidade: String,
    mesesPeriodicidade: Number,
    valor: Number,

    statusAtivo: {
        type: Boolean,
        default: true
    }
},{ timestamps: true})

mongoose.model("planos", Plano)
