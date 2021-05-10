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

        let ingredientes = await Ingrediente.aggregate([
            {$match:  {"estabelecimentos.idEstabelecimento": {$in: userEstabelecimentos}} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentos.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentos"
                    }
            },
            {
                $lookup:
                    {
                        from: "categoriaprodutos",
                        localField: "categoriasProdutos.idCategoriaProduto",
                        foreignField: "_id",
                        as: "categoriasProdutos"
                    }
            },
            {$sort: {createdAt: -1}}
        ])

        let categoriasProdutos = await CategoriaProduto.find({$and: [{statusAtivo: true}, {'estabelecimentos.idEstabelecimento': userEstabelecimentos}]}).lean()

        res.render('usuarios/produto/ingredientes', {usuario: usuario[0], ingredientes: ingredientes, categoriasProdutos: categoriasProdutos})

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-ingredientes', (req, res) => { // adiciono a categoria com todos os estabelecimentos
    if(req.body.estabelecimentos){
        if(req.body.categoriasProdutos){
            new Ingrediente({nome: req.body.nome}).save().then((categoria) => {
                let arrayEstabelecimentos = req.body.estabelecimentos
                let arrayCategoriaProduto = JSON.parse(req.body.categoriasProdutos)
        
                arrayEstabelecimentos.forEach(element => {
                    Ingrediente.updateOne(
                        {_id: categoria._id},
                        { $push: {
                            'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                arrayCategoriaProduto.forEach(element => {
                    Ingrediente.updateOne(
                        {_id: categoria._id},
                        { $push: {
                            'categoriasProdutos': {'idCategoriaProduto': ObjectId(element.idCategoriaProduto)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

        
                req.flash('success_msg', 'Categoria adicionada')
                res.redirect('back')
            })
        }else{
            req.flash('warning_msg', 'O adicional deve possuir pelo menos uma categoria')
            res.redirect('back')
        }
    }else{
        req.flash('warning_msg', 'O adicional deve possuir pelo menos um estabelecimento')
        res.redirect('back')
    }
    
})

router.post('/edit-ingredientes', (req, res) => { // adiciono a categoria com todos os estabelecimentos
    let statusAtivo
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

    if(req.body.estabelecimentos){
        if(req.body.categoriasProdutos){
            Ingrediente.updateOne(
                {_id: ObjectId(req.body.idIngrediente)},
                {$set: {
                    'nome': req.body.nome, categoriasProdutos: [], estabelecimentos: [], statusAtivo: statusAtivo
                }}
            ).then(() => {

                let arrayEstabelecimentos = req.body.estabelecimentos
                let arrayCategoriaProduto = JSON.parse(req.body.categoriasProdutos)
        
                arrayEstabelecimentos.forEach(element => {
                    Ingrediente.updateOne(
                        {_id: ObjectId(req.body.idIngrediente)},
                        { $push: {
                            'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                arrayCategoriaProduto.forEach(element => {
                    Ingrediente.updateOne(
                        {_id: ObjectId(req.body.idIngrediente)},
                        { $push: {
                            'categoriasProdutos': {'idCategoriaProduto': ObjectId(element.idCategoriaProduto)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                setTimeout(() => {
                    req.flash('success_msg', 'Ingrediente editado')
                    res.redirect('back')
                }, 1000)
            }).catch(err => {
                console.log(err)
            })

        }else{
            req.flash('warning_msg', 'O ingrediente deve possuir pelo menos uma categoria')
            res.redirect('back')
        }
    }else{
        req.flash('warning_msg', 'O ingrediente deve possuir pelo menos um estabelecimento')
        res.redirect('back')
    }
})

router.post('/ajax-get-ingredientes', (req, res) => { // consulto pela rota  "/produto/adicionais" para poder pegar as informações e editar seus valores
    Ingrediente.aggregate([
        {$match: {_id: ObjectId(req.body.idIngrediente)}},
        {
            $lookup:
                {
                    from: "categoriaprodutos",
                    localField: "categoriasProdutos.idCategoriaProduto",
                    foreignField: "_id",
                    as: "categoriasProdutos"
                }
        },
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentos.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentos"
                }
        },
        {
            $addFields: {
                estabelecimentosUsuario: req.user.estabelecimentosVinculados
            }
        },
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentosUsuario.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosUsuario"
                }
        }
    ]).then(ingrediente => {
        res.json(ingrediente[0])
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

        let adiconais = await Adicional.aggregate([
            {$match:  {"estabelecimentos.idEstabelecimento": {$in: userEstabelecimentos}} },
            {
                $lookup:
                    {
                        from: "estabelecimentos",
                        localField: "estabelecimentos.idEstabelecimento",
                        foreignField: "_id",
                        as: "estabelecimentos"
                    }
            },
            {
                $lookup:
                    {
                        from: "categoriaadicionais",
                        localField: "categoriasAdicionais.idCategoriaAdicional",
                        foreignField: "_id",
                        as: "categoriasAdicionais"
                    }
            },
            {$sort: {createdAt: -1}}
        ])

        let categoriaAdicionais = await CategoriaAdicional.find({$and: [{statusAtivo: true}, {'estabelecimentos.idEstabelecimento': userEstabelecimentos}]}).lean()

        res.render('usuarios/produto/adicionais', {usuario: usuario[0], adiconais: adiconais, categoriaAdicionais: categoriaAdicionais})

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-adicionais', (req, res) => { // adiciono a categoria com todos os estabelecimentos
    if(req.body.estabelecimentos){
        if(req.body.categoriasAdicionais){
            new Adicional({nome: req.body.nome, valor: req.body.valor}).save().then((categoria) => {
                let arrayEstabelecimentos = req.body.estabelecimentos
                let arrayCategoriaAdicional = JSON.parse(req.body.categoriasAdicionais)
        
                arrayEstabelecimentos.forEach(element => {
                    Adicional.updateOne(
                        {_id: categoria._id},
                        { $push: {
                            'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                arrayCategoriaAdicional.forEach(element => {
                    Adicional.updateOne(
                        {_id: categoria._id},
                        { $push: {
                            'categoriasAdicionais': {'idCategoriaAdicional': ObjectId(element.idCategoriaAdicional)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                req.flash('success_msg', 'Adicional editado')
                res.redirect('back')
            })
        }else{
            req.flash('warning_msg', 'O adicional deve possuir pelo menos uma categoria')
            res.redirect('back')
        }
    }else{
        req.flash('warning_msg', 'O adicional deve possuir pelo menos um estabelecimento')
        res.redirect('back')
    }
    
})

router.post('/edit-adicionais', (req, res) => { // adiciono a categoria com todos os estabelecimentos
    let statusAtivo
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

    if(req.body.estabelecimentos){
        if(req.body.categoriasAdicionais){
            Adicional.updateOne(
                {_id: ObjectId(req.body.idAdicional)},
                {$set: {
                    'nome': req.body.nome, 'valor': req.body.valor, categoriasAdicionais: [], estabelecimentos: [], statusAtivo: statusAtivo
                }}
            ).then(() => {

                let arrayEstabelecimentos = req.body.estabelecimentos
                let arrayCategoriaAdicional = JSON.parse(req.body.categoriasAdicionais)
        
                arrayEstabelecimentos.forEach(element => {
                    Adicional.updateOne(
                        {_id: ObjectId(req.body.idAdicional)},
                        { $push: {
                            'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                arrayCategoriaAdicional.forEach(element => {
                    Adicional.updateOne(
                        {_id: ObjectId(req.body.idAdicional)},
                        { $push: {
                            'categoriasAdicionais': {'idCategoriaAdicional': ObjectId(element.idCategoriaAdicional)},
                        }}
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                setTimeout(() => {
                    req.flash('success_msg', 'Categoria adicionada')
                    res.redirect('back')
                }, 1000)
            }).catch(err => {
                console.log(err)
            })

        }else{
            req.flash('warning_msg', 'O adicional deve possuir pelo menos uma categoria')
            res.redirect('back')
        }
    }else{
        req.flash('warning_msg', 'O adicional deve possuir pelo menos um estabelecimento')
        res.redirect('back')
    }
})

router.post('/ajax-get-adicionais', (req, res) => { // consulto pela rota  "/produto/adicionais" para poder pegar as informações e editar seus valores
    Adicional.aggregate([
        {$match: {_id: ObjectId(req.body.idAdicional)}},
        {
            $lookup:
                {
                    from: "categoriaadicionais",
                    localField: "categoriasAdicionais.idCategoriaAdicional",
                    foreignField: "_id",
                    as: "categoriasAdicionais"
                }
        },
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentos.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentos"
                }
        },
        {
            $addFields: {
                estabelecimentosUsuario: req.user.estabelecimentosVinculados
            }
        },
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentosUsuario.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosUsuario"
                }
        }
    ]).then(adicional => {
        res.json(adicional[0])
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

        let categorias = await CategoriaAdicional.aggregate([
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
        
        res.render('usuarios/produto/categoria-adicionais', {usuario: usuario[0], categorias: categorias})

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-adicionais', (req, res) => { // adiciono a categoria com todos os estabelecimentos
    if(req.body.estabelecimentos){
        new CategoriaAdicional({nome: req.body.nome}).save().then((categoria) => {
            let arrayEstabelecimentos = req.body.estabelecimentos
    
            arrayEstabelecimentos.forEach(element => {
                CategoriaAdicional.updateOne(
                    {_id: categoria._id},
                    { $push: {
                        'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                    }}
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
    
            req.flash('success_msg', 'Categoria adicionada')
            res.redirect('back')
        })
    }else{
        req.flash('warning_msg', 'Ao adicionar uma categoria ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }
})

router.post('/edit-categoria-adicionais', (req, res) => { // rota para editar 
    let statusAtivo
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false
    let arrayEstabelecimentos = req.body.estabelecimentos

    if(!arrayEstabelecimentos){
        req.flash('warning_msg', 'Ao editar uma categoria ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }else{
        CategoriaAdicional.updateOne( // defino que o estabelecimento é valor zerado e depois ocorre o forEach adicionando todos os estabelecimentos
            {_id: req.body.idCategoriaAdicional},
            { $set: 
                {'estabelecimentos': [], 'nome': req.body.nome, 'statusAtivo': statusAtivo}
            }
        ).then(() => {
            arrayEstabelecimentos.forEach(element => {
                CategoriaAdicional.updateOne(
                    {_id: req.body.idCategoriaAdicional},
                    { $push: 
                        {'estabelecimentos': {'idEstabelecimento': ObjectId(element)}}
                    }
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
            setTimeout(() => {
                req.flash('success_msg', 'Categoria adicionada')
                res.redirect('back')
            }, 1000)
        }).catch(err => {
            console.log(err)
        })
    }
})

router.post('/ajax-get-categoria-adicionais', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    CategoriaAdicional.aggregate([
        {$match: {_id: ObjectId(req.body.idCategoriaAdicional)}},
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentos.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentos"
                }
        },
        {
            $addFields: {
                estabelecimentosUsuario: req.user.estabelecimentosVinculados
            }
        },
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentosUsuario.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosUsuario"
                }
        }
    ]).then(categoria => {
        res.json(categoria[0])
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
        
        //res.json(usuario)
        res.render('usuarios/produto/categoria-produtos', {usuario: usuario[0], categorias: categorias})

    } catch (err) {
        console.log(err)
    }
})

router.post('/add-categoria-produtos', (req, res) => { // adiciono a categoria com todos os estabelecimentos
    if(req.body.estabelecimentos){
        new CategoriaProduto({nome: req.body.nome}).save().then((categoria) => {
            let arrayEstabelecimentos = req.body.estabelecimentos
    
            arrayEstabelecimentos.forEach(element => {
                CategoriaProduto.updateOne(
                    {_id: categoria._id},
                    { $push: {
                        'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                    }}
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
    
            req.flash('success_msg', 'Categoria adicionada')
            res.redirect('back')
        })
    }else{
        req.flash('warning_msg', 'Ao adicionar uma categoria ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }
    
})

router.post('/edit-categoria-produtos', (req, res) => { // rota para editar 
    let statusAtivo
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false

    let arrayEstabelecimentos = req.body.estabelecimentos

    if(!arrayEstabelecimentos){
        req.flash('warning_msg', 'Ao editar uma categoria ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }else{
        CategoriaProduto.updateOne( // defino que o estabelecimento é valor zerado e depois ocorre o forEach adicionando todos os estabelecimentos
            {_id: req.body.idCategoriaProduto},
            { $set: 
                {'estabelecimentos': [], 'nome': req.body.nome, 'statusAtivo': statusAtivo}
            }
        ).then(() => {
            arrayEstabelecimentos.forEach(element => {
                CategoriaProduto.updateOne(
                    {_id: req.body.idCategoriaProduto},
                    { $push: 
                        {'estabelecimentos': {'idEstabelecimento': ObjectId(element)}}
                    }
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
        }).catch(err => {
            console.log(err)
        })

        setTimeout(() => {
            req.flash('success_msg', 'Categoria adicionada')
            res.redirect('back')
        }, 1000)
    }
})

router.post('/ajax-get-categoria-produtos', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    CategoriaProduto.aggregate([
        {$match: {_id: ObjectId(req.body.idCategoriaProduto)}},
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentos.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentos"
                }
        },
        {
            $addFields: {
                estabelecimentosUsuario: req.user.estabelecimentosVinculados
            }
        },
        {
            $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentosUsuario.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosUsuario"
                }
        }
    ]).then(categoria => {
        res.json(categoria[0])
    })
})


module.exports = router;

