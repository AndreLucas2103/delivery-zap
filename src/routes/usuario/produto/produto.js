const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/CategoriaProduto")
const CategoriaProduto = mongoose.model("categoriaProdutos")

router.get('/categoria-produtos', async (req, res) => {
    try {
        let usuario = await Usuario.aggregate([
            { $match: { _id: ObjectId('608ecabd96fd742de4f1431d')} },
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


router.post('/add-categoria-produtos', (req, res) => {
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

router.post('/ajax-get-categoria-produtos', (req, res) => {
    CategoriaProduto.findById({_id: req.body.idCategoriaProduto}).lean().then(categoria => {
        res.json(categoria)
    })
})


module.exports = router;

