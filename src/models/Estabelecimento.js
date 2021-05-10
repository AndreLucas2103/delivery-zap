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

    img: {
        capa: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
    },

    painel: {
        selectedImgFundo: Boolean,
        imgfundo: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
        colorFundo: {
            hex: {
                type: String,
                default: '360000'
            }
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
