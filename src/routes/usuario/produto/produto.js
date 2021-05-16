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
router.get('/perfil', async(req, res) => {
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let produto = await  Produto.findById({_id: req.query.produto})
            .populate('adicionais.idCategoriaAdicional adicionais.idAdicional idCategoriaProduto idEstabelecimento ingredientes.idIngrediente').lean()

        let ingredientes = await Ingrediente.find({$and: [{'categoriasProdutos.idCategoriaProduto': produto.idCategoriaProduto},{statusAtivo:true} ]}).lean()
        
        let adicionais = await Adicional.find({$and: [{'idEstabelecimento': produto.idEstabelecimento}]}).populate('idCategoriaAdicional').lean()

        let categoriasAdicional = await CategoriaAdicional.find({$and: [{'idEstabelecimento': produto.idEstabelecimento}, {statusAtivo:true}]}).lean()
        

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

router.post('/add-produto-ingrediente', (req, res) => { // adicionar ingredientes aos produtos
    if(!req.body.idIngredientes){
        req.flash('error_msg', 'O produto deve possuir pelo menos um ingrediente')
        res.redirect('back')
    }else{
        Produto.updateOne(
            {_id: req.body.idProduto},
            {$set: {
                'ingredientes': []
            }}
        ).then(() => {
            let arrayIdIngredientes = JSON.parse(req.body.idIngredientes)
    
            arrayIdIngredientes.forEach(element => {
                Produto.updateOne(
                    {_id: req.body.idProduto},
                    {$push: {
                        'ingredientes': {'idIngrediente': element.idIngrediente}
                    }}
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

router.post('/add-produto-adicional-individual', (req, res) => { // adicionar ingredientes aos produtos
    if(req.body.idAdicional){
        let arrayIdAdicionais = JSON.parse(req.body.idAdicional)

        arrayIdAdicionais.forEach(element => {
            Produto.updateOne(
                {_id: req.body.idProduto},
                {$push: {
                    'adicionais': {'idAdicional': element.idAdicional, 'idCategoriaAdicional': element.idCategoriaAdicional}
                }}
            ).then(() => {
    
            }).catch(err => {
                console.log(err)
            })
        })

        req.flash('success_msg', 'Adicional editado')
        res.redirect('back')
    }else{
        req.flash('warning_msg', 'Você deve selecionar pelo menos um adicional para adicionar')
        res.redirect('back')
    }
})


router.post('/delete-produto-adicional', (req, res) => {
    Produto.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
        {'_id': req.body.idProduto},
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

router.get('/produtos', async (req, res ) => { // listo todos os produtos
    let userEstabelecimentos = []
    req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

    let produtos = await Produto.find({idEstabelecimento: userEstabelecimentos}).populate('idCategoriaProduto idEstabelecimento').lean().sort({createdAt: -1})
    let estabelecimentos = await Estabelecimento.find({_id: userEstabelecimentos}).lean()
    let categoriasProdutos = await CategoriaProduto.find({$and: [{idEstabelecimento: userEstabelecimentos}, {statusAtivo: true}]}).populate('idEstabelecimento').lean()

    res.render('usuarios/produto/produtos', {
        produtos: produtos, 
        estabelecimentos: estabelecimentos, 
        categoriasProdutos: JSON.stringify(categoriasProdutos)
    })
    
})

router.post('/edit-produto', async (req, res) => { // editar o produto
    try {
        let produtoExist = await Produto.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaProduto: req.body.idCategoriaProduto}]})
        if(produtoExist && req.body.idProduto != produtoExist._id){
            req.flash('warning_msg', 'Produto já existe para essa categoria e estabelecimento')
            res.redirect('back')
        }else{
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Produto.updateOne(
                {_id: req.body.idProduto},
                { $set: 
                    {'nome': req.body.nome, 'valor': req.body.valor, 'descricao': req.body.descricao, 'statusAtivo': statusAtivo}
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
    if(!req.body.idEstabelecimento || !req.body.idCategoriaProduto){
        req.flash('error_msg', 'Nenhuma categoria ou estabelecimento selecionado')
        res.redirect('back')
    }else{
        let produtoExist = await Produto.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaProduto: req.body.idCategoriaProduto}]})
        if(produtoExist){
            req.flash('warning_msg', 'Produto já existe para essa categoria e estabelecimento')
            res.redirect('back')
        }else{
            let addProduto = {
                nome: req.body.nome,
                valor: req.body.valor,
                descricao: req.body.descricao,
                idCategoriaProduto: req.body.idCategoriaProduto,
                idEstabelecimento: req.body.idEstabelecimento,
                identificaouuidv4: req.user.identificaouuidv4
            }
        
            new Produto(addProduto).save().then(() => {
                req.flash('success_msg', 'Produto adicionado')
                res.redirect('back')
            }).catch(err => {
                console.log(err)
            })
        }
    }
})


router.post('/ajax-get-produto-adicioanais-categoria-adicionais', (req, res) => { // consulto os adicionais pela categoria e estabelecimento selecionado no perfil
    Produto.findById({_id: req.body.idProduto}).then(produto => {
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


// -----------  INGREDIENTES ------------------------------------------------------------------------------------------
router.get('/ingredientes',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let ingredientes = await Ingrediente.find({$and: [{idEstabelecimento: userEstabelecimentos}]}).populate('idEstabelecimento categoriasProdutos.idCategoriaProduto').lean().sort({createdAt: -1})
        let categoriasProdutos = await CategoriaProduto.find({$and: [{idEstabelecimento: userEstabelecimentos}, {statusAtivo: true}]}).populate('idEstabelecimento').lean()

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
        if(!req.body.idCategoriaProduto || !req.body.idEstabelecimento){
            req.flash('error_msg', 'Nenhuma categoria ou estabelecimento selecionado')
            res.redirect('back')
        }else{
            let ingredienteExist = await Ingrediente.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}]})
            if(ingredienteExist){
                req.flash('warning_msg', 'Ingrediente já existe para esse estabelecimento. Vincule o ingrediente a nova categoria também')
                res.redirect('back')
            }else{
                new Ingrediente({nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento, idCategoriaProduto: req.body.idCategoriaProduto}).save().then((ingrediente) => {
                    req.body.idCategoriaProduto.forEach(element => {
                        Ingrediente.updateOne(
                            {_id: ingrediente._id},
                            { $push: {
                                'categoriasProdutos': {'idCategoriaProduto': ObjectId(element)},
                            }}
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
        let ingredienteExist = await Ingrediente.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}]})
        if(ingredienteExist && req.body.idIngrediente != ingredienteExist._id){
            req.flash('warning_msg', 'Ingrediente já existe para esse estabelecimento')
            res.redirect('back')
        }else{
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Ingrediente.updateOne(
                {_id: req.body.idIngrediente},
                { $set: 
                    {'nome': req.body.nome, 'statusAtivo': statusAtivo, categoriasProdutos: []}
                }
            ).then(() => {
                req.body.idCategoriaProduto.forEach(element => {
                    Ingrediente.updateOne(
                        {_id: req.body.idIngrediente},
                        { $push: {
                            'categoriasProdutos': {'idCategoriaProduto': ObjectId(element)},
                        }}
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
        let ingrediente = await Ingrediente.findById({_id: req.body.idIngrediente}).populate('idEstabelecimento categoriasProdutos.idCategoriaProduto').lean()
        let categoriasProdutos = await CategoriaProduto.find({$and: [{idEstabelecimento: ingrediente.idEstabelecimento}, {statusAtivo:true}]}).lean()
        res.json({
            ingrediente: ingrediente,
            categoriasProdutos: categoriasProdutos
        })

    } catch (err) {
        console.log(err)
    }
})



// -----------  ADICIONAL ------------------------------------------------------------------------------------------
router.get('/adicionais',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let adicionais = await Adicional.find({$and: [{idEstabelecimento: userEstabelecimentos}]}).populate('idEstabelecimento idCategoriaAdicional').lean().sort({createdAt: -1})
        let categoriasAdicionais = await CategoriaAdicional.find({$and: [{idEstabelecimento: userEstabelecimentos}, {statusAtivo: true}]}).populate('idEstabelecimento').lean()

        res.render('usuarios/produto/adicionais', {
            adicionais: adicionais, 
            categoriasAdicionais: JSON.stringify(categoriasAdicionais)
        })

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-adicionais',async (req, res) => { // adiciono a categoria com todos os estabelecimentos
    try {
        if(!req.body.idCategoriaAdicional || !req.body.idEstabelecimento){
            req.flash('error_msg', 'Nenhuma categoria ou estabelecimento selecionado')
            res.redirect('back')
        }else{
            let adicionalExist = await Adicional.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaAdicional: req.body.idCategoriaAdicional}]})
            if(adicionalExist){
                req.flash('warning_msg', 'Adicional já existe para essa categoria e estabelecimento')
                res.redirect('back')
            }else{
                new Adicional({nome: req.body.nome, valor: req.body.valor, idEstabelecimento: req.body.idEstabelecimento, idCategoriaAdicional: req.body.idCategoriaAdicional}).save().then((categoria) => {
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
        let adicionalExist = await Adicional.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaAdicional: req.body.idCategoriaAdicional}]})
        if(adicionalExist && req.body.idAdicional != adicionalExist._id){
            req.flash('warning_msg', 'Adicional já existe para essa categoria e estabelecimento')
            res.redirect('back')
        }else{
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Adicional.updateOne(
                {_id: req.body.idAdicional},
                { $set: 
                    {'nome': req.body.nome, 'statusAtivo': statusAtivo, 'valor': req.body.valor}
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
    Adicional.findById({_id: req.body.idAdicional}).populate('idEstabelecimento idCategoriaAdicional').then(adicional => {
        res.json(adicional)
    }).catch(err => {
        console.log(err)
    })
})



// ----------- CATEGORIA ADICIONAIS ------------------------------------------------------------------------------------------

router.get('/categoria-adicionais',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let categorias = await CategoriaAdicional.find({idEstabelecimento: userEstabelecimentos}).populate('idEstabelecimento').lean().sort({createdAt: -1})

        res.render('usuarios/produto/categoria-adicionais', { categorias: categorias})
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-adicionais', async (req, res) => { 
    try {
        let categoriaProdutoExist = await CategoriaAdicional.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}]})
        if(categoriaProdutoExist){
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        }else{
            new CategoriaAdicional({nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento}).save().then((categoria) => {
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
        let categoriaAdicionalExist = await CategoriaAdicional.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}]})
        if(categoriaAdicionalExist && req.body.idCategoriaAdicional != categoriaAdicionalExist._id){
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        }else{
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            CategoriaAdicional.updateOne(
                {_id: req.body.idCategoriaAdicional},
                { $set: 
                    {'nome': req.body.nome, 'statusAtivo': statusAtivo}
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
    CategoriaAdicional.findById({_id: req.body.idCategoriaAdicional}).populate('idEstabelecimento').then(produto => {
        res.json(produto)
    }).catch(err => {
        console.log(err)
    })
})



// ----------- CATEGORIA PRODUTOS ------------------------------------------------------------------------------------------

router.get('/categoria-produtos',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let categorias = await CategoriaProduto.find({idEstabelecimento: userEstabelecimentos}).populate('idEstabelecimento').lean().sort({createdAt: -1})

        res.render('usuarios/produto/categoria-produtos', {categorias: categorias})
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-produtos', async (req, res) => { // 
    try {
        let categoriaProdutoExist = await CategoriaProduto.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}]})
        if(categoriaProdutoExist){
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        }else{
            new CategoriaProduto({nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento}).save().then((categoria) => {
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
        let categoriaProdutoExist = await CategoriaProduto.findOne({$and: [{nome: {$regex: req.body.nome, $options:"i"}}, {'idEstabelecimento': req.body.idEstabelecimento}]})
        if(categoriaProdutoExist && req.body.idCategoriaProduto != categoriaProdutoExist._id){
            req.flash('warning_msg', 'O nome da categoria já existe para o estabelecimento selecionado')
            res.redirect('back')
        }else{
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            CategoriaProduto.updateOne(
                {_id: req.body.idCategoriaProduto},
                { $set: 
                    {'nome': req.body.nome, 'statusAtivo': statusAtivo}
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
    CategoriaProduto.findById({_id: req.body.idCategoriaProduto}).populate('idEstabelecimento').then(produto => {
        res.json(produto)
    }).catch(err => {
        console.log(err)
    })
})


module.exports = router;

