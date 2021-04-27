const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const CategoriaAdicional = new Schema({
    nome: String,

    estabelecimentos: [{
        idEstabelecimento: ObjectId
    }],

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("categoriaAdicionais", CategoriaAdicional)
