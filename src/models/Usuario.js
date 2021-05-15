const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    eTipo: {
        5: administrador
        6: funcionario
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
    eTipoAdmin: Boolean,
    usuarioMaster: {
        type: Boolean,
        default: false
    },

    timeZone: {
        type: String,
        default: "-03:00"
    },

    idUsuarioMaster: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },
    identificaouuidv4: String,

    estabelecimentosSelecionados: [{
        idEstabelecimento: {
            type: Schema.Types.ObjectId,
            ref: "estabelecimentos",
        },
    }],
    estabelecimentosVinculados: [{
        idEstabelecimento: {
            type: Schema.Types.ObjectId,
            ref: "estabelecimentos",
        },
    }],

    observacao: String,
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("usuarios", Usuario)
