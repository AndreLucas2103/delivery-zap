const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Entregador = new Schema({
    nome: String,
    observacao: String,

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("entregadores", Entregador)
