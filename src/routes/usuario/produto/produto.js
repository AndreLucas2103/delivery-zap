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
        req.user.estabelecimentoSelecionado == null ?  req.user.estabelecimentosVinculados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) : userEstabelecimentos.push(req.user.estabelecimentoSelecionado)
        // linha acima realiza a verificacao do usuario logado e busca quais estabelecimentos estão selecionados para listar, caso não tenha nenhum é realizado um forEach para juntar todos dentro da array, se tiver selecionado algum estabelecimento é feito apenas um push do estabelecimento selecionado, todos os dados são tratados como array
        
        produto = await Produto.aggregate([
            {$match: {_id: ObjectId(req.query.produto)}},
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "idEstabelecimento",
                        foreignField: "_id",
                        as: "idEstabelecimento"
                    }
            },
            {
                $lookup:
                    {
                        from: "categoriaprodutos",
                        localField: "idCategoriaProduto",
                        foreignField: "_id",
                        as: "idCategoriaProduto"
                    }
            },
            {
                $lookup:
                    {
                        from: "ingredientes",
                        localField: "ingredientes.idIngrediente",
                        foreignField: "_id",
                        as: "ingredientes"
                    }
            },
            {
                $lookup:
                    {
                        from: "adicionais",
                        localField: "adicionais.idAdicional",
                        foreignField: "_id",
                        as: "adicionais"
                    }
            },
            {$unwind: '$idEstabelecimento'},
            {$unwind: '$idCategoriaProduto'}
        ])
        
        let categoriasProdutos = await CategoriaProduto.aggregate([
            {$match:  {$and: [{"estabelecimentos.idEstabelecimento": {$in: userEstabelecimentos}}, {statusAtivo:true}]}},
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentos.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentos"
                    }
            }
        ])
        let estabelecimentos = await Estabelecimento.find({_id: userEstabelecimentos}).lean()
        let ingredientes = await Ingrediente.find({$and: [{'estabelecimentos.idEstabelecimento': userEstabelecimentos}]}).lean()
        let adicionais = await Adicional.find({$and: [{'estabelecimentos.idEstabelecimento': userEstabelecimentos}]}).lean()
        let categoriasAdicional = await CategoriaAdicional.find({$and: [{'estabelecimentos.idEstabelecimento': userEstabelecimentos}, {statusAtivo:true}]}).lean()

        console.log(produto[0].ingredientes)

        res.render('usuarios/produto/produto', {
            produto: produto[0],
            categoriasProdutos: categoriasProdutos,
            estabelecimentos: estabelecimentos,
            ingredientes: ingredientes,
            categoriasAdicional: categoriasAdicional,
            adicionais: adicionais
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-produto-ingrediente', (req, res) => { // adicionar ingredientes aos produtos
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

    
    
})

router.post('/add-produto-adicional-individual', (req, res) => { // adicionar ingredientes aos produtos
    if(req.body.idAdicional){
        Produto.updateOne(
            {_id: req.body.idProduto},
            {$set: {
                'adicionais': []
            }}
        ).then(() => {
            let arrayIdAdicionais = JSON.parse(req.body.idAdicional)
    
            arrayIdAdicionais.forEach(element => {
                Produto.updateOne(
                    {_id: req.body.idProduto},
                    {$push: {
                        'adicionais': {'idAdicional': element.idAdicional}
                    }}
                ).then(() => {
        
                }).catch(err => {
                    console.log(err)
                })
            })
    
            req.flash('success_msg', 'Adicional editado')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    }else{
        req.flash('warning_msg', 'Você deve selecionar pelo menos um adicional para adicionar')
        res.redirect('back')
    }
})

router.post('/delete-produto-ingrediente', (req, res) => {
    console.log(req.body.idObjectIngrediente)
    Produto.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
        {'_id': req.body.idProduto},
        { $pull: {
            'ingredientes': {idIngrediente: ObjectId(req.body.idObjectIngrediente)},
        }}
    ).then(() => {
        req.flash('success_msg', 'Ingrediente removido')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/delete-produto-adicional', (req, res) => {
    console.log(req.body.idObjectIngrediente)
    Produto.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
        {'_id': req.body.idProduto},
        { $pull: {
            'adicionais': {idAdicional: ObjectId(req.body.idObjectAdicional)},
        }}
    ).then(() => {
        req.flash('success_msg', 'Adicional removido')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.get('/produtos', (req, res ) => { // listo todos os produtos
    let userEstabelecimentos = []
    req.user.estabelecimentoSelecionado == null ?  req.user.estabelecimentosVinculados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) : userEstabelecimentos.push(req.user.estabelecimentoSelecionado)
    // linha acima realiza a verificacao do usuario logado e busca quais estabelecimentos estão selecionados para listar, caso não tenha nenhum é realizado um forEach para juntar todos dentro da array, se tiver selecionado algum estabelecimento é feito apenas um push do estabelecimento selecionado, todos os dados são tratados como array
    
    Produto.find({idEstabelecimento: userEstabelecimentos}).lean().populate('idEstabelecimento idCategoriaProduto').then( async produtos => {
        let categorias = await CategoriaProduto.aggregate([
            {$match:  {"estabelecimentos.idEstabelecimento": {$in: userEstabelecimentos}} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentos.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentos"
                    }
            }
        ])
        let estabelecimentos = await Estabelecimento.find({_id: userEstabelecimentos}).lean()

        res.render('usuarios/produto/produtos', {produtos: produtos, estabelecimentos: estabelecimentos, categorias: categorias})
    }).catch(err => {
        console.log(err)
    })
})

router.post('/edit-produto', (req, res) => { // editar o produto
    let statusAtivo
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

    Produto.updateOne(
        {_id: req.body.idProduto},
        {$set: {
            nome: req.body.nome,
            valor: req.body.valor,
            descricao: req.body.descricao,
            idCategoriaProduto: req.body.categoria,
            idEstabelecimento: req.body.estabelecimento,
            statusAtivo: statusAtivo
        }}
    ).then(() => {
        req.flash('success_msg', 'Produto editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/add-produto', (req, res) => { // adicionar produto
    let addProduto = {
        nome: req.body.nome,
        valor: req.body.valor,
        descricao: req.body.descricao,
        idCategoriaProduto: req.body.categoria,
        idEstabelecimento: req.body.estabelecimento,
        identificaouuidv4: req.user.identificaouuidv4
    }

    new Produto(addProduto).save().then(() => {
        req.flash('success_msg', 'Produto adicionado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})


router.post('/ajax-get-produto-ingredientes-categoria-produtos', (req, res) => { // consulto os ingredientes pela categoria e estabelecimento selecionado no perfil
    let userEstabelecimentos = [], idCategoriaProduto
    req.user.estabelecimentoSelecionado == null ?  req.user.estabelecimentosVinculados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) : userEstabelecimentos.push(req.user.estabelecimentoSelecionado)
    // linha acima realiza a verificacao do usuario logado e busca quais estabelecimentos estão selecionados para listar, caso não tenha nenhum é realizado um forEach para juntar todos dentro da array, se tiver selecionado algum estabelecimento é feito apenas um push do estabelecimento selecionado, todos os dados são tratados como array
    
    req.body.idCategoriaProduto ? idCategoriaProduto = {$and: [{'categoriasProdutos.idCategoriaProduto': ObjectId(req.body.idCategoriaProduto)}, {statusAtivo:true}, {'estabelecimentos.idEstabelecimento': userEstabelecimentos} ]}  : idCategoriaProduto = {$and: [{statusAtivo:true}, {'estabelecimentos.idEstabelecimento': userEstabelecimentos}]}
    
    Ingrediente.find(idCategoriaProduto).lean().then(ingredientes => {
        res.json(ingredientes)
    }).catch(err => {
        console.log(err)
    })
})

router.post('/ajax-get-produto-adicioanais-categoria-adicionais', (req, res) => { // consulto os adicionais pela categoria e estabelecimento selecionado no perfil
    let userEstabelecimentos = [], idCategoriaAdicional
    req.user.estabelecimentoSelecionado == null ?  req.user.estabelecimentosVinculados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) : userEstabelecimentos.push(req.user.estabelecimentoSelecionado)
    // linha acima realiza a verificacao do usuario logado e busca quais estabelecimentos estão selecionados para listar, caso não tenha nenhum é realizado um forEach para juntar todos dentro da array, se tiver selecionado algum estabelecimento é feito apenas um push do estabelecimento selecionado, todos os dados são tratados como array
    
    req.body.idCategoriaAdicional ? idCategoriaAdicional = {$and: [{'categoriasAdicionais.idCategoriaAdicional': ObjectId(req.body.idCategoriaAdicional)}, {statusAtivo:true}, {'estabelecimentos.idEstabelecimento': userEstabelecimentos} ]}  : idCategoriaAdicional = {$and: [{statusAtivo:true}, {'estabelecimentos.idEstabelecimento': userEstabelecimentos}]}
    
    Adicional.find(idCategoriaAdicional).lean().then(adicionais => {
        res.json(adicionais)
    }).catch(err => {
        console.log(err)
    })
})


// -----------  INGREDIENTES ------------------------------------------------------------------------------------------
router.get('/ingredientes',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let usuario = await Usuario.aggregate([
            { $match: { _id: req.user._id} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentosVinculados.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentosVinculados"
                    }
            }
        ])

        let userEstabelecimentos = []
        usuario[0].estabelecimentosVinculados.forEach(element => { // alterar para usuario logado
            userEstabelecimentos.push(element._id) // voltar para idEstabelecimento
        })

        let ingredientes = await Ingrediente.find({$and: [{idEstabelecimento: userEstabelecimentos}]}).populate('idEstabelecimento idCategoriaProduto').lean().sort({createdAt: -1})
        let categoriasProdutos = await CategoriaProduto.find({$and: [{idEstabelecimento: userEstabelecimentos}, {statusAtivo: true}]}).populate('idEstabelecimento').lean()

        res.render('usuarios/produto/ingredientes', {
            usuario: usuario[0], 
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
            let ingredienteExist = await Ingrediente.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaProduto: req.body.idCategoriaProduto}]})
            if(ingredienteExist){
                req.flash('warning_msg', 'Ingrediente já existe para essa categoria e estabelecimento')
                res.redirect('back')
            }else{
                new Ingrediente({nome: req.body.nome, idEstabelecimento: req.body.idEstabelecimento, idCategoriaProduto: req.body.idCategoriaProduto}).save().then((categoria) => {
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
        let ingredienteExist = await Ingrediente.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaProduto: req.body.idCategoriaProduto}]})
        if(ingredienteExist && req.body.idIngrediente != ingredienteExist._id){
            req.flash('warning_msg', 'Ingrediente já existe para essa categoria e estabelecimento')
            res.redirect('back')
        }else{
            let statusAtivo
            req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

            Ingrediente.updateOne(
                {_id: req.body.idIngrediente},
                { $set: 
                    {'nome': req.body.nome, 'statusAtivo': statusAtivo}
                }
            ).then(() => {
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

router.post('/ajax-get-ingredientes', (req, res) => { // consulto pela rota  "/produto/adicionais" para poder pegar as informações e editar seus valores
    Ingrediente.findById({_id: req.body.idIngrediente}).populate('idEstabelecimento idCategoriaProduto').then(ingrediente => {
        res.json(ingrediente)
    }).catch(err => {
        console.log(err)
    })
})



// -----------  ADICIONAL ------------------------------------------------------------------------------------------
router.get('/adicionais',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let usuario = await Usuario.aggregate([
            { $match: { _id: req.user._id} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentosVinculados.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentosVinculados"
                    }
            }
        ])

        let userEstabelecimentos = []
        usuario[0].estabelecimentosVinculados.forEach(element => { // alterar para usuario logado
            userEstabelecimentos.push(element._id) // voltar para idEstabelecimento
        })

        let adicionais = await Adicional.find({$and: [{idEstabelecimento: userEstabelecimentos}]}).populate('idEstabelecimento idCategoriaAdicional').lean().sort({createdAt: -1})
        let categoriasAdicionais = await CategoriaAdicional.find({$and: [{idEstabelecimento: userEstabelecimentos}, {statusAtivo: true}]}).populate('idEstabelecimento').lean()

        res.render('usuarios/produto/adicionais', {
            usuario: usuario[0], 
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
            let adicionalExist = await Adicional.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaAdicional: req.body.idCategoriaAdicional}]})
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
        let adicionalExist = await Adicional.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}, {idCategoriaAdicional: req.body.idCategoriaAdicional}]})
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
        
        console.log(adicional)
        res.json(adicional)
        
    }).catch(err => {
        console.log(err)
    })
})



// ----------- CATEGORIA ADICIONAIS ------------------------------------------------------------------------------------------

router.get('/categoria-adicionais',eAdmin, async (req, res) => { // listo todas as categorias
    try {
        let usuario = await Usuario.aggregate([
            { $match: { _id: req.user._id} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentosVinculados.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentosVinculados"
                    }
            }
        ])

        let userEstabelecimentos = []
        usuario[0].estabelecimentosVinculados.forEach(element => { // alterar para usuario logado
            userEstabelecimentos.push(element._id) // voltar para idEstabelecimento
        })

        let categorias = await CategoriaAdicional.find({idEstabelecimento: userEstabelecimentos}).populate('idEstabelecimento').lean().sort({createdAt: -1})

        res.render('usuarios/produto/categoria-adicionais', {usuario: usuario[0], categorias: categorias})
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-adicionais', async (req, res) => { 
    try {
        let categoriaProdutoExist = await CategoriaAdicional.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}]})
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
        let categoriaAdicionalExist = await CategoriaAdicional.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}]})
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
        let usuario = await Usuario.aggregate([
            { $match: { _id: req.user._id} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentosVinculados.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentosVinculados"
                    }
            }
        ])

        let userEstabelecimentos = []
        usuario[0].estabelecimentosVinculados.forEach(element => { // alterar para usuario logado
            userEstabelecimentos.push(element._id) // voltar para idEstabelecimento
        })

        let categorias = await CategoriaProduto.find({idEstabelecimento: userEstabelecimentos}).populate('idEstabelecimento').lean().sort({createdAt: -1})

        res.render('usuarios/produto/categoria-produtos', {usuario: usuario[0], categorias: categorias})
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-produtos', async (req, res) => { // 
    try {
        let categoriaProdutoExist = await CategoriaProduto.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}]})
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
        let categoriaProdutoExist = await CategoriaProduto.findOne({$and: [{nome: req.body.nome}, {'idEstabelecimento': req.body.idEstabelecimento}]})
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

