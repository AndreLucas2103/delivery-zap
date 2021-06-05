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
require("../../../models/Carrinho")
const Carrinho = mongoose.model("carrinhos")

router.get('/:urlPainel', async (req, res)=>{
    try {
        let estabelecimento = await Estabelecimento.findOne({url: req.params.urlPainel}).lean()
        let produtos = await Produto.aggregate([
            {$match: {$and: [{idEstabelecimento: estabelecimento._id}, {statusAtivo: true}]}},
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

router.post('/add-painel-carrinho-produto', async (req, res) => {
    try {
        let {idProduto, observacao, quantidade, uuid4Client} = req.body
        let produto = await Produto.findById({'_id': idProduto})
        
        if(!produto)
            return res.json(201)
        
        let carrinho = await Carrinho.findOne({$and: [{'uuid4Client': uuid4Client}, {'idEstabelecimento': produto.idEstabelecimento}]})

        let valorTotal = produto.valor
        let adicionais = []
        let opcoes = []

        if(req.body.produto){
            req.body.produto.forEach(element => {
                let dadosElement = JSON.parse(element.value)
                if(dadosElement.tipo === "opcao"){
                    valorTotal += Number(dadosElement.valor)
                    opcoes.push(dadosElement)
                }else if(dadosElement.tipo === "adicional"){
                    valorTotal += Number(dadosElement.valor)
                    adicionais.push(dadosElement)
                }
            })
        }

        console.log(opcoes)
        
        if(opcoes != []){
            var grupoOpcoes = [...opcoes.reduce((c, {nomeOpcao, nome, valor}) => {
                if (!c.has(nomeOpcao)) c.set(nomeOpcao, {nomeOpcao ,opcoes: []});
                c.get(nomeOpcao).opcoes.push({nome: nome, valor: valor});
                return c;
            }, new Map()).values()];
        }
        console.log(grupoOpcoes)


        if(carrinho){
            let valorTotalCarrinho = carrinho.valorTotal + valorTotal*quantidade

            pushProduto = {
                idProduto: produto._id,
                nome: produto.nome,
                valor: produto.valor,

                opcao: grupoOpcoes,
                adicionais: adicionais,

                valorTotal: valorTotal*quantidade,
                
                idCategoriaProduto: produto.idCategoriaProduto,
                observacao: observacao,
                quantidade: quantidade
            }
            
            Carrinho.updateOne(
                {_id: carrinho._id},
                {
                    $push: {'produtos': pushProduto},
                    $set: {'valorTotal': valorTotalCarrinho}
                }
            ).then(() => {
                res.json(200)
            }).catch(err => {
                console.log(err)
                res.json(201)
            })
        }else{
            addCarrinho = {
                produtos: {
                    idProduto: produto._id,
                    nome: produto.nome,
                    valor: produto.valor,

                    opcao: grupoOpcoes,
                    adicionais: adicionais,

                    valorTotal: valorTotal*quantidade,
                    
                    idCategoriaProduto: produto.idCategoriaProduto,
                    observacao: observacao,
                    quantidade: quantidade

                },
                uuid4Client: uuid4Client,
                idEstabelecimento: produto.idEstabelecimento,
                valorTotal: valorTotal*quantidade
            }
            new Carrinho(addCarrinho).save().then((newCarrinho) => {
                res.json(200)
            }).catch(err => {
                res.json(201)
            })
        }

    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-carrinho-painel', (req, res) => {
    console.log(req.body)

    req.params.tipo == "capa" ? tipo = {'img.capa': {name:'asdasd'}} :  tipo = {'img.painel': {name:'asdasd'}} 

    Carrinho.findOne({$and: [{idEstabelecimento: ObjectId(req.body.idEstabelecimento)}, {uuid4Client: req.body.uuid4Client}]}).lean().then(carrinho => {
        res.json(carrinho)
    })
})

module.exports = router;