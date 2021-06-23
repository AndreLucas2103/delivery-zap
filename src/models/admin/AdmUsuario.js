const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
*/

const Usuarioadm = new Schema({
    primeiroNome: String,
    nomeCompleto: String,
    email: String,
    senha: String,
    cpf: String,
    perfilAvatar: String,

    administracao: {
        type: Boolean,
        default: true
    },

    timeZone: {
        type: String,
        default: "-03:00"
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("admUsuarios", Usuarioadm)
