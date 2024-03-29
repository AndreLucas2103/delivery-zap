const Handlebars = require('handlebars')
const moment = require('moment')

const paginate = require('handlebars-paginate');
Handlebars.registerHelper('paginate', paginate);

Handlebars.registerHelper('formatTrueFalse', function(status) {
    if(status == true){
        return '<i class="fas fa-check-circle text-success"></i>'
    }else {
        return '<i class="fas fa-times-circle text-danger"></i>'
    }
})
    
Handlebars.registerHelper('dataFormatTimeZone', function(userTimeZone, data, format, exactDb) {
    userTimeZone ? timeZone = userTimeZone : timeZone = "-03:00";
    format ? formtMoment = format : formtMoment = "";

    //{{dataFormatTimeZone usuarioLogado.timeZone data ""}}

    if (exactDb == "exact"){
        return moment(new Date(data)).utcOffset('+00:00').format(formtMoment);
    }else{
        return moment(new Date(data)).utcOffset(timeZone).format(formtMoment);
    }
})

Handlebars.registerHelper('toJSON', function(obj) {
    return JSON.stringify(obj, null, 3);
});

Handlebars.registerHelper('FormatValor', function(valor) {
  return Intl.NumberFormat('pt-br', { style: 'currency', currency: 'BRL' }).format(valor)
})

Handlebars.registerHelper('situacaoPedido', function(pedido) {

    switch (pedido) {
        case 'canceled':
            return ('<i class="fas fa-times-circle text-danger"></i> Cancelado')
            break;
        case 'waiting':
            return ('<i class="fas fa-clock"></i> Aguardando')
            break;
        case 'production':
            return ('<i class="fas fa-spinner text-warning"></i> Produção')
            break;
        case 'concluded':
            return ('<i class="fas fa-check text-success"></i> Concluido')
            break;
        case 'delivery':
            return ('<i class="fas fa-truck"></i> Entrega')
            break;
        case 'finished':
            return ('<i class="fas fa-check-circle text-success"></i> Finalizado')
            break;
        default:
            return ('err')
    }
  })

  Handlebars.registerHelper('situacaoPedidoPainel', function(pedido) {

    switch (pedido) {
        case 'canceled':
            return ('<i class="fas fa-times-circle text-danger"> Cancelado</i>')
            break;
        case 'waiting':
            return ('<i class="fas fa-clock"></i> Aguardando aprovação')
            break;
        case 'production':
            return ('<i class="fas fa-hamburger text-success"> Preparando seu pedido</i>')
            break;
        case 'concluded':
            return ('<i class="fas fa-check text-success"> Concluido</i>')
            break;
        case 'delivery':
            return ('<i class="fas fa-truck text-warning"> Saindo para entrega</i>')
            break;
        case 'finished':
            return ('<i class="fas fa-check-circle text-success"> Finalizado</i>')
            break;
        default:
            return ('err')
    }
  })

  
  Handlebars.registerHelper('situacaoColor', function(pedido) {

    switch (pedido) {
        case 'waiting':
            return ('style="background: rgb(228, 228, 147)"')
            break;
        default:
            return ('err')
    }
  })