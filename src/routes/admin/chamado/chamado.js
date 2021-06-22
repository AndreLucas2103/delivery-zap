const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')

require("../../../models/Chamado")
const Chamado = mongoose.model("chamados")

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

        let chamados = await Chamado.find(query).lean()
        let totalPage = await Chamado.countDocuments(query)

        res.render('admin/chamado/chamados', {
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

module.exports = router