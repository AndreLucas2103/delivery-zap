const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Carrinho = new Schema({
    produtos: [{
        idProduto: {
            type: Schema.Types.ObjectId,
            ref: "produtos",
        },
        quantidade: Number
    }],

    uuid4Client: String,

    idUsuario: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    }

},{ timestamps: true})


mongoose.model("carrinhos", Carrinho)
