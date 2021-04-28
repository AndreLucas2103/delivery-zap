const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    eTipo: {
        1: administrador
        2: funcionario
    }
*/

const Usuario = new Schema({
    primeiroNome: String,
    nomeCompleto: String,
    email: String,
    senha: String,
    cpf: String,
    perfilAvatar: String,

    eTipo: Number,
    usuarioMaster: {
        type: Boolean,
        default: false
    },

    estabelecimentos: [{
        idEstabelecimento: ObjectId
    }],

    observacao: String,
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("usuarios", Usuario)
