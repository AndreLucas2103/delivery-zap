const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const bcryptjs = require("bcryptjs")


require("../../../models/admin/Revendedor")
const Revendedor = mongoose.model("revendedores")

router.get('/revendedores', async (req, res) => {
        try {
            let {conteudo, limit, paginate} = req.query
    
            limit ? find_limit = Number(limit) : find_limit = 20
            paginate ? find_paginate = Number(paginate) : find_paginate = 1
            let skip = find_limit * (find_paginate-1)

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'nomeCompleto': { '$regex': conteudo.trim(), '$options': "i" } },{ 'email': { '$regex': conteudo.trim(), '$options': "i" } },{ 'cpf': { '$regex': conteudo.trim(), '$options': "i" } } ]}
        query = {
            $and: [find_conteudo]
        }

        let revendedores = await Revendedor.find(query).lean()
        let totalPage = await Revendedor.countDocuments(query)
        
        res.render('admin/revendedor/revendedores', {
            revendedores: revendedores, conteudo: conteudo,
            pagination: {
                page: find_paginate,
                pageCount: Math.ceil(totalPage/find_limit),

                totalPage: totalPage,
                limitPage: find_limit,
                startPage: revendedores.length == 0 ? 0 : skip+1,
                endPage: skip + revendedores.length
            }
        })
    } catch (err) {
        console.log(err)
    }
})

router.post("/add-revendedor", (req, res) => {//Rota para cadastrar novo usuário.

    Revendedor.findOne({ email: req.body.email }).lean().then((usuario) => {

        if (usuario) {
            req.flash("error_msg", "E-mail já cadastrado.")
            res.redirect("back")

            } else {

    const novoUsuario = new Revendedor({
        primeiroNome: req.body.primeiroNome,
        nomeCompleto: req.body.nomeCompleto,
        email: req.body.email,
        cpf: req.body.cpf,
        telefone: req.body.telefone,
        senha: req.body.senha,
        statusAtivo: true,

        endereco: {
            logradouro: req.body.logradouro,
            bairro: req.body.bairro,
            localidade: req.body.localidade,
            cep: req.body.cep,
            numero: req.body.numero,
            uf: req.body.uf,

        },

    })

    bcryptjs.genSalt(10, (erro, salt) => {

        bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
            if (erro) {
                registerLog.registerLog({text: "Rota USUARIO - /add-revendedor", code: "500", description: erro})
                res.json(402)
            }

            novoUsuario.senha = hash
            novoUsuario.save().then(() => {

                req.flash("success_msg", "Revendedor criado com sucesso!")
                res.redirect("back")
            }).catch((err) => {
                registerLog.registerLog({text: "Rota USUARIO - /add-revendedor", code: "500", description: err})
                req.flash("error_msg", "Houve um erro ao criar o usuário")
                res.redirect("back")

            })
            
        })
    })
}
})
    
})

module.exports = router