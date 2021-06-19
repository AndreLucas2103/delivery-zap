const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Entregador = new Schema({
    nome: String,
    observacao: String,
    perfilAvatar: String,

    estabelecimentos: [{
        idEstabelecimento: {
            type: Schema.Types.ObjectId,
            ref: "estabelecimentos",
        }
    }],
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("entregadores", Entregador)
