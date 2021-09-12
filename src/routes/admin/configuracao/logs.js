const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const moment = require('moment')


require("../../../models/admin/Log")
const Log = mongoose.model("logs")



router.get('/logs', async (req, res) => {
    try {
        let {conteudo, dataInicio, dataFim, limit, paginate} = req.query
        let userTimeZone = req.user.timeZone.substr(1, 2) // capturo o fuso horario do perfil do usuario logado, capturando apenas os dois digitos necesarios e transformando em NUMBER

        limit ? find_limit = Number(limit) : find_limit = 100
        paginate ? find_paginate = Number(paginate) : find_paginate = 1
        let skip = find_limit * (find_paginate-1)

        dataInicio ? find_dataInicio = moment(dataInicio).add(userTimeZone, 'H').format(): find_dataInicio = moment().subtract(7, 'd').format()
        dataFim ? find_dataFim = moment(dataFim).add(userTimeZone, 'H').format() : find_dataFim = moment().format()

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'text': { '$regex': conteudo.trim(), '$options': "i" } }, { 'code': { '$regex': conteudo.trim(), '$options': "i" } }, { 'description': { '$regex': conteudo.trim(), '$options': "i" } }]}
        query = {
            $and: [
            find_conteudo,
           {'date': {$gte: find_dataInicio, $lte: find_dataFim}},
            ]                      
        }

        let logs = await Log.find(query).sort({date: -1}).skip(skip).limit(find_limit).lean()
        let totalPage = await Log.countDocuments(query)

        res.render('admin/configuracao/logs', {
            logs: logs,
            conteudo: req.query.conteudo ? req.query.conteudo.trim() : req.query.conteudo,
            dataInicio: moment(find_dataInicio).subtract(userTimeZone, 'h').format('YYYY-MM-DDTHH:mm'),
            dataFim: moment(find_dataFim).subtract(userTimeZone, 'h').format('YYYY-MM-DDTHH:mm'),
            pagination: {
                page: find_paginate,
                pageCount: Math.ceil(totalPage/find_limit),

                totalPage: totalPage,
                limitPage: find_limit,
                startPage: logs.length == 0 ? 0 : skip+1,
                endPage: skip + logs.length
            }
        })
        
    } catch (err) {
        console.log(err)
    }
})

module.exports = router
