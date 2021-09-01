const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")

const registerLog = require("../../../components/log")


router.get('/impressora/:idEstabelecimento', eAdmin, async (req, res) => { // Entrar no "perfil" do estabelecimento
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            { $match: { _id: ObjectId(req.params.idEstabelecimento) } },
            {
                $lookup:
                {
                    from: "usuarios",
                    localField: "_id",
                    foreignField: "estabelecimentosVinculados.idEstabelecimento",
                    as: "usuarios"
                }
            }
        ])

        res.render('usuarios/configuracao/impressora', { estabelecimento: estabelecimento[0] })
    } catch (err) {
        registerLog.registerLog({text: "Rota IMPRESSORA - /impressora/:idEstabelecimento", code: "500", description: err})
    }
})

router.post('/edit-impressora', async (req, res) => { // Editar o estabelecimento
    try {
        Estabelecimento.findById({ _id: req.body.idEstabelecimento }).then(estabelecimento => {
            if (estabelecimento) {

                    estabelecimento.impressora = {
                        bobina: req.body.bobina,
                        fonte: req.body.fonte,
                    }

                estabelecimento.save().then(() => {
                    req.flash('success_msg', 'Configuração alterada!')
                    res.redirect('back')
                }).catch(err => {
                    registerLog.registerLog({text: "Rota IMPRESSORA - /edit-impressora", code: "500", description: "Tentativa de editar sem id de estabelecimento"})
                    req.flash('error_msg', 'Ocorreu um erro')
                    res.redirect('back')
                })
            } else {
                registerLog.registerLog({text: "Rota IMPRESSORA - /edit-impressora", code: "500", description: "Tentativa de editar sem id de estabelecimento"})
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            }
        }).catch(err => {
            registerLog.registerLog({text: "Rota IMPRESSORA - /edit-impressora", code: "500", description: err})
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        })
    } catch (err) {
        registerLog.registerLog({text: "Rota IMPRESSORA - /edit-impressora", code: "500", description: err})
        req.flash('error_msg', 'Ocorreu um erro')
        res.redirect('back')
    }
})


module.exports = router;
