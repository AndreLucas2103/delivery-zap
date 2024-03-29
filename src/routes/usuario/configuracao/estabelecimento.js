const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const multer = require('multer')
const multerConfig = require('../../../config/multer')
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")
const moment = require('moment')
const aws = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');


require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")
require("../../../models/Plano")
const Plano = mongoose.model("planos")

const registerLog = require("../../../components/log")


router.post('/add-plano-estabelecimento', async (req, res) => {
    try {
        let plano = await Plano.findById({'_id': req.body.idPlano})

        let estabelecimento = await Estabelecimento.findById({'_id': req.body.idEstabelecimento})

        let diff = moment(estabelecimento.locacao.dataLiberado).diff(moment(), "days")

        let data = diff < 0 ? moment() : estabelecimento.locacao.dataLiberado

        await Estabelecimento.updateMany(
            {"_id": req.user.estabelecimentosVinculados.map(v => v.idEstabelecimento), "freeSystem.habilitado": true},
            {
                "$set": {
                    "freeSystem.habilitado": false,
                    "statusAtivo": false,
                    'locacao.liberado': false,
                }
            }
        )
        Estabelecimento.updateOne(
            {'_id': req.body.idEstabelecimento},
            {'$set': {
                locacao: {
                    idPlano: plano._id,
                    plano: plano.nome,
                    liberado: false,
                    dataLiberado: moment(data),
                    valor: plano.valor,
                    faturas: [{
                        idPlano: plano._id,
                        descricao: `Fatura ${moment(data).format('DD/MM/YYYY')} até ${moment(data).add(plano.mesesPeriodicidade, 'months').format('DD/MM/YYYY')}`,
                        valor: plano.valor,
                        vencimento: moment(data),
                        situacao: 'waiting',
                        pago: false,
                        cancelado: false,
                        "rotina": {
                            "validado": false
                        },
                        'idTransacaoOperadora': `${req.body.idEstabelecimento}#@#${uuidv4() + uuidv4()}`,
                        logs: [{
                            descricao: 'Fatura gerada ao adquirir o plano'
                        }]
                    }]
                },
                "statusAtivo": false
            }}
        ).then(async () => {
            await Usuario.updateOne(
                {'_id': req.user._id},
                {
                    '$set': {
                        'freeSystem.habilitado': false
                    }
                }
            )
            req.flash('success_msg', 'Aquisição realizada')
            res.redirect('back')
        }).catch(err => {
            registerLog.registerLog({text: "Rota ESTALECIMENTO - add-plano-estabelecimento", code: "500", description: err})
        })
    } catch (err) {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - add-plano-estabelecimento", code: "500", description: err})
    }
})

router.get('/estabelecimento/:idEstabelecimento', eAdmin, async (req, res) => { // Entrar no "perfil" do estabelecimento
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            { $match: { _id: ObjectId(req.params.idEstabelecimento) } },
            {
                $lookup:
                {
                    from: "usuarios",
                    localField: "_id",
                    foreignField: "estabelecimentosVinculados.idEstabelecimento",
                    as: "usuarios"
                }
            }
            //{$sort: {cobrancas: ({"score":-1})}}
        ])

        res.render('usuarios/configuracao/estabelecimento', { estabelecimento: estabelecimento[0] })
    } catch (err) {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - /estabelecimento/:idEstabelecimento", code: "500", description: err})
    }
})

router.post('/edit-estabelecimento-configPedido', (req, res) => {
    if(req.body.statusAtivo == "true" && req.body.cepsDisponiveis == ""){
        req.flash('error_msg', 'Insira pelo menos 1 CEP')
        return res.redirect('back')
    }
            
    if(req.body.meioPagamento == ""){
        req.flash('error_msg', 'Insira pelo menos 1 meio de pagamento')
        return res.redirect('back')
        
    }
    let arraymeioPagamento = JSON.parse(req.body.meioPagamento)

    Estabelecimento.updateOne(
        {_id: req.body.idEstabelecimento},
        {$set: {"configPedidos.meioPagamento": [], "configPedidos.controleCEP.cepsDisponiveis": [], 'configPedidos.controleCEP.statusAtivo': req.body.statusAtivo, 'configPedidos.taxaEntrega': req.body.taxaEntrega}}
    ).then(estabelecimento => {
        arraymeioPagamento.forEach(element => {
            Estabelecimento.updateOne( 
                {_id: req.body.idEstabelecimento},
                {
                    $push: {
                        'configPedidos.meioPagamento': { nome : element.value, tipo: element.valor },
                    }
                }
                
            ).catch(err => {
                registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento-configPedido", code: "500", description: err})
            })
        })
        
        if(req.body.cepsDisponiveis != ""){
            let arraycepsDisponiveis = JSON.parse(req.body.cepsDisponiveis) 
            arraycepsDisponiveis.forEach(element => {
                Estabelecimento.updateOne( 
                    {_id: req.body.idEstabelecimento},
                    {
                        $push: {
                            'configPedidos.controleCEP.cepsDisponiveis': { cep : element.value },
                        }
                    }
                ).catch(err => {
                    registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento-configPedido", code: "500", description: err})
                })
            })
        }

        req.flash('success_msg', 'Configuração Pedido editado')
        res.redirect('back')
    }).catch(err => {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento-configPedido", code: "500", description: err})
    })

})

router.post('/add-horario-estabelecimento', async (req, res) => { // adicionar os horarios no estabelecimento
    try {
        let addHorario = {
            dia: req.body.dia,
            inicio: req.body.inicio,
            fim: req.body.fim
        }
        Estabelecimento.updateOne(
            { '_id': req.body.idEstabelecimento },
            {
                $push: {
                    'horarioFuncionamento': addHorario,
                    $sort: { dia: -1 }
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Horário adicionado')
            res.redirect('back')
        }).catch(err => {
            registerLog.registerLog({text: "Rota ESTALECIMENTO - add-horario-estabelecimento", code: "500", description: err})
        })
    } catch (err) {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - add-horario-estabelecimento", code: "500", description: err})
    }
})

router.post('/delete-horarioFuncionamento', async (req, res) => { // deletar os horários no estabelecimento
    try {
        Estabelecimento.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
            { '_id': req.body.idEstabelecimento },
            {
                $pull: {
                    'horarioFuncionamento': { _id: ObjectId(req.body.idHorario) },
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Horário removido')
            res.redirect('back')
        }).catch(err => {
            registerLog.registerLog({text: "Rota ESTALECIMENTO - delete-horarioFuncionamento", code: "500", description: err})
        })
    } catch (err) {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - delete-horarioFuncionamento", code: "500", description: err})
    }
})

router.get('/estabelecimentos', /* eAdmin, */ async (req, res) => { // Listar todos os estabelecimentos
    try {

        let estabelecimentos2 = req.user.estabelecimentosVinculados.map(e => e.idEstabelecimento)

        let estabelecimentos = await Estabelecimento.find({"_id": estabelecimentos2}).populate("locacao.idPlano").lean()

        let planos = await Plano.find({'statusAtivo': true}).lean()

        res.render('usuarios/configuracao/estabelecimentos', { estabelecimentos: estabelecimentos, planos: planos })
    } catch (err) {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - estabelecimentos", code: "500", description: err})
    }
})

router.post('/edit-estabelecimento', async (req, res) => { // Editar o estabelecimento
    try {
        let estabelecimento = await Estabelecimento.findOne({"url": req.body.url})

        if(estabelecimento && estabelecimento._id != req.body.idEstabelecimento){
            req.flash('error_msg', "Já existe um estabelecimento com essa URL")
            return res.redirect('back')
        }

        Estabelecimento.findById({ _id: req.body.idEstabelecimento }).then(estabelecimento => {
            if (estabelecimento) {
                estabelecimento.nome = req.body.nome,
                    estabelecimento.url = req.body.url,
                    estabelecimento.endereco = {
                        logradouro: req.body.logradouro,
                        bairro: req.body.bairro,
                        localidade: req.body.cidade,
                        cep: req.body.cep,
                        numero: req.body.numero,
                        uf: req.body.uf
                    },
                    estabelecimento.cnpj = req.body.cnpj,
                    estabelecimento.telefone = req.body.telefone


                estabelecimento.save().then(() => {
                    req.flash('success_msg', 'Estabelecimento editado')
                    res.redirect('back')
                }).catch(err => {
                    registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento", code: "500", description: err})
                    req.flash('error_msg', 'Ocorreu um erro')
                    res.redirect('back')
                })
            } else {
                registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento", code: "500", description: "Tentiva de editar um estabelecimento mas não passou nennhum ID"})
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            }
        
        }).catch(err => {
            registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento", code: "500", description: err})
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        })
        
    } catch (err) {
        registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-estabelecimento", code: "500", description: err})
        req.flash('error_msg', 'Ocorreu um erro')
        res.redirect('back')
    }
})

router.post('/edit-estabelecimento-integracao-mercado-pago', (req, res) => {
    try {
        Estabelecimento.findById({ _id: req.body.idEstabelecimento }).then(estabelecimento => {
            if (estabelecimento) {
                req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false
                estabelecimento.integracao.mercadoPago.testadoAtivo == true ? integracaoMercadoPagoAtiva = true : integracaoMercadoPagoAtiva = false

                estabelecimento.integracao.mercadoPago = {
                    statusAtivo: statusAtivo,
                    testadoAtivo: integracaoMercadoPagoAtiva,
                    publickey: req.body.publickey,
                    acessToken: req.body.acessToken
                },

                    estabelecimento.save().then(() => {
                        req.flash('success_msg', 'Estabelecimento editado')
                        res.redirect('back')
                    }).catch(err => {
                        console.log(err)

                        req.flash('error_msg', 'Ocorreu um erro')
                        res.redirect('back')
                    })
            } else {
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            }
        }).catch(err => {
            console.log(err)
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        })
    } catch (err) {
        console.log(err)

        req.flash('error_msg', 'Ocorreu um erro')
        res.redirect('back')
    }
})

router.post('/add-estabelecimento', async (req, res) => { // adicionar estabelecimento
    let user = req.user
    if (user) {

        let estabelecimento = await Estabelecimento.findOne({"url": req.body.url})
        if(estabelecimento){
            req.flash('error_msg', "Já existe um estabelecimento com essa URL")
            return res.redirect('back')
        }

        if (user.usuarioMaster == true) {
            if(user.freeSystem.habilitado == true) {
                addEstabelecimento = {
                    nome: req.body.nome,
                    nomePainel: req.body.nome,
                    url: req.body.url,
                    endereco: {
                        logradouro: req.body.logradouro,
                        bairro: req.body.bairro,
                        localidade: req.body.cidade,
                        cep: req.body.cep,
                        numero: req.body.numero,
                        uf: req.body.uf
                    },
                    cnpj: req.body.cnpj,
                    telefone: req.body.telefone,
                    idUsuarioMaster: user._id,
                    
                    freeSystem: {
                        habilitado: true,
                        dataFim: user.freeSystem.dataFim
                    },
                    locacao: {
                        dataLiberado: user.freeSystem.dataFim,
                        liberado: true
                    }
                }
                new Estabelecimento(addEstabelecimento).save().then((estabelecimento) => {
                    editUsuario = {
                        idEstabelecimento: estabelecimento._id,
                        cnpj: estabelecimento.cnpj,
                        nome: estabelecimento.nome,
                        url: estabelecimento.url
                    }
                    Usuario.updateOne(
                        { '_id': user._id },
                        {
                            $push: { "estabelecimentosVinculados": editUsuario }
                        }
                    ).then(e => {
                        req.flash('success_msg', 'Estabelecimento adicionado')
                        res.redirect('back')
                    }).catch(err => {
                        console.log(err)
                    })
    
                }).catch(err => {
                    req.flash('error_msg', 'Ocorreu um erro')
                    res.redirect('back')
                })

            }else{
                Plano.findById({'_id': req.body.idPlano}).then(plano => {
                    addEstabelecimento = {
                        nome: req.body.nome,
                        nomePainel: req.body.nome,
                        url: req.body.url,
                        endereco: {
                            logradouro: req.body.logradouro,
                            bairro: req.body.bairro,
                            localidade: req.body.cidade,
                            cep: req.body.cep,
                            numero: req.body.numero,
                            uf: req.body.uf
                        },
                        cnpj: req.body.cnpj,
                        telefone: req.body.telefone,
                        idUsuarioMaster: user._id,
        
                        locacao: {
                            idPlano: plano._id,
                            plano: plano.nome,
                            liberado: true,
                            dataLiberado:  moment(),
                            diaVencimento: moment().date(),
                            valor: plano.valor,
    
                            faturas: [{
                                idPlano: plano._id,
                                descricao: `Fatura ${moment().format("DD/MM/YYYY")} a ${moment().add({months:plano.mesesPeriodicidade}).format("DD/MM/YYYY")}`,
                                valor: plano.valor,
                                vencimento: moment(),
                                situacao: "waiting",
                                logs: [{
                                    descricao: 'Mensalidade gerada na criação do estabelecimento'
                                }]
                            }]
                        } 
                    }
                    new Estabelecimento(addEstabelecimento).save().then((estabelecimento) => {
                        editUsuario = {
                            idEstabelecimento: estabelecimento._id,
                            cnpj: estabelecimento.cnpj,
                            nome: estabelecimento.nome,
                            url: estabelecimento.url
                        }
                        Usuario.updateOne(
                            { '_id': user._id },
                            {
                                $push: { "estabelecimentosVinculados": editUsuario }
                            }
                        ).then(e => {
                            req.flash('success_msg', 'Estabelecimento adicionado')
                            res.redirect('back')
                        }).catch(err => {
                            console.log(err)
                        })
        
                    }).catch(err => {
                        req.flash('error_msg', 'Ocorreu um erro')
                        res.redirect('back')
                    })
                })
            }
        } else {
            req.flash('warning_msg', 'Somente usuário MASTER pode adicionar um estabelecimento')
            res.redirect('back')
        }
    } else {
        req.flash('error_msg', 'Usuário não está logado')
        res.redirect('back')
    }
})

router.post('/statusAberto', (req, res) => { // adicionar estilo do estabelecimento
    let statusAberto
    req.body.statusAberto == "true" ? statusAberto = true : statusAberto = false
        Estabelecimento.updateOne(  
            { _id: req.body.idEstabelecimento },
            {
                $set: {
                    'statusAberto': statusAberto
                }
            }
           ).then(() => {
                req.flash('success_msg', 'Status alterado')
                res.redirect('back')
            }).catch(err => {
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            })
       
})


router.get('/painel/:idPainel', eAdmin, async (req, res) => {
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            { $match: { _id: ObjectId(req.params.idPainel) } },
            {
                $lookup:
                {
                    from: "usuarios",
                    localField: "_id",
                    foreignField: "estabelecimentosVinculados.idEstabelecimento",
                    as: "usuarios"
                }
            }
        ])

        res.render('usuarios/configuracao/configpainel', { estabelecimento: estabelecimento[0] })
    } catch (err) {
        console.log(err)
    }
})


router.post('/edit-config-painel', (req, res) => { // adicionar estilo do estabelecimento
    Estabelecimento.findById({ _id: req.body.idPainel }).then(estabelecimento => {
        if (estabelecimento) {
            estabelecimento.nomePainel = req.body.nome,

                estabelecimento.endereco.logradouro = req.body.logradouro,
                estabelecimento.endereco.numero = req.body.numero,
                estabelecimento.endereco.bairro = req.body.bairro,

                estabelecimento.painel = {
                    colorFundo: req.body.colorFundo,
                    colorFonte: req.body.colorFonte
                }
            estabelecimento.save().then(() => {
                req.flash('success_msg', 'Painel de vendas editado.')
                res.redirect('back')
            }).catch(err => {
                registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-config-painel", code: "500", description: err})
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            })
        } else {
            registerLog.registerLog({text: "Rota ESTALECIMENTO - edit-config-painel", code: "500", description: "Tentativa de editar, mas não localizou nada"})
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        }
    })

})


let upload = multer(multerConfig.uploadEstabelecimento).single('file')
const s3 = new aws.S3();
router.post("/upload/:idEstabelecimento", (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            registerLog.registerLog({text: "Rota ESTALECIMENTO - /upload/:idEstabelecimento", code: "500", description: err})
            let teste = "" + err; // pego o código do erro e exibo a mensagem para o usuário
            if(teste == 'Error: Invalid file type.'){
                req.flash('error_msg', 'Formato de arquivo não suportado')
                res.redirect('back')
                return
            }else{
                req.flash('error_msg', 'Arquivo muito grande! Deve possui no máximo 2 MB')
                res.redirect('/configuracao/painel/'+req.params.idEstabelecimento)
                return
            }
        }
        const fotos =  Estabelecimento.find({_id: req.params.idEstabelecimento});
        const { originalname: name, size, key, location: url = "" } = req.file;
        Estabelecimento.findById({_id: req.params.idEstabelecimento}).then(photos => {
            if(req.body.tipo == "capa"){
        if(!photos.img.capa.key){
            Estabelecimento.updateOne({_id: req.params.idEstabelecimento},
                $set = {
                    'img.capa' : {  name, size, key, url }
                }
            ).then(() => {
                req.flash('success_msg', 'Foto de Capa editada')
                res.redirect('back')
            })
        }else{
            return s3.deleteObject({
                Bucket: process.env.BUCKET_NAME,
                Key: photos.img.capa.key
            }).promise().then(response => {
                Estabelecimento.updateOne({_id: req.params.idEstabelecimento},
                    $set = {
                        'img.capa' : {  name, size, key, url }
                    }
                ).then(() => {
                    req.flash('success_msg', 'Foto de Capa editada')
                    res.redirect('back')
                })
            }).catch(err => {
                registerLog.registerLog({text: "Rota ESTALECIMENTO - /upload/:idEstabelecimento", code: "500", description: err})
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            });
        }
    }

    if(req.body.tipo == "logo"){
        if(!photos.img.logo.key){
        Estabelecimento.updateOne({_id: req.params.idEstabelecimento},
            $set = {
                'img.logo' : {  name, size, key, url }
            }
              ).then(() => {
                    req.flash('success_msg', 'Logo editada')
                    res.redirect('back')
                })
            
         }else{
            return s3.deleteObject({
                Bucket: process.env.BUCKET_NAME,
                Key: photos.img.logo.key
            }).promise().then(response => {
                Estabelecimento.updateOne({_id: req.params.idEstabelecimento},
            $set = {
                'img.logo' : {  name, size, key, url }
            }

                ).then(() => {
                    req.flash('success_msg', 'Logo editada')
                    res.redirect('back')
                })
            }).catch(err => {
                registerLog.registerLog({text: "Rota ESTALECIMENTO - /upload/:idEstabelecimento", code: "500", description: err})

                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            });
        }
    }
    })
})
})






module.exports = router;

