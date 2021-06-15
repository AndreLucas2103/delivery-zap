const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
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

router.get('/pedidos', async (req, res) => {
    try {

        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) }) 
        
        let {conteudo, dataInicio, dataFim} = req.query
        let userTimeZone = req.user.timeZone.substr(1, 2)
        // verifico se existe algum valor antes de transformar em um object e depois mapear, retonar apenas o valor desejado de cada objeto dentro de um array, caso não tenha eu passo {} na pesquisa
        req.query.pagamentoTipo ? find_pagamentoTipo = {'pagamento.tipo': JSON.parse(req.query.pagamentoTipo).map(a => a.value)} : find_pagamentoTipo = {}
        req.query.pagamentoForma ? find_pagamentoForma = {'pagamento.forma': JSON.parse(req.query.pagamentoForma).map(a => a.value)} : find_pagamentoForma = {}
        req.query.entregador ? find_entregador = {'infoEntrega.idEntregador' : JSON.parse(req.query.entregador).map(a => a.idEntregador)} : find_entregador = {}
        req.query.tipoEntrega ? find_tipoEntrega = {'tipoEntrega': JSON.parse(req.query.tipoEntrega).map(a => a.value)} : find_tipoEntrega = {}

        // faço a verificacao acima 
        req.query.situacao ? find_situacao = JSON.parse(req.query.situacao).map(a => 
            // incluo ifs no mapeamento para me retornar valores desejados, ex: {cacelado: true}
            a.value == "Cancelado" ? {'cancelado': true} : 
            a.value == "Finalizado" ? {'finalizado': true} :  
            a.value == "Aguardando" ? {$and: [ // passo que o aguardando deve conter cancelado e finalizado como false
                {'finalizado': false},
                {'cancelado': false}
            ]} : {}
        ) : find_situacao = [{}] // caso não tenha eu passo uma array de object vazio pois na consulta eu utilizo o $OR

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'infoEntrega.nomeCliente': { '$regex': conteudo, '$options': "i" } }, { 'infoEntrega.telefone': { '$regex': conteudo, '$options': "i" } }]}
        
        dataInicio ? find_dataInicio = moment(dataInicio).add(userTimeZone, 'H').format(): find_dataInicio = moment().add(userTimeZone, 'H').subtract(7, 'd').format()
        dataFim ? find_dataFim = moment(dataFim).add(userTimeZone, 'H').format() : find_dataFim = moment().add(userTimeZone, 'H').format()
        
        let pedidos = await Pedido.find({
            $and: [
                find_conteudo, find_pagamentoTipo, find_pagamentoForma, find_entregador, find_tipoEntrega,
                {$or: find_situacao},
                {'dataCriacao': {$gte: find_dataInicio, $lte: find_dataFim}},
                {'idEstabelecimento': userEstabelecimentos}
            ]
        }).lean().populate('idEstabelecimento')
        let entregadores = await Entregador.find({'estabelecimentos.idEstabelecimento': userEstabelecimentos}).populate('estabelecimentos.idEstabelecimento').lean()

        
        res.render('usuarios/pedido/pedidos', {
            pedidos: pedidos,
            entregadores: entregadores,


            conteudo: req.query.conteudo,
            dataInicio: moment(find_dataInicio).subtract(userTimeZone, 'h').format('YYYY-MM-DDTHH:mm'),
            dataFim: moment(find_dataFim).subtract(userTimeZone, 'h').format('YYYY-MM-DDTHH:mm'),
            pagamentoTipo: req.query.pagamentoTipo,
            pagamentoForma: req.query.pagamentoForma,
            entregador: req.query.entregador,
            tipoEntrega: req.query.tipoEntrega,
            situacao: req.query.situacao
        })

    } catch (err) {
        console.log(err)
    }
})


module.exports = router