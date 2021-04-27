const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* LEGENDA
    SITUACAO: {
        100: approved = Pagamento aprovado.
        101: pending = Pagamento pendente.
        103: authorized = O pagamento foi autorizado, mas ainda não foi capturado.
        104: in_process = O pagamento está sendo revisado.
        105: in_mediation = Os usuários iniciaram uma disputa.
        106: rejected = O pagamento foi rejeitado. O usuário pode tentar o pagamento novamente.
        107: cancelled = O pagamento foi cancelado por uma das partes ou porque o prazo de pagamento expirou
        108: refunded = O pagamento foi devolvido ao usuário.
        109: charged_back = Foi feito um estorno no cartão de crédito do comprador.
    }

    metodoPagamento: {
        // aparece com esse nome payment_type_id 
        account_money = Conta do Mercado Pago
        ticket = Boleto
        bank_transfer = transferência
        atm = Pagamento por caixa eletrônico.
        credit_card = Pagamento por cartão de crédito.
        debit_card = Pagamento por cartão de débito.
        prepaid_card = Pagamento por cartão pré-pago.

    }
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

    uuid4Client: String,

    idUsuario: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },

    cancelado: Boolean,
    finalizado: Boolean,

    dataCriacao: {
        type: Date,
        required: true
    },
    
    operadoraPagamento: {
        type: String,
        required:true
    },

    metodoPagamento: {
        type: String,
    },
    tipoPagamento: {
        type: String,
    },
    situacao: {
        type: String
    },
    situacaoDetalhada: {
        type: String
    },
    idTransacaoOperadora: {
        type: String
    },

    dataPagamento: {
        type: Date
    },
    dataCancelamento: {
        type: Date
    },
    pedidoCancelado: {
        type: Boolean,
        default: false
    },
    pedidoPago: {
        type: Boolean,
        default: false
    },

    observacao: {
        type: String
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("pedidos", Pedido)



