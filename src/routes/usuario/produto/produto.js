const express = require('express')
const router = express.Router()
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const mongoose = require("mongoose")
const multer = require('multer')
const multerConfig = require('../../../config/multer')
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


// -----------  PRODUTOS ------------------------------------------------------------------------------------------
router.get('/perfil', async (req, res) => {
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let produto = await Produto.findById({ _id: req.query.produto })
            .populate('adicionais.idCategoriaAdicional adicionais.idAdicional idCategoriaProduto idEstabelecimento opcao.opcoesProduto.idProduto').lean()

        let ingredientes = await Ingrediente.find({ $and: [{ 'categoriasProdutos.idCategoriaProduto': produto.idCategoriaProduto }, { statusAtivo: true }] }).lean()

        let adicionais = await Adicional.find({ $and: [{ 'idEstabelecimento': produto.idEstabelecimento }] }).populate('idCategoriaAdicional').lean()

        let categoriasAdicional = await CategoriaAdicional.find({ $and: [{ 'idEstabelecimento': produto.idEstabelecimento }, { statusAtivo: true }] }).lean()

        res.render('usuarios/produto/produto', {
            produto: produto,
            ingredientes: ingredientes,
            categoriasAdicional: categoriasAdicional,
            adicionais: adicionais
        })
    } catch (err) {
        console.log(err)
    }
})

// Parte para opcoes dos produtos
router.post('/add-produto-opcoes-individual', (req, res) => { // adicionar opcoes a uma opcao 
    if (req.body.vinculoProduto == 'true') {
        let arrayidProdutos = JSON.parse(req.body.idProdutos)

        arrayidProdutos.forEach(element => {
            Produto.updateOne(
                { _id: req.body.idProduto, 'opcao._id': req.body.idOpcao },
                {
                    $push: {
                        'opcao.$.opcoesProduto': { 'idProduto': element.idProduto }
                    }
                }
            ).then(() => {

            }).catch(err => {
                console.log(err)
            })
        })

        req.flash('success_msg', 'Opção adicionada')
        res.redirect('back')

    } else {
        Produto.updateOne(
            { _id: req.body.idProduto, 'opcao._id': req.body.idOpcao },
            {
                $push: {
                    'opcao.$.opcoes': { 'nome': req.body.nome, 'valor': req.body.valor }
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Opção adicionada')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    }
})

router.post('/delete-produto-opcoes/:vinculoProduto/:idOpcao', (req, res) => { // adicionar opcoes a uma opcao 
    req.params.vinculoProduto == "true" ? condicao = { 'opcao.$.opcoesProduto': { _id: ObjectId(req.body.id_opcoes_opcoes) } } : condicao = { 'opcao.$.opcoes': { _id: ObjectId(req.body.id_opcoes_opcoes) } }
    Produto.updateOne(
        { _id: req.body.idProduto, 'opcao._id': req.params.idOpcao },
        { $pull: condicao }
    ).then(() => {
        req.flash('success_msg', 'Opção removida')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-produto-opcao', (req, res) => { // rota para adicionar uma nova opcao ao produto
    let multiplaEscolha, vinculoProduto, dividendo, obrigatorio
    req.body.multiplaEscolha == "true" ? multiplaEscolha = true : multiplaEscolha = false
    req.body.vinculoProduto == "true" ? vinculoProduto = true : vinculoProduto = false
    req.body.vinculoProduto == "true" ? dividendo = req.body.dividendo : dividendo = 1

    Produto.updateOne(
        { _id: req.body.idProduto },
        {
            $push: {
                'opcao': {
                    'nome': req.body.nome,
                    'descricao': req.body.descricao,
                    'multiplaEscolha': multiplaEscolha,
                    'vinculoProduto': vinculoProduto,
                    'dividendo': dividendo,
                }
            }
        }
    ).then(() => {
        req.flash('success_msg', 'Opção criada')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-produto-opcao-modelo-opcoes', (req, res) => { // rota para adicionar uma nova opcao ao produto
    ModeloOpcao.findById({ _id: req.body.idModeloOpcao }, { _id: 0 }).then(modelo => {
        Produto.updateOne(
            { _id: req.body.idProduto },
            {
                $push: {
                    'opcao': modelo
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Opção criada')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})

router.post('/edit-produto-opcao', (req, res) => { // rota para editar as informacoes de uma opcao do produto
    let multiplaEscolha, vinculoProduto, dividendo, obrigatorio
    req.body.multiplaEscolha == "true" ? multiplaEscolha = true : multiplaEscolha = false
    req.body.obrigatorio == "true" ? obrigatorio = true : obrigatorio = false
    req.body.vinculoProduto == "true" ? vinculoProduto = true : vinculoProduto = false
    req.body.vinculoProduto == "true" ? dividendo = req.body.dividendo : dividendo = 1
    if (req.body.vinculoProduto == "true") {
        condicao = {
            'opcao.$.nome': req.body.nome,
            'opcao.$.descricao': req.body.descricao,
            "opcao.$.multiplaEscolha": multiplaEscolha,
            "opcao.$.obrigatorio": obrigatorio,
            "opcao.$.vinculoProduto": vinculoProduto,
            "opcao.$.dividendo": dividendo,
            "opcao.$.opcoes": []
        }
    } else {
        condicao = {
            'opcao.$.nome': req.body.nome,
            'opcao.$.descricao': req.body.descricao,
            "opcao.$.multiplaEscolha": multiplaEscolha,
            "opcao.$.obrigatorio": obrigatorio,
            "opcao.$.vinculoProduto": vinculoProduto,
            "opcao.$.dividendo": dividendo,
            "opcao.$.opcoesProduto": []
        }
    }

    Produto.updateOne(
        { _id: req.body.idProduto, 'opcao._id': req.body.idOpcao },
        { $set: condicao }
    ).then(() => {
        req.flash('success_msg', 'Opção editada')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})


// rota onde pego os ingredientes selecionados pela pessoa
router.post('/add-produto-ingrediente', (req, res) => { // adicionar ingredientes aos produtos
    if (!req.body.idIngredientes) {
        req.flash('error_msg', 'O produto deve possuir pelo menos um ingrediente')
        res.redirect('back')
    } else {
        Produto.updateOne(
            { _id: req.body.idProduto },
            {
                $set: {
                    'ingredientes': []
                }
            }
        ).then(() => {
            let arrayIdIngredientes = JSON.parse(req.body.idIngredientes)

            arrayIdIngredientes.forEach(element => {
                Produto.updateOne(
                    { _id: req.body.idProduto },
                    {
                        $push: {
                            'ingredientes': { 'nome': element.value }
                        }
                    }
                ).then(() => {

                }).catch(err => {
                    console.log(err)
                })
            })

            req.flash('success_msg', 'Ingrediente editado')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    }
})

// adicionar e remover adicionais do produto
router.post('/add-produto-adicional-individual', (req, res) => { // adicionar ingredientes aos produtos
    if (req.body.idAdicional) {
        let arrayIdAdicionais = JSON.parse(req.body.idAdicional)

        arrayIdAdicionais.forEach(element => {
            Produto.updateOne(
                { _id: req.body.idProduto },
                {
                    $push: {
                        'adicionais': { 'idAdicional': element.idAdicional, 'idCategoriaAdicional': element.idCategoriaAdicional }
                    }
                }
            ).then(() => {

            }).catch(err => {
                console.log(err)
            })
        })

        req.flash('success_msg', 'Adicional editado')
        res.redirect('back')
    } else {
        req.flash('warning_msg', 'Você deve selecionar pelo menos um adicional para adicionar')
        res.redirect('back')
    }
})

router.post('/add-produto-adicionais-modelo-adicionais', (req, res) => { // rota para adicionar uma nova opcao ao produto
    ModeloAdicional.findById({ _id: req.body.idModeloAdicional }, { _id: 0 }).then(modelo => {
        modelo.adicionais.forEach(element => {
            Produto.updateOne(
                { _id: req.body.idProduto },
                {
                    $push: {
                        'adicionais': { 'idAdicional': element.idAdicional, 'idCategoriaAdicional': element.idCategoriaAdicional }
                    }
                }
            ).then(() => {

            }).catch(err => {
                console.log(err)
            })
        })
        req.flash('success_msg', 'Opção criada')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/delete-produto-adicional', (req, res) => {
    Produto.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
        { '_id': req.body.idProduto },
        {
            $pull: {
                'adicionais': { _id: ObjectId(req.body.idObjectAdicional) },
            }
        }
    ).then(() => {
        req.flash('success_msg', 'Adicional removido')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})


router.get('/produtos', async (req, res) => { // listo todos os produtos
    let userEstabelecimentos = [], idCategorias, nome, filtroExist
    req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

    if (req.query.idCategorias || req.query.nome) {
        filtroExist = true
    } else {
        filtroExist = false
    }

    let arrayIdCategorias = []
    if (req.query.idCategorias) {
        JSON.parse(req.query.idCategorias).forEach(element => {
            arrayIdCategorias.push(element.idCategoria)
        })
        idCategorias = { 'idCategoriaProduto': arrayIdCategorias }
    } else {
        idCategorias = {}
    }

    req.query.nome ? nome = { nome: { $regex: req.query.nome, $options: "i" } } : nome = {}

    let produtos = await Produto.find({
        $and: [
            { idEstabelecimento: userEstabelecimentos }, nome, idCategorias
        ]
    })
        .populate('idCategoriaProduto idEstabelecimento').sort({ 'nome': 1, 'produtos.statusAtivo': true}).lean()

    let estabelecimentos = await Estabelecimento.find({ _id: userEstabelecimentos }).lean()
    let categoriasProdutos = await CategoriaProduto.find({ $and: [{ idEstabelecimento: userEstabelecimentos }, { statusAtivo: true }] }).populate('idEstabelecimento').lean()

    res.render('usuarios/produto/produtos', {
        produtos: produtos,
        estabelecimentos: estabelecimentos,
        categoriasProdutos: JSON.stringify(categoriasProdutos),

        //filter
        nome: req.query.nome,
        idCategorias: req.query.idCategorias,

        filtroExist: filtroExist
    })

})

// Adicionar produto no geral mesmo
router.post('/edit-produto', async (req, res) => { // editar o produto
    try {
        let produtoExist = await Produto.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }, { idCategoriaProduto: req.body.idCategoriaProduto }] })
        if (produtoExist && req.body.idProduto != produtoExist._id) {
            req.flash('warning_msg', 'Produto já existe para essa categoria e estabelecimento')
            res.redirect('back')
        } else {
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Produto.updateOne(
                { _id: req.body.idProduto },
                {
                    $set:
                        { 'nome': req.body.nome, 'valor': req.body.valor, 'descricao': req.body.descricao, 'statusAtivo': statusAtivo }
                }
            ).then(() => {
                req.flash('success_msg', 'Produto editado')
                res.redirect('back')
            }).catch(err => {
                console.log(err)
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-produto', async (req, res) => { // adicionar produto
    if (!req.body.idEstabelecimento || !req.body.idCategoriaProduto) {
        req.flash('error_msg', 'Nenhuma categoria ou estabelecimento selecionado')
        res.redirect('back')
    } else {
        let produtoExist = await Produto.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }, { idCategoriaProduto: req.body.idCategoriaProduto }] })
        if (produtoExist) {
            req.flash('warning_msg', 'Produto já existe para essa categoria e estabelecimento')
            res.redirect('back')
        } else {
            let addProduto = {
                nome: req.body.nome,
                valor: req.body.valor,
                descricao: req.body.descricao,
                idCategoriaProduto: req.body.idCategoriaProduto,
                idEstabelecimento: req.body.idEstabelecimento,
                identificaouuidv4: req.user.identificaouuidv4
            }

            new Produto(addProduto).save().then((produto) => {
                req.flash('success_msg', 'Produto adicionado')
                res.redirect('/produto/perfil?produto=' + produto._id)
            }).catch(err => {
                console.log(err)
            })
        }
    }
})


// Consultas ajax que realizo na pagina de produtos
router.post('/ajax-get-produto-adicioanais-categoria-adicionais', (req, res) => { // consulto os adicionais pela categoria e estabelecimento selecionado no perfil
    Produto.findById({ _id: req.body.idProduto }).then(produto => {
        req.body.idCategoriaAdicional ? idCategoriaAdicional = { $and: [{ 'idCategoriaAdicional': ObjectId(req.body.idCategoriaAdicional) }, { statusAtivo: true }] } : idCategoriaAdicional = { $and: [{ statusAtivo: true }, { 'idEstabelecimento': produto.idEstabelecimento }] }

        Adicional.find(idCategoriaAdicional).populate('idCategoriaAdicional').lean().then(adicionais => {
            res.json(adicionais)
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})

router.post('/ajax-get-produto-produtos-opcoes-produtos', (req, res) => { // consulto os 
    Produto.findById({ _id: req.body.idProduto }).then(produto => {
        Produto.find({ idEstabelecimento: produto.idEstabelecimento }).populate('idCategoriaProduto').lean().then(produtos => {
            res.json(produtos)
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})

router.post('/ajax-get-produto-modelos-opcoes', (req, res) => { // consulto os 
    Produto.findById({ _id: req.body.idProduto }).then(produto => {
        ModeloOpcao.find({ idEstabelecimento: produto.idEstabelecimento }).lean().then(modelos => {
            console.log(req.body)
            res.json(modelos)
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})

router.post('/ajax-get-produto-modelos-adicionais', (req, res) => { // consulto os 
    Produto.findById({ _id: req.body.idProduto }).then(produto => {
        ModeloAdicional.find({ idEstabelecimento: produto.idEstabelecimento }).lean().then(modelos => {
            res.json(modelos)
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })
})


// -----------  INGREDIENTES ------------------------------------------------------------------------------------------
router.get('/ingredientes', eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let ingredientes = await Ingrediente.find({ $and: [{ idEstabelecimento: userEstabelecimentos }] }).populate('idEstabelecimento categoriasProdutos.idCategoriaProduto').lean().sort({ createdAt: -1 })
        let categoriasProdutos = await CategoriaProduto.find({ $and: [{ idEstabelecimento: userEstabelecimentos }, { statusAtivo: true }] }).populate('idEstabelecimento').lean()

        res.render('usuarios/produto/ingredientes', {
            ingredientes: ingredientes,
            categoriasProdutos: JSON.stringify(categoriasProdutos)
        })

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-ingredientes', async (req, res) => { // adiciono a categoria com todos os estabelecimentos
    try {
        if (!req.body.idCategoriaProduto || !req.body.idEstabelecimento) {
            req.flash('error_msg', 'Nenhuma categoria ou estabelecimento selecionado')
            res.redirect('back')
        } else {
            let ingredienteExist = await Ingrediente.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }] })
            if (ingredienteExist) {
                req.flash('warning_msg', 'Ingrediente já existe para esse estabelecimento. Vincule o ingrediente a nova categoria também')
                res.redirect('back')
            } else {
                new Ingrediente({ nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento, idCategoriaProduto: req.body.idCategoriaProduto }).save().then((ingrediente) => {
                    req.body.idCategoriaProduto.forEach(element => {
                        Ingrediente.updateOne(
                            { _id: ingrediente._id },
                            {
                                $push: {
                                    'categoriasProdutos': { 'idCategoriaProduto': ObjectId(element) },
                                }
                            }
                        ).then(() => {

                        }).catch(err => {
                            console.log(err)
                        })
                    })
                    req.flash('success_msg', 'Ingrediente adicionado')
                    res.redirect('back')
                })
            }
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-ingredientes', async (req, res) => { // adiciono a categoria com todos os estabelecimentos
    try {
        let ingredienteExist = await Ingrediente.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }] })
        if (ingredienteExist && req.body.idIngrediente != ingredienteExist._id) {
            req.flash('warning_msg', 'Ingrediente já existe para esse estabelecimento')
            res.redirect('back')
        } else {
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Ingrediente.updateOne(
                { _id: req.body.idIngrediente },
                {
                    $set:
                        { 'nome': req.body.nome, 'statusAtivo': statusAtivo, categoriasProdutos: [] }
                }
            ).then(() => {
                req.body.idCategoriaProduto.forEach(element => {
                    Ingrediente.updateOne(
                        { _id: req.body.idIngrediente },
                        {
                            $push: {
                                'categoriasProdutos': { 'idCategoriaProduto': ObjectId(element) },
                            }
                        }
                    ).then(() => {

                    }).catch(err => {
                        console.log(err)
                    })
                })

                req.flash('success_msg', 'Ingrediente editado')
                res.redirect('back')
            }).catch(err => {
                console.log(err)
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-ingredientes', async (req, res) => { // consulto pela rota  "/produto/adicionais" para poder pegar as informações e editar seus valores
    try {
        let ingrediente = await Ingrediente.findById({ _id: req.body.idIngrediente }).populate('idEstabelecimento categoriasProdutos.idCategoriaProduto').lean()
        let categoriasProdutos = await CategoriaProduto.find({ $and: [{ idEstabelecimento: ingrediente.idEstabelecimento }, { statusAtivo: true }] }).lean()
        res.json({
            ingrediente: ingrediente,
            categoriasProdutos: categoriasProdutos
        })

    } catch (err) {
        console.log(err)
    }
})



// -----------  ADICIONAL ------------------------------------------------------------------------------------------
router.get('/adicionais', eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let adicionais = await Adicional.find({ $and: [{ idEstabelecimento: userEstabelecimentos }] }).populate('idEstabelecimento idCategoriaAdicional').lean().sort({ createdAt: -1 })
        let categoriasAdicionais = await CategoriaAdicional.find({ $and: [{ idEstabelecimento: userEstabelecimentos }, { statusAtivo: true }] }).populate('idEstabelecimento').lean()

        res.render('usuarios/produto/adicionais', {
            adicionais: adicionais,
            categoriasAdicionais: JSON.stringify(categoriasAdicionais)
        })

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-adicionais', async (req, res) => { // adiciono a categoria com todos os estabelecimentos
    try {
        if (!req.body.idCategoriaAdicional || !req.body.idEstabelecimento) {
            req.flash('error_msg', 'Nenhuma categoria ou estabelecimento selecionado')
            res.redirect('back')
        } else {
            let adicionalExist = await Adicional.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }, { idCategoriaAdicional: req.body.idCategoriaAdicional }] })
            if (adicionalExist) {
                req.flash('warning_msg', 'Adicional já existe para essa categoria e estabelecimento')
                res.redirect('back')
            } else {
                new Adicional({ nome: req.body.nome, valor: req.body.valor, idEstabelecimento: req.body.idEstabelecimento, idCategoriaAdicional: req.body.idCategoriaAdicional }).save().then((categoria) => {
                    req.flash('success_msg', 'Adicional adicionado')
                    res.redirect('back')
                })
            }
        }

    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-adicionais', async (req, res) => { // adiciono a categoria com todos os estabelecimentos
    try {
        let adicionalExist = await Adicional.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }, { idCategoriaAdicional: req.body.idCategoriaAdicional }] })
        if (adicionalExist && req.body.idAdicional != adicionalExist._id) {
            req.flash('warning_msg', 'Adicional já existe para essa categoria e estabelecimento')
            res.redirect('back')
        } else {
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Adicional.updateOne(
                { _id: req.body.idAdicional },
                {
                    $set:
                        { 'nome': req.body.nome, 'statusAtivo': statusAtivo, 'valor': req.body.valor }
                }
            ).then(() => {
                req.flash('success_msg', 'Adicional editado')
                res.redirect('back')
            }).catch(err => {
                console.log(err)
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-adicionais', (req, res) => { // consulto pela rota  "/produto/adicionais" para poder pegar as informações e editar seus valores
    Adicional.findById({ _id: req.body.idAdicional }).populate('idEstabelecimento idCategoriaAdicional').then(adicional => {
        res.json(adicional)
    }).catch(err => {
        console.log(err)
    })
})



// ----------- CATEGORIA ADICIONAIS ------------------------------------------------------------------------------------------

router.get('/categoria-adicionais', eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let categorias = await CategoriaAdicional.find({ idEstabelecimento: userEstabelecimentos }).populate('idEstabelecimento').lean().sort({ createdAt: -1 })

        res.render('usuarios/produto/categoria-adicionais', { categorias: categorias })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-adicionais', async (req, res) => {
    try {
        let categoriaProdutoExist = await CategoriaAdicional.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }] })
        if (categoriaProdutoExist) {
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        } else {
            new CategoriaAdicional({ nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento }).save().then((categoria) => {
                req.flash('success_msg', 'Categoria adicionada')
                res.redirect('back')
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-categoria-adicionais', async (req, res) => { // rota para editar 
    try {
        let categoriaAdicionalExist = await CategoriaAdicional.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }] })
        if (categoriaAdicionalExist && req.body.idCategoriaAdicional != categoriaAdicionalExist._id) {
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        } else {
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            CategoriaAdicional.updateOne(
                { _id: req.body.idCategoriaAdicional },
                {
                    $set:
                        { 'nome': req.body.nome, 'statusAtivo': statusAtivo }
                }
            ).then(() => {
                req.flash('success_msg', 'Categoria editada')
                res.redirect('back')
            }).catch(err => {
                console.log(err)
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-categoria-adicionais', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    CategoriaAdicional.findById({ _id: req.body.idCategoriaAdicional }).populate('idEstabelecimento').then(produto => {
        res.json(produto)
    }).catch(err => {
        console.log(err)
    })
})



// ----------- CATEGORIA PRODUTOS ------------------------------------------------------------------------------------------

router.get('/categoria-produtos', eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let categorias = await CategoriaProduto.find({ idEstabelecimento: userEstabelecimentos }).populate('idEstabelecimento').lean().sort({ createdAt: -1 })

        res.render('usuarios/produto/categoria-produtos', { categorias: categorias })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-produtos', async (req, res) => { // 
    try {
        let categoriaProdutoExist = await CategoriaProduto.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }] })
        if (categoriaProdutoExist) {
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        } else {
            new CategoriaProduto({ nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento, corBotao: req.body.botao}).save().then((categoria) => {
                req.flash('success_msg', 'Categoria adicionada')
                res.redirect('back')
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-categoria-produtos', async (req, res) => { // rota para editar 
    try {
        let categoriaProdutoExist = await CategoriaProduto.findOne({ $and: [{ nome: { $regex: req.body.nome, $options: "i" } }, { 'idEstabelecimento': req.body.idEstabelecimento }] })
        if (categoriaProdutoExist && req.body.idCategoriaProduto != categoriaProdutoExist._id) {
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        } else {
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            CategoriaProduto.updateOne(
                { _id: req.body.idCategoriaProduto },
                {
                    $set:
                        { 'nome': req.body.nome, 'corBotao':req.body.botao, 'statusAtivo': statusAtivo }
                }
            ).then(() => {
                req.flash('success_msg', 'Categoria editada')
                res.redirect('back')
            }).catch(err => {
                console.log(err)
            })
        }
    } catch (err) {
        console.log(err)
    }
})

router.post('/ajax-get-categoria-produtos', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    CategoriaProduto.findById({ _id: req.body.idCategoriaProduto }).populate('idEstabelecimento').then(produto => {
        res.json(produto)
    }).catch(err => {
        console.log(err)
    })
})

let upload = multer(multerConfig.uploadProduto).single('file')

router.post("/upload-produto/:idProduto/:idEstabelecimento", (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            let teste = "" + err; // pego o código do erro e exibo a mensagem para o usuário
            if (teste == 'Error: Invalid file type.') {
                req.flash('error_msg', 'Formato de arquivo não suportado')
                res.redirect('back')
                return
            } else {
                req.flash('error_msg', 'Arquivo muito grande! Deve possui no máximo 2 MB')
                res.redirect('back')
                return
            }
        }
        const { originalname: name, size, key, location: url = "" } = req.file;
        Produto.updateOne(
            { _id: req.params.idProduto },
            $set = {
                'img.foto': { name, size, key, url },
            },
        ).then(() => {    
            req.flash('success_msg', 'Foto editada')
            res.redirect('/produto/perfil?produto=' + req.params.idProduto)
        }).catch(err => {
            console.log(err)
        })

    })

});


module.exports = router;

