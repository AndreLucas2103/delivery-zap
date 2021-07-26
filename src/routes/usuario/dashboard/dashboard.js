const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { eAdmin } = require("../../../helpers/eAdmin")
const moment = require('moment')

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
require("../../../models/Pedido")
const Pedido = mongoose.model("pedidos")
require("../../../models/Entregador")
const Entregador = mongoose.model("entregadores")

router.get('/', async (req, res) => {
    try {

        let pedidos_aguardando = await Pedido.countDocuments({$and: [
            {'dataCriacao': { '$gte': new Date(moment().subtract(7, 'days')), '$lte': new Date(moment())}},
            {'situacao': 'waiting'}
        ]})

        let pedidos_andamento = await Pedido.countDocuments({$and: [
            {'dataCriacao': { '$gte': new Date(moment().subtract(7, 'days')), '$lte': new Date(moment())}},
            {'situacao': 'production'}
        ]})

        let pedidos_finalizado = await Pedido.countDocuments({$and: [
            {'dataCriacao': { '$gte': new Date(moment().subtract(7, 'days')), '$lte': new Date(moment())}},
            {'situacao': 'finished'}
        ]})

        let last_5_pedidos = await Pedido.find({
            $and: [
                {'statusAtivo': true}
            ]
        }).sort({'dataCriacao': -1}).limit(5).lean().populate('idEstabelecimento')

        let adicionais_mais_pedidos = await Pedido.aggregate([
            {'$match': {'dataCriacao': { '$gte': new Date(moment().subtract(7, 'days')), '$lte': new Date(moment())}} },
            {'$unwind': '$produtos'},
            {'$unwind': '$produtos.adicionais'},
            {
                $group:{
                    _id: '$produtos.adicionais.nome', 
                    count: { $sum: 1 }
                },
            }, 
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ])

        let produtos_mais_vendidos = await Pedido.aggregate([
            {'$match': {'dataCriacao': { '$gte': new Date(moment().subtract(7, 'days')), '$lte': new Date(moment())}} },
            {'$unwind': '$produtos'},
            {
                $group:{
                    _id: '$produtos.idProduto', 
                    count: { $sum: 1 }
                },
            }, 
            {
                $lookup:
                    {
                        from: "produtos",
                        localField: "_id",
                        foreignField: "_id",
                        as: "_id"
                    },
            },
            {'$unwind': '$_id'},
            {'$sort': {'count': -1}},
            {'$limit': 5}
        ])
        
        res.render('usuarios/dashboard/dashboard', {
            pedidos_aguardando: pedidos_aguardando,
            pedidos_andamento: pedidos_andamento,
            pedidos_finalizado: pedidos_finalizado,
            pedidos: last_5_pedidos,
            adicionais_mais_pedidos: adicionais_mais_pedidos,
            produtos_mais_vendidos: produtos_mais_vendidos
        })
    } catch (err) {
        console.log(err)
    }
})


router.post('/chart-pedidos-cancelados-finalizados', async (req, res) => {
    try {
        let findData =  {'dataCriacao': { '$gte': new Date(moment().subtract(30, 'days')), '$lte': new Date(moment())}}

        let pedidos_cancelado = await Pedido.countDocuments({$and: [
            findData,
            {'situacao': 'canceled'}
        ]})
        let pedidos_finalizado = await Pedido.countDocuments({$and: [
            findData,
            {'situacao': 'finished'}
        ]})

        let result = {
            'canceled': pedidos_cancelado,
            'finished': pedidos_finalizado
        }

        res.status(200).json(result)

    } catch (err) {
        console.log(err)
    }
})


router.post('/chart-pedidos-retiradosEstabelecimento-entregas', async (req, res) => {
    try {
        let findData =  {'dataCriacao': { '$gte': new Date(moment().subtract(30, 'days')), '$lte': new Date(moment())}}

        let pedidos_entregas = await Pedido.countDocuments({$and: [
            findData,
            {'tipoEntrega': 'entrega'}
        ]})
        let pedidos_retirar = await Pedido.countDocuments({$and: [
            findData,
            {'tipoEntrega': 'retirarLocal'}
        ]})

        let result = {
            'entregas': pedidos_entregas,
            'retirar': pedidos_retirar
        }
        

        res.status(200).json(result)
        
    } catch (err) {
        console.log(err)
    }
})

router.post('/chart-pedidos-meio-pagamento-pagarRecebimento', async (req, res) => {
    try {
        let findData =  {'dataCriacao': { '$gte': new Date(moment().subtract(30, 'days')), '$lte': new Date(moment())}}

        let meios = await Pedido.aggregate([
            {'$match': {'$and': [{'pagamento.tipo': 'pagarRecebimento'}, findData]}},
            {
                $group:{
                    _id: '$pagamento.forma', 
                    count: { $sum: 1 }
                },
            }, 
            {'$sort': {'_id': 1}}
        ])

        res.status(200).json(meios)
    } catch (err) {
        console.log(err)
    }
})

router.post('/chart-pedidos-pedidos-ultimos-28-dias', async (req, res) => {
    try {
        let findData =  {'dataCriacao': { '$gte': new Date(moment().subtract(28, 'days')), '$lte': new Date(moment())}}

        let pedidos = await Pedido.aggregate([
            {'$match': {'$and': [findData]}},
            {
                $group:{
                    _id : { $dateToString: { format: "%d/%m", date: "$dataCriacao" } },
                    count: { $sum: 1 }
                },
            }, 
            {'$sort': {'_id': 1}},
        ])

        res.status(200).json(pedidos)
    } catch (err) {
        console.log(err)
    }
})



module.exports = router