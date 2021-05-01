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

    timeZone: {
        type: String,
        default: "-03:00"
    },

    estabelecimentoSelecionado: ObjectId,
    estabelecimentosVinculados: [{
        idEstabelecimento: ObjectId,
        cnpj: String,
        nome: String,
        url: String
    }],

    observacao: String,
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("usuarios", Usuario)
