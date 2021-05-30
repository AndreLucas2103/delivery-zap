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

router.get('/pedidos', (req, res) => {
    res.render('usuarios/pedido/pedidos', {})
})

router.get('/:urlPainel', async (req, res)=>{
    try {
        let estabelecimento = await Estabelecimento.findOne({url: req.params.urlPainel}).lean()
        let produtos = await Produto.aggregate([
            {$match: {$and: [{idEstabelecimento: estabelecimento._id}, {statusAtivo: true}]}},
            {
                $group:{
                    _id: '$idCategoriaProduto', 
                    produtos: {$push: {_id:"$_id", nome: '$nome', valor: '$valor',}},
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

        res.render('usuarios/pedido/painelvendas', {
            estabelecimento: estabelecimento,
            produtos: produtos,
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

router.post('/add-painel-carrinho-produto', async (req, res) => {
    try {
        
        console.log(JSON.parse(String(req.body.adicionais)))
        
    } catch (err) {
        console.log(err)
    }
})
module.exports = router