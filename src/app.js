require("dotenv").config();
require("./helpers/handlebars-helpers")
require('./helpers/schendule')

// ------ Módulos carregados -----------------------------------------------------------------------------------------------------------------------
const express = require('express')
const nodemailer = require('nodemailer');
const mailer = require('../node_modules/mailer')
const handlebars = require('express-handlebars')
const bodyParser = require("body-parser")
const path = require("path")
const app = express()
const session = require("express-session")
const flash = require("connect-flash")
const passport = require("passport")

require("./config/auth")(passport)

const cors = require("cors");


// ----- Middleware -----------------------------------------------------------------------------------------------------------------------
app.use((req, res, next) => { //Cria um middleware onde todas as requests passam por ele 
    if ((req.headers["x-forwarded-proto"] || "").endsWith("http")) //Checa se o protocolo informado nos headers é HTTP 
        res.redirect(`https://${req.headers.host}${req.url}`); //Redireciona pra HTTPS 
    else //Se a requisição já é HTTPS 
        next(); //Não precisa redirecionar, passa para os próximos middlewares que servirão com o conteúdo desejado 
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(morgan("dev"));
app.use(
    "/files",
    express.static(path.resolve(__dirname, "..", "tmp", "uploads"))
);

app.use(session({
    secret: "hotpedidos",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.warning_msg = req.flash("warning_msg")
    res.locals.info_msg = req.flash("info_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next();
})

app.use(async function (req, res, next) {
    try {
        if (req.user) {
            if(req.user.administracao === true){
                res.locals.usuarioLogado = req.user.toObject();
            }else{
                require("./models/Usuario")
                const Usuario = mongoose.model("usuarios")

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
                    },
                    {
                        $lookup:
                            {
                                from: "estabelecimentos",
                                localField: "estabelecimentosSelecionados.idEstabelecimento",
                                foreignField: "_id",
                                as: "estabelecimentosSelecionados"
                            }
                    }
                ])
                res.locals.usuarioLogado = usuario[0];
            }
        }
        next();
    } catch (err) {
        console.log(err)
    }
});


// ----- Body Parser -----------------------------------------------------------------------------------------------------------------------

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Handlebars

app.engine('handlebars', handlebars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.set('views', 'src/views/')



// ----- Banco de dados -----------------------------------------------------------------------------------------------------------------------

const mongoose = require("mongoose")


// ----- Mongoose --------------------------------------------------------------------------------------------------------------------------------

//url de destino para conexão com o mongoDB no Atlas, servidor Online:
    //- mongodb+srv://admin:admin@delivery-zap-teste1.hrbcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
    // Para se conectar ao mongodb Compass utilize: mongodb+srv://admin:admin@delivery-zap-teste1.hrbcb.mongodb.net/test
//url de destino para a base de dados localhost:
    //- mongodb://localhost/delzap

mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://admin:admin@delivery-zap-teste1.hrbcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Conectado ao mongo")
}).catch((err) => {
    console.log("Erro ao se conectar: " + err)
})

require("./models/Plano")
const Plano = mongoose.model("planos")


// ----- Public ----------------------------------------------------------------------------------------------------------------------------------

app.use(express.static(path.join(__dirname, "public")))



// ----- Colections ------------------------------------------------------------------------------------------------------------------------------


// ----- Rotas -------------------------------------------------------------------------------------------------------------------------------------

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    if(req.user){
        if(req.user.administracao === true){
            res.redirect('/admin')
        }else{
            res.redirect('/dashboard')
        }
    }else{
        res.render('usuarios/acesso/login')
    }
})

app.get('/registro', (req, res) => {
    Plano.find({'statusAtivo': true}).lean().then(planos => {
        res.render('usuarios/acesso/registro', {planos: planos})
    }).catch(err => {
        console.log(err)
    })
})


// ---- Rotas "routes" -----------------------------------------------------------------------------------------------------------------------------

let verifyUser = require('./middlewares/verifyUser')

// Rotas para USUARIOS
const acessoUsuario = require("./routes/usuario/acessos/acessos")
const usuarioDashboard = require("./routes/usuario/dashboard/dashboard")
const usuarioUsuario = require("./routes/usuario/usuario/usuario")
const usuarioEntregador= require("./routes/usuario/entregador/entregador")
const usuarioProduto = require("./routes/usuario/produto/produto")
const usuarioProdutoModelo = require("./routes/usuario/produto/modelo")
const usuarioPedido= require("./routes/usuario/pedido/pedido")
const usuarioImpressora= require("./routes/usuario/configuracao/impressora")
const usuarioPainel= require("./routes/usuario/painelonline/estabelecimento")
const usuarioSuporte = require("./routes/usuario/suporte/suporte")
const usuarioFatura = require("./routes/usuario/fatura/fatura")

    // Configuracoes do usuario
    const usuarioEstabelecimento = require("./routes/usuario/configuracao/estabelecimento")

app.use('/acessos', acessoUsuario)
app.use('/dashboard', verifyUser, usuarioDashboard)
app.use('/usuario', usuarioUsuario)
app.use('/entregador', verifyUser, usuarioEntregador)
app.use('/produto', verifyUser, usuarioProduto)
app.use('/produto', verifyUser, usuarioProdutoModelo)
app.use('/pedido', verifyUser, usuarioPedido)
app.use('/impressora', verifyUser, usuarioImpressora)
app.use('/estabelecimento', usuarioPainel)
app.use('/suporte', verifyUser, usuarioSuporte)
app.use('/fatura', usuarioFatura)


    // Configuracoes do usuario
    app.use('/configuracao', usuarioEstabelecimento)


// Rotas para ADMINISTRACAO
const adminDashboard = require("./routes/admin/dashboard/dashboard")
const adminEstabelecimento = require("./routes/admin/estabelecimento/estabelecimento")
const adminChamado = require("./routes/admin/chamado/chamado")
const adminUsuario = require("./routes/admin/usuario/usuario")
const adminPlano = require("./routes/admin/plano/plano")

    app.use('/admin', adminDashboard)
    app.use('/admin/administrativo', adminEstabelecimento)
    app.use('/admin/administrativo', adminChamado)
    app.use('/admin/usuario', adminUsuario)
    app.use('/admin/administrativo', adminPlano)


// ---- Rotas Para TESTES -----------------------------------------------------------------------------------------------------------------------------

require("./models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")
require("./models/Usuario")
const Usuario = mongoose.model("usuarios")
require("./models/Produto")
const Produto = mongoose.model("produtos")
require("./models/Pedido")
const Pedido = mongoose.model("pedidos")

const moment = require('moment')
const { v4: uuidv4 } = require('uuid');

const registerLog = require("./components/log")

app.get('/estabelecimento', (req, res) => {
    Estabelecimento.findById(req.query.id, {impressora: 0, integracao: 0, painel:0, configPedidos:0, img:0}).lean().then(estabelecimento => {
        res.json(estabelecimento)
    })
})

app.get('/teste', async (req, res) => {
    try {
        let estabelecimento = await Estabelecimento.find()
        let produtos = await Produto.find()
        let usuario = await Usuario.find()
        let pedido = await Pedido.find()

        let array1 = estabelecimento.length > 0 ? estabelecimento.map(v => v) : 0
        let array2 = produtos.length > 0 ? produtos.map(v => v) : 0
        let array3 = usuario.length > 0 ? usuario.map(v => v) : 0
        let array4 = pedido.length > 0 ? pedido.map(v => v) : 0
        let teste = uuidv4() + uuidv4() + uuidv4() + uuidv4()
        
    } catch (err) {
        console.log(err)
    }
})

// ---- Port -----------------------------------------------------------------------------------------------------------------------------------

const PORT = process.env.APP_PORT
app.listen(PORT, () => {
    console.log("Servidor rodando! ")
})