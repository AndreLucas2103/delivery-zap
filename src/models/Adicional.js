const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Adicional = new Schema({
    nome: String,
    valor: Number,

    idCategoriaAdicional: {
        type: Schema.Types.ObjectId,
        ref: "categoriaAdicionais",
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

mongoose.model("adicionais", Adicional)
