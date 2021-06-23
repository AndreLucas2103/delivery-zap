const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const bcryptjs = require("bcryptjs")


require("../../../models/admin/AdmUsuario")
const AdmUsuario = mongoose.model("admUsuarios")

router.get('/admusuarios', async (req, res) => {
    try {
        let {conteudo} = req.query
        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'nomeCompleto': { '$regex': conteudo.trim(), '$options': "i" } },{ 'email': { '$regex': conteudo.trim(), '$options': "i" } },{ 'cpf': { '$regex': conteudo.trim(), '$options': "i" } } ]}

        let usuarios = await AdmUsuario.find(find_conteudo).lean()
        
        res.render('admin/usuario/usuarios', {usuarios: usuarios, conteudo: conteudo})
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-usuario', (req, res) => {
    const novoUsuario = new AdmUsuario({
        primeiroNome: req.body.primeiroNome,
        nomeCompleto: req.body.nomeCompleto,
        email: req.body.email,
        cpf: req.body.cpf,
        senha: req.body.senha,
    })

    bcryptjs.genSalt(10, (erro, salt) => {

        bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
            if (erro) {
                res.json(402)
            }

            novoUsuario.senha = hash
            novoUsuario.save().then((usuario) => {
                req.flash("success_msg", "Usuario criado")
                res.redirect("back")
            }).catch((err) => {
                console.log(err)
                req.flash("error_msg", "Houve um erro ao criar o usuário")
                res.redirect("back")
            })
        })
    })
})

module.exports = router