const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')

require("../../../models/Chamado")
const Chamado = mongoose.model("chamados")

router.get('/', async (req, res) => {
    try {
        let userEstabelecimentos = [], idCategorias, nome, filtroExist
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })
        
        let chamados = await Chamado.find({'idEstabelecimento': userEstabelecimentos}).sort({'situacao': -1, 'updatedAt': -1}).populate('idUsuarioRequisitante').lean()
        res.render('usuarios/suporte/suporte', {
            chamados: chamados
        }) 

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-chamado', (req, res) => {
    addChamado = {
        idUsuarioRequisitante: req.user._id,
        idEstabelecimento: req.body.idEstabelecimento,
        titulo: req.body.titulo,
        situacao: "progress",
        prioridade: "normal",
        mensagens: [{
            conteudo: req.body.conteudo,
            data: new Date(),
            idEmissor: req.user._id
        }]
    }

    Chamado(addChamado).save().then(() => {
        req.flash('success_msg', "Chamado aberto")
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-chamado-mensagem', (req, res) => {
    let conteudo = req.body.conteudo.split('<p>&nbsp;</p>').join('')
    Chamado.updateOne(
        {'_id': req.body.idChamado},
        {$push: {'mensagens': {'conteudo': conteudo, 'data': new Date(), 'idEmissor': req.user._id}}}
    ).then(() => {
        req.flash('success_msg', "Mensagem enviada")
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.get('/chamado', async (req, res) => {
    try {
        let chamado = await Chamado.findById({'_id': req.query.chamado}).populate('idUsuarioRequisitante idAdministracaoResponsavel idEstabelecimento mensagens.idEmissor mensagens.idAdmEmissor').lean()
        
        res.render('usuarios/suporte/chamado', {
            chamado: chamado
        })
    } catch (err) {
        console.log(err)
    }
})
module.exports = router