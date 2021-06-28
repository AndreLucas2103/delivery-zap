const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")


require("../../../models/Plano")
const Plano = mongoose.model("planos")


router.get('/planos', async (req, res) => {
    try {
        let planos = await Plano.find().lean()

        res.render('admin/plano/planos', {planos: planos})
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-plano', (req, res) => {
    Plano({
        nome: req.body.nome,
        periodicidade: req.body.periodicidade,
        mesesPeriodicidade: req.body.mesesPeriodicidade,
        valor: req.body.valor
    }).save().then(() => {
        req.flash('success_msg', 'Plano adicionado')
        res.redirect('back')
    })
})

router.post('/edit-plano', (req, res) => {
    Plano.updateOne(
        {'_id': req.body.idPlano},
        {$set: {
            'nome': req.body.nome,
            'periodicidade': req.body.periodicidade,
            'mesesPeriodicidade': req.body.mesesPeriodicidade,
            'valor': req.body.valor,
            'statusAtivo': req.body.statusAtivo
        }}
    ).then(() => {
        req.flash('success_msg', 'Plano editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})


module.exports = router