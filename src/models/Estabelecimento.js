const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Estabelecimento = new Schema({
    nome: String,
    url: String,
    endereco: {
        logradouro: String,
        bairro: String,
        localidade: String,
        cep: String,
        numero: String,
        uf: String
    },
    cnpj: String,
    telefone: String,
    

    horarioFuncionamento: [{
        dia: String,
        inicio: String,
        fim: String
    }],

    cores: {
        fundo: {
            name: String,
            rgb: String,
            hex: String,
        }
    },
    
    img: {
        capa: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
        fundo: {
            name: String,
            size: Number,
            key: String,
            url: String
        }
    },

    useMercadoPago: {
        type: Boolean,
        default: false
    },
    mercadoPago: {
        ativo: Boolean,
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
