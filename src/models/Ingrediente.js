const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Ingrediente = new Schema({
    nome: String,

    estabelecimentos: [{
        idEstabelecimento: ObjectId
    }],

    categoriasProdutos: [{
        idCategoriaProduto: ObjectId
    }],

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("ingredientes", Ingrediente)



