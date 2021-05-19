const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/CategoriaProduto")
const CategoriaProduto = mongoose.model("categoriaProdutos")
require("../../../models/CategoriaAdicional")
const CategoriaAdicional = mongoose.model("categoriaAdicionais")
require("../../../models/Adicional")
const Adicional = mongoose.model("adicionais")
require("../../../models/Ingrediente")
const Ingrediente = mongoose.model("ingredientes")
require("../../../models/Produto")
const Produto = mongoose.model("produtos")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")


// -----------  PRODUTOS ------------------------------------------------------------------------------------------
router.get('/modelo-opcoes', async(req, res) => {
    try {

        res.render('usuarios/produto/modelo/modelo-opcoes', {
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-modelo-opcoes', async(req, res) => {
    try {

        res.render('usuarios/produto/modelo/modelo-opcoes', {
        })
    } catch (err) {
        console.log(err)
    }
})


module.exports = router;

