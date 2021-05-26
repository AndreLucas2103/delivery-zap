const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const ModeloOpcao = new Schema({
    nome: String,
    descricao: String,

    obrigatorio: {
        type: Boolean,
        default: true
    },

    opcoes: [{
        nome: String,
        valor: Number
    }],

    vinculoProduto: Boolean,
    dividendo: {
        type: Number,
        default: 1
    },
    opcoesProduto: [{
        idProduto: {
            type: Schema.Types.ObjectId,
            ref: "produtos",
        },
    }],
    
    multiplaEscolha: Boolean,
    
    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("modeloOpcoes", ModeloOpcao)
