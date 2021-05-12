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
        idEstabelecimento: ObjectId
    }],
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("entregadores", Entregador)
