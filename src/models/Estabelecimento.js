const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Estabelecimento = new Schema({
    nome: String,
    nomePainel:String,
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

    img: {
        capa: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
    },

    painel: {
        colorFundo:{
            type: String,
            default : "#FFFFFF"
        },
        colorFonte:{
            type: String,
            default : "#000000"
        },
    },

    integracao: {
        mercadoPago: {
            statusAtivo: {
                type: Boolean,
                default: false
            },
            testadoAtivo: Boolean,
            publickey: String,
            acessToken: String
        },
    },

    entrega: {
        taxaEntrega: Number,
        cepsDisponiveis: [{
            cep: String
        }]
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
