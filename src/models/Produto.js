const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Produto = new Schema({
    nome: String,
    valor: Number,
    descricao: String,
    
    ingredientes: [{
        idIngrediente: ObjectId,
        nome: String
    }],
    adicionais: [{
        idAdicional: ObjectId,
        nome: String,
        valor: Number
    }],

    opcao: [{
        nome: String,
        descricao: String,
        opcoes: [{
            nome: String,
            valor: Number
        }],
        multiplaEscolha: Boolean
    }],

    promocao: Boolean,
    valorPromocao: Boolean,
    
    idCategoriaProduto: {
        type: Schema.Types.ObjectId,
        ref: "categoriaProdutos",
    },

    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("produtos", Produto)



