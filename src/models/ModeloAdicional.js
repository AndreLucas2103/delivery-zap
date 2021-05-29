const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const ModeloAdicional = new Schema({
    nome: String,

    adicionais: [{
        idAdicional: {
            type: Schema.Types.ObjectId,
            ref: "adicionais",
        },
        idCategoriaAdicional: {
            type: Schema.Types.ObjectId,
            ref: "categoriaAdicionais",
        }
    }],
    
    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("modeloAdicionais", ModeloAdicional)
