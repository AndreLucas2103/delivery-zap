const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const CategoriaProduto = new Schema({
    nome: String,

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("categoriaProdutos", CategoriaProduto)
