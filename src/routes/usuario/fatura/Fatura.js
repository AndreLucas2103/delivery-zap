const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")
const moment = require('moment')


const { v4: uuidv4 } = require('uuid');
const MercadoPago = require('mercadopago');

require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")
require("../../../models/Plano")
const Plano = mongoose.model("planos")
require("../../../models/RotinaSistema")
const RotinaSistema = mongoose.model("rotinasSistemas")

const registerLog = require('../../../components/log')


router.get('/faturas', async (req, res) => { // Entrar no "perfil" do estabelecimento
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) 

        let {limit, paginate} = req.query

        limit ? find_limit = Number(limit) : find_limit = 20
        paginate ? find_paginate = Number(paginate) : find_paginate = 1
        let skip = find_limit * (find_paginate-1)

        let faturas = await Estabelecimento.aggregate([
            {$match: {'_id': { $in:  userEstabelecimentos}} },
            { $unwind: '$locacao.faturas' },
            { "$project": {
                "_id": 1,
                "nome": 1,
                "locacao": 1,
            }},
            {
                $lookup:
                    {
                        from: "planos",
                        localField: "locacao.idPlano",
                        foreignField: "_id",
                        as: "locacao.idPlano"
                    },
            },
            {
                $lookup:
                    {
                        from: "planos",
                        localField: "locacao.idPlano",
                        foreignField: "_id",
                        as: "locacao.idPlano"
                    },
            },
            {'$skip': skip},
            {'$limit': find_limit},
        ])

        let totalPage = await Estabelecimento.aggregate([
            {$match: {'_id': { $in:  userEstabelecimentos}} },
            { $unwind: '$locacao.faturas' },
            { "$project": {
                "_id": 1,
                "nome": 1,
                "locacao": 1,
            }},
            {
                $lookup:
                    {
                        from: "planos",
                        localField: "locacao.idPlano",
                        foreignField: "_id",
                        as: "locacao.idPlano"
                    },
            },
            {
                $lookup:
                    {
                        from: "planos",
                        localField: "locacao.idPlano",
                        foreignField: "_id",
                        as: "locacao.idPlano"
                    },
            },
        ])

        res.render('usuarios/fatura/faturas', {
            faturas: faturas,

            pagination: {
                // api handlebars paginate
                page: find_paginate,
                pageCount: Math.ceil(totalPage.length/find_limit),

                totalPage: totalPage.length,
                limitPage: find_limit,
                startPage: faturas.length == 0 ? 0 : skip+1,
                endPage: skip + faturas.length
            },
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/checkout', async (req, res) => {
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) 

        let fatura = await Estabelecimento.aggregate([
            {'$match': {'_id': { $in:  userEstabelecimentos}} },
            { '$unwind': '$locacao.faturas' },
            {'$match': {'locacao.faturas._id': ObjectId(req.body.idFatura) }}
        ])

        let dados_fatura = fatura[0].locacao.faturas

        if(!dados_fatura)
            return res.redirect('back')

        let dados = {
            items:  [
                {
                    id: dados_fatura._id,
                    title: dados_fatura.descricao,
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: parseFloat(dados_fatura.valor)
                },
            ],
            external_reference: dados_fatura.idTransacaoOperadora,

            "payment_methods": {
                "excluded_payment_types": [
                    {"id": "ticket"},
                    {"id": "digital_wallet"},
                    {"id": "digital_currency"},
                ],
                "installmen'ts": 1
            }
        }

        MercadoPago.configure({
            sandbox: false,
            access_token: process.env.MERCADO_PAGO_ACESS_TOKEN
        });

        var pagameto = await MercadoPago.preferences.create(dados) // crio os dados para pagamento e coloco dentro da variavel
        return res.redirect(pagameto.body.init_point)
        
    } catch (err) {
        console.log(err)
    }
})


router.post('/IPN-fatura-mercado-pago', async (req,res) => {
    try {
        let id = req.query.id
        let topic = req.query.topic

        console.log('Entrou aqui')

        MercadoPago.configure({
            access_token: process.env.MERCADO_PAGO_ACESS_TOKEN
        });

        setTimeout(() => {
            let fitro = {
                "order.id": id
            }

            MercadoPago.payment.search({ // realizo a consulta na base de dados do mercado pago
                qs: fitro
            }).then(async dados => {

                let pagamento = dados.body.results.pop(); // passo somente um valor para a variavel
                
                console.log(dados)
                console.log('- - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - ')
                console.log(dados.body.results)
                console.log('- - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - ')
                console.log(pagamento)
                console.log('- - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - - - - - - - - - - - - - - - - -  - -  - - - - - - ')
                
                registerLog.registerLog({text: 'IPN Mercado Pago Fatura', code: '200', description: `
                    dados da IPN: {
                        ${dados}
                    }
                `})

                let queryFindPlano = pagamento.external_reference.split("#@#")

                let estabelecimentoFind = await Estabelecimento.aggregate([
                    {'$match': {'_id': ObjectId(queryFindPlano[0])}},
                    { $unwind: '$locacao.faturas' },
                    {'$match': {'locacao.faturas.idTransacaoOperadora': pagamento.external_reference}}
                ])
                let estabelecimento = estabelecimentoFind[0]

                if(pagamento.status == "approved"){
                    if(estabelecimento.locacao.faturas.rotina.validado === true) 
                        return registerLog.registerLog({text: 'Rotina IPN Mercado Pago', code: '403', description: 'Alguem tentou realizar uma requisição utilizando paramentros confiáveis da external reference'})

                    let plano = await Plano.findById(estabelecimento.locacao.idPlano)
                    let dataVencimento = moment(estabelecimento.locacao.dataLiberado).diff(moment(), 'days') <= 0 ? moment().add(plano.mesesPeriodicidade, 'months') : moment(estabelecimento.locacao.dataLiberado).add(plano.mesesPeriodicidade, 'months') 
                    
                    Estabelecimento.updateOne(
                        {'_id': estabelecimento._id, 'locacao.faturas.idTransacaoOperadora': pagamento.external_reference},
                        {   
                            '$set': {
                                'locacao.faturas.$.situacao': "paid",
                                'locacao.faturas.$.pago': true,
                                'locacao.faturas.$.rotina.validado': true,
                                'locacao.faturas.$.dataPagamento': pagamento.date_approved,
                                'locacao.dataLiberado': dataVencimento,
                                'locacao.liberado': true
                            },
                            '$push': {
                                'locacao.faturas.$.logs': {'descricao': 'Aprovado pela rotina do sistema'}
                            }
                        }
                    ).then(async () => {
                        try {
                            registerLog.registerLog({text: 'Pagamento de fatura IPN Mercado Pago', code: '200', description: `Estabelecimento ${estabelecimento._id} realizou o pagamento da fatura ${pagamento.external_reference}`})
                            console.log('Pedido aprovado')
                            return await new RotinaSistema ({
                                dataExecutar: moment(dataVencimento).subtract(15, 'days'),
                                tipo: 'cobranca',
                                typeCobranca: {
                                    idEstabelecimento: estabelecimento._id,
                                    idPlano: plano._id,
                                    vencimento: dataVencimento
                                }
                            }).save()
                        } catch (err) {
                            console.log(err)
                        }
                    }).catch(err => {
                        console.log(err)
                    })

                }else if(pagamento.status == "charged_back" || pagamento.status == "rejected" || pagamento.status == "cancelled" || pagamento.status == "refunded"){
                    
                    Estabelecimento.updateOne(
                        {'_id': estabelecimento._id, 'locacao.faturas.idTransacaoOperadora': pagamento.external_reference},
                        {   
                            '$set': {
                                'locacao.faturas.$.situacao': "waiting",
                                'locacao.faturas.$.rotina.validado': false,
                                'locacao.faturas.$.cancelado': true,
                                'locacao.faturas.$.pago': false,
                            },
                            '$push': {
                                'locacao.faturas.$.logs': {'descricao': 'Cancelado pola rotina do sistema'}
                            }
                        }
                    ).then(() => {
                        registerLog.registerLog({text: 'Pagamento de fatura IPN Mercado Pago', code: '200', description: `Estabelecimento ${estabelecimento._id} teve fatura cancelada, fatura: ${pagamento.external_reference}`})
                        console.log('Pedido cancelado')
                    }).catch(err => {
                        console.log(err)
                    })

                }else if(pagamento.status == "pending" || pagamento.status == "authorized" || pagamento.status == "in_process" || pagamento.status == "in_mediation"){
                    
                    Estabelecimento.updateOne(
                        {'_id': estabelecimento._id, 'locacao.faturas.idTransacaoOperadora': pagamento.external_reference},
                        {   
                            '$set': {
                                'locacao.faturas.$.situacao': "waiting",
                                'locacao.faturas.$.pago': false,
                                'locacao.faturas.$.rotina.validado': false,
                                'locacao.faturas.$.dataPagamento': null,
                            },
                            '$push': {
                                'locacao.faturas.$.logs': {'descricao': 'Aguardando pola rotina do sistema'}
                            }
                        }
                    ).then(() => {
                        registerLog.registerLog({text: 'Pagamento de fatura IPN Mercado Pago', code: '200', description: `Estabelecimento ${estabelecimento._id} está com fatura aguardando, fatura: ${pagamento.external_reference}`})
                        console.log('Pedido aguardando')
                    }).catch(err => {
                        console.log(err)
                    })

                }else{
                    registerLog.registerLog({text: 'Pagamento de fatura IPN Mercado Pago', code: '500', description: `Estabelecimento ${estabelecimento._id} está com erro na fatura, verificar motivo`})
                    console.log('OCorreu um erro eu acho né')
                }

            }).catch(err => {
                console.log(err)
            })
        }, 20000)

        res.send('OK')
    } catch (error) {
        console.log(error)
    }
})

router.post('/teste', async (req, res) => {
    try {
        MercadoPago.configure({
            access_token: process.env.MERCADO_PAGO_ACESS_TOKEN
        });

        var filters = {
            external_reference: req.body.val
        };

        MercadoPago.payment.search({ // realizo a consulta na base de dados do mercado pago
            qs: filters
        }).then(async dados => {
            let pagamento = dados.body.results.pop(); // passo somente um valor para a variavel

            let queryFindPlano = pagamento.external_reference.split("#@#")

            let estabelecimentoFind = await Estabelecimento.aggregate([
                {'$match': {'_id': ObjectId(queryFindPlano[0])}},
                { $unwind: '$locacao.faturas' },
                {'$match': {'locacao.faturas.idTransacaoOperadora': pagamento.external_reference}}
            ])
            let estabelecimento = estabelecimentoFind[0]

            if(estabelecimento.locacao.faturas.rotina.validado === true) 
                return registerLog.registerLog({text: 'Rotina IPN Mercado Pago', code: '403', description: 'Alguem tentou realizar uma requisição utilizando paramentros confiáveis da external reference'})

            if(pagamento.status == "approved"){

                let plano = await Plano.findById(estabelecimento.locacao.idPlano)
                let dataVencimento = moment(estabelecimento.locacao.dataLiberado).diff(moment(), 'days') <= 0 ? moment().add(plano.mesesPeriodicidade, 'months') : moment(estabelecimento.locacao.dataLiberado).add(plano.mesesPeriodicidade, 'months') 
                
                Estabelecimento.updateOne(
                    {'_id': estabelecimento._id, 'locacao.faturas.idTransacaoOperadora': pagamento.external_reference},
                    {   
                        '$set': {
                            'locacao.faturas.$.situacao': "paid",
                            'locacao.faturas.$.pago': true,
                            'locacao.faturas.$.rotina.validado': true,
                            'locacao.faturas.$.dataPagamento': pagamento.date_approved,
                            'locacao.dataLiberado': dataVencimento,
                            'locacao.liberado': true
                        },
                        '$push': {
                            'locacao.faturas.$.logs': {'descricao': 'Aprovado pela rotina do sistema'}
                        }
                    }
                ).then(async () => {
                    try {
                        return await new RotinaSistema ({
                            dataExecutar: moment(dataVencimento).subtract(15, 'days'),
                            tipo: 'cobranca',
                            typeCobranca: {
                                idEstabelecimento: estabelecimento._id,
                                idPlano: plano._id
                            }
                        }).save()
                    } catch (err) {
                        console.log(err)
                    }
                }).catch(err => {
                    console.log(err)
                })

            }else if(pagamento.status == "charged_back" || pagamento.status == "rejected" || pagamento.status == "cancelled" || pagamento.status == "refunded"){
                
                Estabelecimento.updateOne(
                    {'_id': estabelecimento._id, 'locacao.faturas.idTransacaoOperadora': pagamento.external_reference},
                    {   
                        '$set': {
                            'locacao.faturas.$.situacao': "waiting",
                            'locacao.faturas.$.rotina.validado': false,
                            'locacao.faturas.$.cancelado': true,
                        },
                        '$push': {
                            'locacao.faturas.$.logs': {'descricao': 'Cancelado pola rotina do sistema'}
                        }
                    }
                ).then(() => {

                }).catch(err => {
                    console.log(err)
                })

            }else if(pagamento.status == "pending" || pagamento.status == "authorized" || pagamento.status == "in_process" || pagamento.status == "in_mediation"){
                
                Estabelecimento.updateOne(
                    {'_id': estabelecimento._id, 'locacao.faturas.idTransacaoOperadora': pagamento.external_reference},
                    {   
                        '$set': {
                            'locacao.faturas.$.situacao': "waiting",
                            'locacao.faturas.$.pago': false,
                            'locacao.faturas.$.rotina.validado': false,
                            'locacao.faturas.$.dataPagamento': null,
                        },
                        '$push': {
                            'locacao.faturas.$.logs': {'descricao': 'Aguardando pola rotina do sistema'}
                        }
                    }
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })

            }else{
                console.log('OCorreu um erro eu acho né')
            }

        }).catch(err => {
            console.log(err)
        })

    } catch (err) {
        console.log(err)    
    }
})


module.exports = router;
