const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")
const moment = require('moment')
const { v4: uuidv4 } = require('uuid');


require("../../../models/admin/Revendedor")
const Revendedor = mongoose.model("revendedores")
require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")
require("../../../models/Plano")
const Plano = mongoose.model("planos")


router.get('/estabelecimento', async (req, res) => {
    try {
      
        let revendedores = await Revendedor.find(query).lean()
        let estabelecimento = await Estabelecimento.findById({'_id': req.query.idEstabelecimento}).populate('idUsuarioMaster').lean()
        let usuarios = await Usuario.find({"estabelecimentosVinculados.idEstabelecimento" : req.query.idEstabelecimento }).populate('estabelecimentosVinculados.idEstabelecimento').lean()


        res.render('admin/estabelecimento/estabelecimento', {
            revendedores: revendedores,
            estabelecimento: estabelecimento,
            usuarios: usuarios
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-revendedor', (req, res) => {


    Estabelecimento.updateOne(    
        {'_id': req.body.idEstabelecimento},      
        {
            
            '$set': {
                
                'idRevendedor.identificacao': req.body.addrevendedor

            }
        }
        
    ).then(() => {
        req.flash('success_msg', 'Revendedor adicionado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})



router.get('/estabelecimentos', async (req, res) => {
    try {
        let {conteudo, limit, paginate} = req.query

        limit ? find_limit = Number(limit) : find_limit = 20
        paginate ? find_paginate = Number(paginate) : find_paginate = 1
        let skip = find_limit * (find_paginate-1)

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'nome': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.cep': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.uf': { '$regex': conteudo.trim(), '$options': "i" } }, { 'endereco.localidade': { '$regex': conteudo.trim(), '$options': "i" } }]}
        query = {
            $and: [find_conteudo]
        }

        let estabelecimentos = await Estabelecimento.find(query).skip(skip).limit(find_limit).populate('idUsuarioMaster').lean()
        let totalPage = await Estabelecimento.countDocuments(query)

        res.render('admin/estabelecimento/estabelecimentos', {
            estabelecimentos: estabelecimentos,
            pagination: {
                page: find_paginate,
                pageCount: Math.ceil(totalPage/find_limit),

                totalPage: totalPage,
                limitPage: find_limit,
                startPage: estabelecimentos.length == 0 ? 0 : skip+1,
                endPage: skip + estabelecimentos.length
            }
        })
        
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-plano-estabelecimento', (req, res) => {
    let status = req.body.locacaoLiberado
    if(status == "true"){

    Estabelecimento.updateOne(    
        {'_id': req.body.idEstabelecimento},      
        {
            
            '$set': {
                
                'locacao.liberado': req.body.locacaoLiberado,
                'locacao.dataLiberado': req.body.locacaoLiberadoAte,
                'locacao.diaVencimento': req.body.locacaoDiaVencimento,
                'locacao.valor': req.body.valor,
                'statusAtivo': true
            }
        }
        
    ).then(() => {
        req.flash('success_msg', 'Estabelecimento editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
}else{

    Estabelecimento.updateOne(          
        {'_id': req.body.idEstabelecimento},      
        {
            
            '$set': {
                
                'locacao.liberado': req.body.locacaoLiberado,
                'locacao.dataLiberado': req.body.locacaoLiberadoAte,
                'locacao.diaVencimento': req.body.locacaoDiaVencimento,
                'locacao.valor': req.body.valor,
                'statusAtivo': false
            }
        }
        
    ).then(() => {
        req.flash('success_msg', 'Estabelecimento editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })

}
})

router.post('/add-plano-fatura', async (req, res) => {
    try {
        let estabelecimento = await Estabelecimento.findById(req.body.idEstabelecimento)
        let plano = await Plano.findById(estabelecimento.locacao.idPlano)

        Estabelecimento.updateOne(
            {'_id': req.body.idEstabelecimento},
            {
                "$push": {
                    'locacao.faturas': {
                        $each: [
                            {
                                'idPlano': estabelecimento.locacao.idPlano,
                                'descricao':  req.body.descricao ? req.body.descricao : `Fatura | Plano: ${plano.nome} | ${moment(req.body.vencimento).format('MM')}/${moment(req.body.vencimento).format('YYYY')}`,
                                'valor': req.body.valor,
                                'vencimento': req.body.vencimento,
                                'situacao': 'waiting',
                                'pago': false,
                                'cancelado': false,
                                "rotina": {
                                    "validado": false
                                },
                                'idTransacaoOperadora': `${req.body.idEstabelecimento}#@#${uuidv4() + uuidv4()}`,
                                'logs': [{
                                    descricao: `Gerada manualmente por ${req.user.primeiroNome}`
                                }]
                            }
                        ],
                        $position: 0,
                    }
                },
                "$set":  {
                    'freeSystem.habilitado': false
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Fatura adicionada')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    } catch (err) {
        console.log(err)
    }
})

router.get('/usuarioadm', async (req, res) => {
    try {
      
        let estabelecimentos = await Estabelecimento.find({'idUsuarioMaster': req.query.idUsuarioMaster}).lean()
        let usuario = await Usuario.findById({"_id" : req.query.idUsuarioMaster }).lean()

        res.render('admin/usuarioadm/usuarioadm', {
            estabelecimentos: estabelecimentos,
            usuario: usuario
        })
    } catch (err) {
        console.log(err)
    }
})


router.get('/usuariosadm', async (req, res) => {
    try {
        let {conteudo, limit, paginate} = req.query

        limit ? find_limit = Number(limit) : find_limit = 20
        paginate ? find_paginate = Number(paginate) : find_paginate = 1
        let skip = find_limit * (find_paginate-1)

        conteudo == "" || !conteudo ? find_conteudo = {} : find_conteudo = {$or: [{ 'nomeCompleto': { '$regex': conteudo.trim(), '$options': "i" } }, { 'email': { '$regex': conteudo.trim(), '$options': "i" } }]}
        query = {
            $and:  [{usuarioMaster : true} , find_conteudo]
        }

        let estabelecimentos = await Usuario.find(query).skip(skip).limit(find_limit).populate('idUsuarioMaster').lean()
        let totalPage = await Usuario.find({usuarioMaster : true}).countDocuments(query)


        res.render('admin/usuarioadm/usuariosadm', {
            estabelecimentos: estabelecimentos,
            pagination: {
                page: find_paginate,
                pageCount: Math.ceil(totalPage/find_limit),

                totalPage: totalPage,
                limitPage: find_limit,
                startPage: estabelecimentos.length == 0 ? 0 : skip+1,
                endPage: skip + estabelecimentos.length
            }
        })
        
    } catch (err) {
        console.log(err)
    }
})


module.exports = router