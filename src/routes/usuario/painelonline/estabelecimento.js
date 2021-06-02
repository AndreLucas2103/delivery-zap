const express = require("express")
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

router.get('/:urlPainel', async (req, res)=>{
    try {
        let estabelecimento = await Estabelecimento.findOne({url: req.params.urlPainel}).lean()
        let produtos = await Produto.aggregate([
            {$match: {idEstabelecimento: estabelecimento._id}},
            {
                $group:{
                    _id: '$idCategoriaProduto', 
                    produtos: {$push: {_id:"$_id", nome: '$nome', valor: '$valor'}},
                }
            },
            {
                $lookup:
                    {
                        from: "categoriaprodutos",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoriaProdutos"
                    },
            },
            {$unwind: '$categoriaProdutos'},
        ])

        res.render('usuarios/pedido/painelonline', {
            estabelecimento: estabelecimento,
            produtos: produtos,
            teste: JSON.stringify(produtos),
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-painel-produto', async (req, res) => { // consulto os 
    try {
        let produto = await  Produto.findById({_id: req.body.idProduto}).lean()
        .populate('adicionais.idCategoriaAdicional adicionais.idAdicional idCategoriaProduto idEstabelecimento opcao.opcoesProduto.idProduto').lean()

        res.json(produto)
    } catch (err) {
        console.log(err)
    }
})


router.post('/add-painel-carrinho-produto', (req, res) => {
    console.log(req.body)
    req.body.produto.forEach(element => {
        console.log('------')
        console.log(JSON.parse(element.value))
    })
})

module.exports = router;