const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
const bcryptjs = require("bcryptjs")
const passport = require("passport")

router.post("/registro", (req, res) => {

    var erros = []

    if (req.body.validacpf == "Inválido") {
        erros.push({ texto: "CPF Inválido." })
    }

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({ texto: "Senha inválida." })
    }

    if (req.body.senha.length < 4) {
        erros.push({ texto: "Senha muito curta." })
    }

    if (req.body.senha != req.body.senha2) {
        erros.push({ texto: "As senhas digitadas estão divergentes." })
    }

    if (erros.length > 0) {

        res.render("usuarios/registro", { erros: erros })

    } else {
        Usuario.findOne({ email: req.body.email }).lean().then((usuario) => {
            if (usuario) {
                req.flash("error_msg", "E-mail já cadastrado.")
                res.redirect("/usuarios/registro")
            } else {

                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    nomecompleto: req.body.nomecompleto,
                    email: req.body.email,
                    senha: req.body.senha,
                    eTipo:1,
                    usuarioMaster: true,
                    statusAtivo: true

                })
                bcryptjs.genSalt(10, (erro, salt) => {
                    bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if (erro) {
                            res.json(402)
                        }

                        novoUsuario.senha = hash

                        novoUsuario.save().then(() => {
                            res.redirect("/login")
                            req.flash("success_msg", "Cadastro criado com sucesso.")
                        }).catch((err) => {
                            console.log(err)
                            req.flash("error_msg", "Ocorreu um erro interno.")
                            res.redirect("/usuarios/registro")
                        })
                    })
                })
            }

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("usuarios/registro")
        })

    }
})

