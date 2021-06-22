require("dotenv").config();
require("./helpers/handlebars-helpers")

// ------ Módulos carregados -----------------------------------------------------------------------------------------------------------------------
const express = require('express')
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



// ----- Public ----------------------------------------------------------------------------------------------------------------------------------

app.use(express.static(path.join(__dirname, "public")))



// ----- Colections ------------------------------------------------------------------------------------------------------------------------------
require("../src/models/Usuario")
const Usuario = mongoose.model("usuarios")



// ----- Rotas -------------------------------------------------------------------------------------------------------------------------------------

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('usuarios/acesso/login')
})

app.get('/registro', (req, res) => {
    res.render('usuarios/acesso/registro')
})


// ---- Rotas "routes" -----------------------------------------------------------------------------------------------------------------------------

// Rotas para USUARIOS
const acessoUsuario = require("./routes/usuario/acessos/acessos")
const usuarioDashboard = require("./routes/usuario/dashboard/dashboard")
const usuarioUsuario = require("./routes/usuario/usuario/usuario")
const usuarioEntregador= require("./routes/usuario/entregador/entregador")
const usuarioProduto = require("./routes/usuario/produto/produto")
const usuarioProdutoModelo = require("./routes/usuario/produto/modelo")
const usuarioPedido= require("./routes/usuario/pedido/pedido")
const usuarioPainel= require("./routes/usuario/painelonline/estabelecimento")
const usuarioSuporte = require("./routes/usuario/suporte/suporte")

    // Configuracoes do usuario
    const usuarioEstabelecimento = require("./routes/usuario/configuracao/estabelecimento")

app.use('/acessos', acessoUsuario)
app.use('/dashboard', usuarioDashboard)
app.use('/usuario', usuarioUsuario)
app.use('/entregador', usuarioEntregador)
app.use('/produto', usuarioProduto)
app.use('/produto', usuarioProdutoModelo)
app.use('/pedido', usuarioPedido)
app.use('/estabelecimento', usuarioPainel)
app.use('/suporte', usuarioSuporte)

    // Configuracoes do usuario
    app.use('/configuracao', usuarioEstabelecimento)


// Rotas para ADMINISTRACAO

const adminEstabelecimento = require("./routes/admin/estabelecimento/estabelecimento")
const adminChamado = require("./routes/admin/chamado/chamado")

    app.use('/admin/administrativo', adminEstabelecimento)
    app.use('/admin/administrativo', adminChamado)




// ---- Rotas Para TESTES -----------------------------------------------------------------------------------------------------------------------------

app.get('/teste', async (req, res) => {
    res.render('teste')
})

// ---- Port -----------------------------------------------------------------------------------------------------------------------------------

const PORT = 3000
app.listen(PORT, () => {
    console.log("Servidor rodando! ")
})