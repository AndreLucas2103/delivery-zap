const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/CategoriaProduto")
const CategoriaProduto = mongoose.model("categoriaProdutos")
require("../../../models/CategoriaAdicional")
const CategoriaAdicional = mongoose.model("categoriaAdicionais")






// ----------- CATEGORIA ADICIONAIS ------------------------------------------------------------------------------------------

router.get('/categoria-adicionais', async (req, res) => { // listo todas as categorias
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
})

router.post('/edit-categoria-adicionais', (req, res) => { // rota para editar 
    let arrayEstabelecimentos = req.body.estabelecimentos

    if(!arrayEstabelecimentos){
        req.flash('warning_msg', 'Ao editar uma categoria ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }else{
        CategoriaAdicional.updateOne( // defino que o estabelecimento é valor zerado e depois ocorre o forEach adicionando todos os estabelecimentos
            {_id: req.body.idCategoriaAdicional},
            { $set: 
                {'estabelecimentos': [], 'nome': req.body.nome}
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
    CategoriaAdicional.findById({_id: req.body.idCategoriaAdicional}).lean().then(categoria => {
        res.json(categoria)
    })
})

// ----------- CATEGORIA PRODUTOS ------------------------------------------------------------------------------------------

router.get('/categoria-produtos', async (req, res) => { // listo todas as categorias
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
})

router.post('/edit-categoria-produtos', (req, res) => { // rota para editar 
    let arrayEstabelecimentos = req.body.estabelecimentos

    if(!arrayEstabelecimentos){
        req.flash('warning_msg', 'Ao editar uma categoria ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }else{
        CategoriaProduto.updateOne( // defino que o estabelecimento é valor zerado e depois ocorre o forEach adicionando todos os estabelecimentos
            {_id: req.body.idCategoriaProduto},
            { $set: 
                {'estabelecimentos': [], 'nome': req.body.nome}
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
    CategoriaProduto.findById({_id: req.body.idCategoriaProduto}).lean().then(categoria => {
        res.json(categoria)
    })
})


module.exports = router;

