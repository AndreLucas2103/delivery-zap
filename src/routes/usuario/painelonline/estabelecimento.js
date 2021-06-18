const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")
const { v4: uuidv4 } = require('uuid');
const MercadoPago = require('mercadopago');
    

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
require("../../../models/Pedido")
const Pedido = mongoose.model("pedidos")

router.post('/IPN-mercadoPago-hotPedidos/:publickey', async (req,res) => {
    try {
        let id = req.query.id
        let topic = req.query.topic

        let estabelecimento = await Estabelecimento.findOne({$and: [
            {'integracao.mercadoPago.publickey': req.params.publickey},
            {'testadoAtivo': true},
            {'statusAtivo': true}
        ]})

        if(!estabelecimento){
            return res.send('404') 
        } 

        MercadoPago.configure({
            access_token: estabelecimento.integracao.mercadoPago.acessToken
        });

        setTimeout(() => {
            let fitro = {
                "order.id": id
            }

            MercadoPago.payment.search({ // realizo a consulta na base de dados do mercado pago
                qs: fitro
            }).then(dados => {
                let pagamento = dados.body.results.pop(); // passo somente um valor para a variavel
                if(pagamento != undefined){

                    if(topic == "payment"){
                        if(pagamento.status == "approved"){
                            Pedido.updateOne(
                                {"identificacaoPedido": pagamento.external_reference},
                                {
                                    $set: {
                                        "infoTransacao": {
                                            situacao: pagamento.status,
                                            situacaoDetalhada: pagamento.status_detail,
                                            metodoPagamento: pagamento.payment_method_id,
                                            tipoPagamento: pagamento.payment_type_id,
                                            idTransacaoOperadora: pagamento.id,
                                            dataPagamento: pagamento.date_approved,
                                            pedidoPago: true
                                        }
                                    }
                                }
                            ).then(() => {
                                console.log('*\nPedido recebido e alterado {status:"APROVADO - payment"} \n*')
                            }).catch(err => {
                                console.log(err)
                            })

                        }else if(pagamento.status == "charged_back" || pagamento.status == "rejected" || pagamento.status == "cancelled" || pagamento.status == "refunded"){
                            Pedido.updateOne(
                                {"identificacaoPedido": pagamento.external_reference},
                                {
                                    $set: {
                                        "infoTransacao": {
                                            situacao: pagamento.status,
                                            situacaoDetalhada:pagamento.status_detail,
                                            metodoPagamento: pagamento.payment_method_id,
                                            tipoPagamento: pagamento.payment_type_id,
                                            idTransacaoOperadora: pagamento.id,
                                            dataCancelamento: pagamento.date_last_updated,
                                            pedidoCancelado: true,
                                            pedidoPago: false,
                                        }
                                    }
                                }
                            ).then(() => {
                                console.log('*\nPedido recebido e alterado {status:"CANCELADO/ESTORNADO/REJEITADO - payment"} \n*')
                            }).catch(err => {
                                console.log(err)
                            })
                            
                        }else if(pagamento.status == "pending" || pagamento.status == "authorized" || pagamento.status == "in_process" || pagamento.status == "in_mediation"){
                            Pedido.updateOne(
                                {"identificacaoPedido": pagamento.external_reference},
                                {
                                    $set: {
                                        "infoTransacao": {
                                            situacao: pagamento.status,
                                            situacaoDetalhada: pagamento.status_detail,
                                            metodoPagamento: pagamento.payment_method_id,
                                            tipoPagamento: pagamento.payment_type_id,
                                            idTransacaoOperadora: pagamento.id,
                    
                                            dataCancelamento: null,
                                            pedidoCancelado: false,
                                            dataPagamento: null,
                                            pedidoPago: false
                                        }
                                    }
                                }
                            ).then(() => {
                                console.log('*\nPedido recebido e alterado {status:"AGUARDANDO/AUTORIZADO/EM PROCESSO - payment"} \n*')
                            }).catch(err => {
                                console.log(err)
                            })

                        }else{
                            console.log('OCorreu um erro eu acho né')
                        }

                    }else if(topic == "merchant_order"){
                        if(pagamento.status == "approved"){
                            Pedido.updateOne(
                                {"identificacaoPedido": pagamento.external_reference},
                                {
                                    $set: {
                                        "infoTransacao": {
                                            situacao: pagamento.status,
                                            situacaoDetalhada: pagamento.status_detail,
                                            metodoPagamento: pagamento.payment_method_id,
                                            tipoPagamento: pagamento.payment_type_id,
                                            idTransacaoOperadora: pagamento.id,
                                            dataPagamento: pagamento.date_approved,
                                            pedidoPago: true
                                        }
                                    }
                                }
                            ).then(() => {
                                console.log('*\nPedido recebido e alterado {status:"APROVADO - payment"} \n*')
                            }).catch(err => {
                                console.log(err)
                            })

                        }else if(pagamento.status == "charged_back" || pagamento.status == "rejected" || pagamento.status == "cancelled" || pagamento.status == "refunded"){
                            Pedido.updateOne(
                                {"identificacaoPedido": pagamento.external_reference},
                                {
                                    $set: {
                                        "infoTransacao": {
                                            situacao: pagamento.status,
                                            situacaoDetalhada:pagamento.status_detail,
                                            metodoPagamento: pagamento.payment_method_id,
                                            tipoPagamento: pagamento.payment_type_id,
                                            idTransacaoOperadora: pagamento.id,
                                            dataCancelamento: pagamento.date_last_updated,
                                            pedidoCancelado: true,
                                            pedidoPago: false,
                                        },
                                    }
                                }
                            ).then(() => {
                                console.log('*\nPedido recebido e alterado {status:"CANCELADO/ESTORNADO/REJEITADO - payment"} \n*')
                            }).catch(err => {
                                console.log(err)
                            })
                            
                        }else if(pagamento.status == "pending" || pagamento.status == "authorized" || pagamento.status == "in_process" || pagamento.status == "in_mediation"){
                            Pedido.updateOne(
                                {"identificacaoPedido": pagamento.external_reference},
                                {
                                    $set: {
                                        "infoTransacao": {
                                            situacao: pagamento.status,
                                            situacaoDetalhada: pagamento.status_detail,
                                            metodoPagamento: pagamento.payment_method_id,
                                            tipoPagamento: pagamento.payment_type_id,
                                            idTransacaoOperadora: pagamento.id,
                    
                                            dataCancelamento: null,
                                            pedidoCancelado: false,
                                            dataPagamento: null,
                                            pedidoPago: false
                                        }
                                    }
                                }
                            ).then(() => {
                                console.log('*\nPedido recebido e alterado {status:"AGUARDANDO/AUTORIZADO/EM PROCESSO - payment"} \n*')
                            }).catch(err => {
                                console.log(err)
                            })

                        }else{
                            console.log('OCorreu um erro eu acho né')
                        }

                    }else{
                        console.log('Ocorreu algum problema nisso aqui, favor verificar!')
                    }
                    
                }else{
                    console.log('Pagamento não existe!')
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

router.post('/checkout/finalizar', async (req, res) => {
    try {
        let {uuid4Client, idEstabelecimento, nomeCliente, pagamentoTipoSelecionado, formaPagamento, trocoPara, observacao, rua, bairro, cidade, cep, numero, telefone, entrega, retirarLocal} = req.body
        console.log(req.body)
        let estabelecimento = await Estabelecimento.findById({_id: idEstabelecimento})
        let carrinho = await Carrinho.findOne({$and: [{'uuid4Client': uuid4Client}, {'idEstabelecimento': idEstabelecimento}]})
        
        let tipoEntrega
        retirarLocal == "true" ? tipoEntrega = "retirarEstabelecimento" : entrega == "true" ? tipoEntrega = "entrega" : tipoEntrega = "retirarEstabelecimento"
        retirarLocal == "true" ? taxaEntregaPedido = 0 : taxaEntregaPedido = estabelecimento.configPedidos.taxaEntrega
        
        let identificacaoPedido = Date.now()+"-"+estabelecimento._id+"-"+uuidv4()+uuidv4()

        if(pagamentoTipoSelecionado == "pagarRecebimento"){
            addPedido = {
                identificacaoPedido: identificacaoPedido,
                produtos: carrinho.produtos,
                tipoEntrega: tipoEntrega,
                situacao: 'waiting',
                infoEntrega: {
                    nomeCliente: nomeCliente,
                    endereco: {
                        rua: rua,
                        bairro: bairro,
                        cidade: cidade,
                        cep: cep,
                        numero: numero,
                    },
    
                    telefone: telefone,
                    taxaEntrega: taxaEntregaPedido
                },
    
                pagamento: {
                    tipo: pagamentoTipoSelecionado,
                    forma: formaPagamento,
                    trocoPara: trocoPara
                },
    
                uuid4Client: uuid4Client,
                idEstabelecimento: idEstabelecimento,
                observacao: observacao,

                valorTotal: carrinho.valorTotal,
                dataCriacao: new Date()
            }
        }else if(pagamentoTipoSelecionado == "mercadoPago"){
            addPedido = {
                identificacaoPedido: identificacaoPedido,
                produtos: carrinho.produtos,
                situacao: 'waiting',
                tipoEntrega: tipoEntrega,
                infoEntrega: {
                    nomeCliente: nomeCliente,
                    endereco: {
                        rua: rua,
                        bairro: bairro,
                        cidade: cidade,
                        cep: cep,
                        numero: numero,
                    },
    
                    telefone: telefone,
                    taxaEntrega: taxaEntregaPedido
                },
    
                pagamento: {
                    tipo: pagamentoTipoSelecionado,
                },

                infoTransacao: {
                    operadoraPagamento: pagamentoTipoSelecionado,
                    idPedidoTransacaoOperadora: identificacaoPedido
                },
    
                uuid4Client: uuid4Client,
                idEstabelecimento: idEstabelecimento,
                observacao: observacao,

                valorTotal: carrinho.valorTotal,
                dataCriacao: new Date()
            }
        }

        Pedido(addPedido).save().then(async(pedido) => {
            try {
                
                if(pagamentoTipoSelecionado == "pagarRecebimento"){
                    req.flash('success_msg', 'Pedido Finalizado')
                    return res.redirect('back')
                }else if(pagamentoTipoSelecionado == "mercadoPago"){
                    console.log(pedido)
                    let itensPedidos = ""
                    pedido.produtos.forEach(element => {
                        itensPedidos += `| ${element.nome} (Qtd: ${element.quantidade}) |`
                    })
                    console.log(pedido)
                    let dados = {
                        items:  [
                            {
                                id: pedido.infoTransacao.idPedidoTransacaoOperadora,
                                title: itensPedidos,
                                quantity: 1,
                                currency_id: "BRL",
                                unit_price: parseFloat(pedido.valorTotal)
                            },
                        ],
                        external_reference: pedido.infoTransacao.idPedidoTransacaoOperadora
                    }

                    MercadoPago.configure({
                        sandbox: false,
                        access_token: estabelecimento.integracao.mercadoPago.acessToken
                    });

                    var pagameto = await MercadoPago.preferences.create(dados) // crio os dados para pagamento e coloco dentro da variavel
                    console.log(pagameto)
                    return res.redirect(pagameto.body.init_point)
                }
                
            } catch (err) {
                console.log(err)
            }

        }).catch(err => {
            console.log(err)
        })

    } catch (err) {
        console.log(err)
    }
})

router.get('/:urlPainel', async (req, res)=>{
    try {
        let estabelecimento = await Estabelecimento.findOne({url: req.params.urlPainel}).lean()
        let produtos = await Produto.aggregate([
            {$match: {$and: [{idEstabelecimento: estabelecimento._id}, {statusAtivo: true}]}},
            {
                $group:{
                    _id: '$idCategoriaProduto', 
                    produtos: {$push: {_id:"$_id", nome: '$nome', valor: '$valor', img:'$img.foto.url' }},
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
            horariosFuncionamento: JSON.stringify(estabelecimento.horarioFuncionamento),
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
    Carrinho.findOne({$and: [{idEstabelecimento: ObjectId(req.body.idEstabelecimento)}, {uuid4Client: req.body.uuid4Client}]}).populate('produtos.idProduto').lean().then(carrinho => {
        res.json(carrinho)
    })
})

router.post('/delete-carrinho-painel', async (req, res) => {
    try {
        let carrinho = await Carrinho.aggregate([
            {$match: {'_id':  ObjectId(req.body.idCarrinho)}},
            { $unwind : "$produtos" },
            { $match : {
                "produtos._id": ObjectId(req.body.idCarrinhoProduto)
            }}
        ])
        
        Carrinho.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
            {'_id': req.body.idCarrinho},
            { 
                $pull: {'produtos': {_id: ObjectId(req.body.idCarrinhoProduto)}},
                $inc: {"valorTotal": -carrinho[0].produtos.valorTotal}
            }, 
            
        ).then(() => {
            req.flash('success_msg', 'Produto removido')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        }) 

    } catch (err) {
        console.log(err)
    }
})

router.post('/search-pedido-mercadoPago', async (req, res) => {
    try {
        let estabelecimento = await Estabelecimento.findById({_id: req.post.external_reference.split("-", 2)[1]})

        MercadoPago.configure({
            access_token: estabelecimento.integracao.mercadoPago.acessToken
        });

        var filters = {
            external_reference: req.params.identificacaoPedido
        };
        
        setTimeout(() => {
            MercadoPago.payment.search({ // realizo a consulta na base de dados do mercado pago
                qs: filters
            }).then(dados => {
                let pagamento = dados.body.results.pop(); // passo somente um valor para a variavel

                if(pagamento != undefined){
                    if(pagamento.status == "approved"){
                        Pedido.updateOne(
                            {"identificacaoPedido": pagamento.external_reference},
                            {
                                $set: {
                                    "infoTransacao": {
                                        situacao: pagamento.status,
                                        situacaoDetalhada: pagamento.status_detail,
                                        metodoPagamento: pagamento.payment_method_id,
                                        tipoPagamento: pagamento.payment_type_id,
                                        idTransacaoOperadora: pagamento.id,
                                        dataPagamento: pagamento.date_approved,
                                        pedidoPago: true
                                    }
                                }
                            }
                        ).then(() => {
                            console.log('*\nPedido recebido e alterado {status:"APROVADO - payment"} \n*')
                        }).catch(err => {
                            console.log(err)
                        })

                    }else if(pagamento.status == "charged_back" || pagamento.status == "rejected" || pagamento.status == "cancelled" || pagamento.status == "refunded"){
                        Pedido.updateOne(
                            {"identificacaoPedido": pagamento.external_reference},
                            {
                                $set: {
                                    "infoTransacao": {
                                        situacao: pagamento.status,
                                        situacaoDetalhada:pagamento.status_detail,
                                        metodoPagamento: pagamento.payment_method_id,
                                        tipoPagamento: pagamento.payment_type_id,
                                        idTransacaoOperadora: pagamento.id,
                                        dataCancelamento: pagamento.date_last_updated,
                                        pedidoCancelado: true,
                                        pedidoPago: false,
                                    }
                                }
                            }
                        ).then(() => {
                            console.log('*\nPedido recebido e alterado {status:"CANCELADO/ESTORNADO/REJEITADO - payment"} \n*')
                        }).catch(err => {
                            console.log(err)
                        })
                        
                    }else if(pagamento.status == "pending" || pagamento.status == "authorized" || pagamento.status == "in_process" || pagamento.status == "in_mediation"){
                        Pedido.updateOne(
                            {"identificacaoPedido": pagamento.external_reference},
                            {
                                $set: {
                                    "infoTransacao": {
                                        situacao: pagamento.status,
                                        situacaoDetalhada: pagamento.status_detail,
                                        metodoPagamento: pagamento.payment_method_id,
                                        tipoPagamento: pagamento.payment_type_id,
                                        idTransacaoOperadora: pagamento.id,
                
                                        dataCancelamento: null,
                                        pedidoCancelado: false,
                                        dataPagamento: null,
                                        pedidoPago: false
                                    }
                                }
                            }
                        ).then(() => {
                            console.log('*\nPedido recebido e alterado {status:"AGUARDANDO/AUTORIZADO/EM PROCESSO - payment"} \n*')
                        }).catch(err => {
                            console.log(err)
                        })

                    }else{
                        console.log('OCorreu um erro eu acho né')
                    }

                    res.redirect('back')

                }else{
                    console.log('Pagamento não existe!')
                }

            }).catch(err => {
                console.log(err)
            })
        }, 2000)

        

    } catch (err) {
        console.log(err)    
    }
})


module.exports = router;