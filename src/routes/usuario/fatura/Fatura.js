const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")


router.get('/faturas', async (req, res) => { // Entrar no "perfil" do estabelecimento
    let userEstabelecimentos = []
    req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) 

    try {
        let faturas = await Estabelecimento.aggregate([
            {$match: {'_id': { $in:  userEstabelecimentos}} },
            { $unwind: '$locacao' },
        ])

        console.log(faturas.length)

        res.render('usuarios/fatura/faturas', {
            faturas: faturas
        })
    } catch (err) {
        console.log(err)
    }
})


module.exports = router;
