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
require("../../../models/ModeloOpcao")
const ModeloOpcao = mongoose.model("modeloOpcoes")
require("../../../models/ModeloAdicional")
const ModeloAdicional = mongoose.model("modeloAdicionais")


// -----------  MODELO OPCOES ------------------------------------------------------------------------------------------
router.get('/modelo-opcoes', async(req, res) => {
    try {
        let userEstabelecimentos = [], idCategorias, nome, filtroExist
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento)})
        
        let modelosOpcoes = await ModeloOpcao.find({idEstabelecimento: userEstabelecimentos}).populate('idEstabelecimento opcoesProduto.idProduto').lean()
        res.render('usuarios/produto/modelo/modelo-opcoes', {
            modelosOpcoes: modelosOpcoes,
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-modelo-opcoes', (req, res) => {
    let multiplaEscolha, vinculoProduto, dividendo, obrigatorio
    req.body.multiplaEscolha == "true" ? multiplaEscolha = true : multiplaEscolha = false
    req.body.vinculoProduto == "true" ? vinculoProduto = true  : vinculoProduto = false
    req.body.vinculoProduto == "true" ? dividendo = req.body.dividendo  : dividendo = 1

    let addModelo = {
        'nome': req.body.nome, 
        'descricao': req.body.descricao,
        'multiplaEscolha': multiplaEscolha, 
        'vinculoProduto': vinculoProduto, 
        'dividendo': dividendo,
        idEstabelecimento: req.body.idEstabelecimento,
    }
    new ModeloOpcao(addModelo).save().then(() => {
        req.flash('success_msg', 'Modelo adicionado')
        res.redirect('back')
    }).catch(err=> {
        console.log(err)
    })
})

router.post('/edit-modelo-opcoes', (req, res) => {
    let multiplaEscolha, vinculoProduto, dividendo, obrigatorio
    req.body.multiplaEscolha == "true" ? multiplaEscolha = true : multiplaEscolha = false
    req.body.obrigatorio == "true" ? obrigatorio = true : obrigatorio = false
    req.body.vinculoProduto == "true" ? vinculoProduto = true  : vinculoProduto = false
    req.body.vinculoProduto == "true" ? dividendo = req.body.dividendo  : dividendo = 1
    if(req.body.vinculoProduto == "true"){
        condicao = {
            'nome': req.body.nome, 
            'descricao': req.body.descricao, 
            "multiplaEscolha": multiplaEscolha,
            "obrigatorio": obrigatorio,
            "vinculoProduto": vinculoProduto,
            "dividendo": dividendo,
            "opcoes": []
        }
    }else{
        condicao = {
            'nome': req.body.nome, 
            'descricao': req.body.descricao, 
            "multiplaEscolha": multiplaEscolha,
            "obrigatorio": obrigatorio,
            "vinculoProduto": vinculoProduto,
            "dividendo": dividendo,
            "opcoesProduto": []
        }
    }
    
    ModeloOpcao.updateOne(
        {_id: req.body.idOpcao},
        {$set:  condicao }
    ).then(() => {
        req.flash('success_msg', 'Modelo opção editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-modelo-opcoes-opcao', (req, res) => {
    if(req.body.vinculoProduto == 'true'){
        let arrayidProdutos = JSON.parse(req.body.idProdutos)

        arrayidProdutos.forEach(element => {
            ModeloOpcao.updateOne(
                {_id: req.body.idOpcao},
                {$push: {
                    'opcoesProduto': {'idProduto': element.idProduto}
                }}
            ).then(() => {
                
            }).catch(err => {
                console.log(err)
            })
        })

        req.flash('success_msg', 'Opção adicionada')
        res.redirect('back')
        
    }else{
        ModeloOpcao.updateOne(
            {_id: req.body.idOpcao},
            {$push: {
                'opcoes': {'nome': req.body.nome, 'valor': req.body.valor}
            }}
        ).then(() => {
            req.flash('success_msg', 'Opção adicionada')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    }
})

router.post('/delete-modelo-opcoes-opcoes/:vinculoProduto/:idOpcao', (req, res) => { // adicionar opcoes a uma opcao 
    req.params.vinculoProduto == "true" ? condicao = {'opcoesProduto': {_id: ObjectId(req.body.id_opcoes_opcoes)}} : condicao = {'opcoes': {_id: ObjectId(req.body.id_opcoes_opcoes)}}
    ModeloOpcao.updateOne(
        {_id: req.params.idOpcao},
        {$pull: condicao}
    ).then(() => {
        req.flash('success_msg', 'Opção removida')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/ajax-get-produto-modelo-opcoes', (req, res) => { // consulto os 
    console.log(req.body)
    ModeloOpcao.findById({_id: req.body.idModeloOpcao}).then(modeloOpcao => {
        Produto.find({idEstabelecimento: modeloOpcao.idEstabelecimento}).populate('idCategoriaProduto').lean().then(produtos => {
            res.json(produtos)
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})

// -----------  MODELO ADICONAIS ------------------------------------------------------------------------------------------
router.get('/modelo-adicionais', async(req, res) => {
    try {
        let userEstabelecimentos = [], idCategorias, nome, filtroExist
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento)})

        let modelosAdicionais = await ModeloAdicional.find({idEstabelecimento: userEstabelecimentos}).populate('idEstabelecimento adicionais.idCategoriaAdicional adicionais.idAdicional').lean()
        res.render('usuarios/produto/modelo/modelo-adicionais', {
            modelosAdicionais: modelosAdicionais
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-modelo-adicionais', (req, res) => {
    new ModeloAdicional({nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento}).save().then(() => {
        req.flash('success_msg','Modelo adicionado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-modelo-adicionais-adiocinal', (req, res) => {
    let arrayIdAdicionais = JSON.parse(req.body.idAdicional)

    arrayIdAdicionais.forEach(element => {
        ModeloAdicional.updateOne(
            {_id: req.body.idModeloAdicional},
            {$push: {
                'adicionais': {'idAdicional': element.idAdicional, idCategoriaAdicional: element.idCategoriaAdicional}
            }}
        ).then(() => {
            
        }).catch(err => {
            console.log(err)
        })
    })

    req.flash('success_msg', 'Adicional adicionado')
    res.redirect('back')
})

router.post('/delete-modelo-adicionais-adiocinal', (req, res) => {
    ModeloAdicional.updateOne( 
        {'_id': req.body.idModeloAdicional},
        { $pull: {
            'adicionais': {_id: ObjectId(req.body.idObjectAdicional)},
        }}
    ).then(() => {
        req.flash('success_msg', 'Adicional removido')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/edit-modelo-adicional', (req, res) => {
    ModeloAdicional.updateOne(
        {_id: req.body.idModeloAdicional},
        {$set: {nome: req.body.nome}}
    ).then(() => {
        req.flash('success_msg','Modelo editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})


router.post('/ajax-get-modelo-adicionais-categorias-adicionais', async (req, res) => {
    try {
        let modeloAdicional = await ModeloAdicional.findById({_id: req.body.idModeloAdicional})
        let categorias = await CategoriaAdicional.find({$and: [{idEstabelecimento: modeloAdicional.idEstabelecimento}, {statusAtivo: true}]}).lean();

        res.json(categorias)
    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-modelo-adicionais-adicionais', (req, res) => {
    ModeloAdicional.findById({_id: req.body.idModeloAdicional}).then(produto => {
        req.body.idCategoriaAdicional ? idCategoriaAdicional = {$and: [{'idCategoriaAdicional': ObjectId(req.body.idCategoriaAdicional)}, {statusAtivo:true}]}  : idCategoriaAdicional = {$and: [{statusAtivo:true}, {'idEstabelecimento': produto.idEstabelecimento}]}
    
        Adicional.find(idCategoriaAdicional).populate('idCategoriaAdicional').lean().then(adicionais => {
            res.json(adicionais)
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})




module.exports = router;

