const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')

require("../../../models/Chamado")
const Chamado = mongoose.model("chamados")
require("../../../models/admin/AdmUsuario")
const AdmUsuario = mongoose.model("admusuarios")

router.get('/chamados', async (req, res) => {
    try {
        let {conteudo, limit, paginate} = req.query

        limit ? find_limit = Number(limit) : find_limit = 20
        paginate ? find_paginate = Number(paginate) : find_paginate = 1
        let skip = find_limit * (find_paginate-1)

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'nome': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.cep': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.uf': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.localidade': { '$regex': conteudo.trim(), '$options': "i" } }]}
        query = {
            $and: [find_conteudo]
        }

        let chamados = await Chamado.find(query).populate('idUsuarioRequisitante idAdministracaoResponsavel idEstabelecimento').lean()
        let totalPage = await Chamado.countDocuments(query)

        

        res.render('admin/chamado/chamados', {
            chamados: chamados,
            pagination: {
                page: find_paginate,
                pageCount: Math.ceil(totalPage/find_limit),

                totalPage: totalPage,
                limitPage: find_limit,
                startPage: chamados.length == 0 ? 0 : skip+1,
                endPage: skip + chamados.length
            }
        })
    } catch (err) {
        console.log(err)
    }
})

router.get('/chamado', async (req, res) => {
    let usuarios = await AdmUsuario.find().lean()
    let chamado = await Chamado.findById({'_id': req.query.chamado}).populate('idUsuarioRequisitante idAdministracaoResponsavel idEstabelecimento mensagens.idEmissor mensagens.idAdmEmissor').lean().lean()
    
    res.render('admin/chamado/chamado', {
        chamado: chamado,
        usuarios: usuarios
    })
})

router.post('/edit-chamado', (req, res) => {
    Chamado.updateOne(
        {'_id': req.body.idChamado},
        {'$set': {
            idAdministracaoResponsavel: req.body.idResponsavel,
            observacao: req.body.observacao,
            situacao: req.body.situacao,
            prioridade: req.body.prioridade
        }}
    ).then(() => {
        req.flash('success_msg', 'Chamado editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-chamado-mensagem', (req, res) => {
    Chamado.updateOne(
        {'_id': req.body.idChamado},
        {$push: {'mensagens': {'conteudo': req.body.conteudo, 'data': new Date(), 'idAdmEmissor': req.user._id}}}
    ).then(() => {
        req.flash('success_msg', "Mensagem enviada")
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

module.exports = router