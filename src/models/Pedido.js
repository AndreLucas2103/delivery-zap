const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Pedido = new Schema({
    produtos: [{
        idProduto: ObjectId,
        nome: String,
        valor: Number,
        promocao: Boolean,

        opcoes: [{
            nome: String,
            valor: Number
        }],

        adicionais: [{
            idAdicional: ObjectId,
            nome: String,
            valor: Number
        }],

        idCategoriaProduto: {
            type: Schema.Types.ObjectId,
            ref: "categoriaProdutos",
        },

        observacao: String,
        valorProduto: Number
    }],

    retirarLocal: Boolean,
    delivery: Boolean,

    entrega: {
        idEntregador: {
            type: Schema.Types.ObjectId,
            ref: "entregadores",
        },

        taxaEntrega: Number,
    },

    valorTotal: Number,

    

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("pedidos", Pedido)



