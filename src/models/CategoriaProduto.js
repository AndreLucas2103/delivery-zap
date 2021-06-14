const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const CategoriaProduto = new Schema({
    nome: String,

    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    },

    statusAtivo: {
        type: Boolean,
        default: true
    },

    corBotao: {
        type: String,
        default: "#F0A431"
    }

},{ timestamps: true})

mongoose.model("categoriaProdutos", CategoriaProduto)
