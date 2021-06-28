const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")


require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")


router.get('/estabelecimento', async (req, res) => {
    try {
        let estabelecimento = await Estabelecimento.findById({'_id': req.query.idEstabelecimento}).populate('idUsuarioMaster').lean()
        
        res.render('admin/estabelecimento/estabelecimento', {
            estabelecimento: estabelecimento
        })
    } catch (err) {
        console.log(err)
    }
})

router.get('/estabelecimentos', async (req, res) => {
    try {
        let {conteudo, limit, paginate} = req.query

        limit ? find_limit = Number(limit) : find_limit = 20
        paginate ? find_paginate = Number(paginate) : find_paginate = 1
        let skip = find_limit * (find_paginate-1)

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'nome': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.cep': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.uf': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.localidade': { '$regex': conteudo.trim(), '$options': "i" } }]}
        query = {
            $and: [find_conteudo]
        }

        let estabelecimentos = await Estabelecimento.find(query).skip(skip).limit(find_limit).populate('idUsuarioMaster').lean()
        let totalPage = await Estabelecimento.countDocuments(query)

        res.render('admin/estabelecimento/estabelecimentos', {
            estabelecimentos: estabelecimentos,
            pagination: {
                page: find_paginate,
                pageCount: Math.ceil(totalPage/find_limit),

                totalPage: totalPage,
                limitPage: find_limit,
                startPage: estabelecimentos.length == 0 ? 0 : skip+1,
                endPage: skip + estabelecimentos.length
            }
        })
        
    } catch (err) {
        console.log(err)
    }
})


module.exports = router