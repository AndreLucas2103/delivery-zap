const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Revendedores = new Schema({
    primeiroNome: String,
    nomeCompleto: String,
    email: String,
    senha: String,
    cpf: String,
    telefone: String,

    endereco: {
        logradouro: String,
        bairro: String,
        localidade: String,
        cep: String,
        numero: String,
        uf: String
      },

    perfilAvatar: {
        type: String,
        default: "admin"
    },

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

mongoose.model("revendedores", Revendedores)