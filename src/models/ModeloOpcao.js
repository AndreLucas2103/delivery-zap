const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const ModeloOpcao = new Schema({
    nome: String,
    descricao: String,

    opcoes: [{
        nome: String,
        valor: Number
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

mongoose.model("modeloOpcoes", ModeloOpcao)
