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
    
Handlebars.registerHelper('dataFormatTimeZone', function(userTimeZone, data, format) {
    userTimeZone ? timeZone = userTimeZone : timeZone = "-03:00";
    format ? formtMoment = format : formtMoment = "";

    //{{dataFormatTimeZone usuarioLogado.timeZone data ""}}
    return moment(new Date(data)).utcOffset(timeZone).format(formtMoment);
})



