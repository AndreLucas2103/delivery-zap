const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Estabelecimento = new Schema({
    nome: String,
    url: String,
    endereco: {
        rua: String,
        bairro: String,
        cidade: String,
        cep: String,
        numero: String,
        estado: String
    },
    cnpj: String,

    horarioFuncionamento: [{
        dia: String,
        inicio: String,
        fim: String
    }],
    
    mercadoPago: {
        publickey: String,
        acessToken: String
    },

    idUsuarioMaster: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("estabelecimentos", Estabelecimento)
