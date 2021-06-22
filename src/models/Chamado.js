const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    situacao: {
        waiting: aguardando
        progress: andamento
        finished: finalizado
    }
    prioridade: {
        alta: urgente o chamado
        normal: comuns
        baixa: sugestoes futuras geralmente
    }
*/

const Chamado = new Schema({
    idUsuarioRequisitante: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },
    idAdministracaoResponsavel: {
        type: Schema.Types.ObjectId,
        ref: "admUsuario",
    },
    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    },
    
    titulo: String,
    mensagens: [{
        conteudo: String,
        data: Date,
        
        idEmissor: {
            type: Schema.Types.ObjectId,
            ref: "usuarios",
        },
        idAdmEmissor: {
            type: Schema.Types.ObjectId,
            ref: "admUsuarios",
        },
    }],

    observacao: String,

    situacao: String,
    prioridade: String,
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("chamados", Chamado)
