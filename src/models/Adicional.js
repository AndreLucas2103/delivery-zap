const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Adicional = new Schema({
    nome: String,
    valor: Number,

    categoriasAdicionais: [{
        idCategoriaAdicional: ObjectId
    }],

    estabelecimentos: [{
        idEstabelecimento: ObjectId
    }],
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("adicionais", Adicional)
