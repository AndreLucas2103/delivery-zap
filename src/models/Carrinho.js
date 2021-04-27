const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Carrinho = new Schema({
    idProduto: {
        type: Schema.Types.ObjectId,
        ref: "categoriaProdutos",
    },

},{ timestamps: true})


mongoose.model("carrinhos", Carrinho)
