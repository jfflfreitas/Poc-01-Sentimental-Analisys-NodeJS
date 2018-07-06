var xlsx = require('node-xlsx');
var csv = require('node-csv');
var mysql = require('mysql');

var connection = mysql.createPool({
    host: 'localhost',
    user: 'xxxx', //----->Your DB user here
    password: 'xxxxx',//----->Your DB password here
    database: 'xxxx' //----->Your database name here
});

var watson = require('watson-developer-cloud');
var conversation = watson.conversation({
    username: 'xxxxxxxxx', //----->Your Watson Conversation Service username  here
    password: 'xxxxxxxxx', //----->Your Watson Conversation Service password  here
    version: 'v1',
    version_date: '2017-05-26'
});

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var natural_language_understanding = new NaturalLanguageUnderstandingV1({
    'username': 'xxxxxx', //----->Your Watson NLU Service username  here
    'password': 'xxxxxxx', //----->Your Watson NLU Service password  here
    'version_date': '2017-02-27'
});

var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
var language_translator = new LanguageTranslatorV2({
    username: 'xxxxxx', //----->Your Watson Translator Service username  here
    password: 'xxxxxx', //----->Your Watson Translator Service password  here
    version: 'v2'
});
main();

async function main() {
    var obj = xlsx.parse(__dirname + '/myFile.xlsx'); // parses a file
    for (let i = 1; i < obj[0].data.length; i++) {
        
        var idManifest      = obj[0].data[i][0];
        var agCliente       = obj[0].data[i][1];
        var contaCliente    = obj[0].data[i][2];
        var cpfcnpjCliente  = obj[0].data[i][3];
        var nomeCliente     = obj[0].data[i][4];
        var abertManifest   = "0000/00/00";//obj[0].data[i][5];
        var fechaManifest   = "0000/00/00";//obj[0].data[i][6];
        var hrAbertManifest = "00:00:00";//obj[0].data[i][7];
        var hrFechaManifest = "00:00:00";//obj[0].data[i][8];
        var textoManifest   = obj[0].data[i][9];
        var canalManifest   = obj[0].data[i][10];


        //var responseNLU = await analyze(textoManifest);//analisa o texto em pt-br
        var responseConversation = await message("", textoManifest);//analisa o texto em pt-br e encontra entidades
        var responseTranslate = await translate(textoManifest);//traduz o texto
        var responseNLU = await analyze(responseTranslate);//analisa o texto em en-us
        console.log("*------Início da Resposta do NLU--------*");
        console.log(responseNLU);
        console.log("*------Fim da Resposta do NLU--------*");
        console.log("*------Início da Resposta do Conversation--------*");
        //console.log(JSON.stringify(responseConversation, null, 2));
        //console.log(responseConversation.entities[0].value);
        console.log("*------Fim da Resposta do Conversation--------*");
        

       
        
        //var textoManifestTrad = responseTranslate;
        var sentiManifest = responseNLU.sentiment.document.label;
        var sentiScore = responseNLU.sentiment.document.score * 100;
        var langManifest = responseNLU.language;
        if(responseConversation.entities.length <= 0){
            var produtoManifest = "produto não identificado";
        }else{
            var produtoManifest = responseConversation.entities[0].value;
        }
        console.log(produtoManifest);
        //console.log(hrFechaManifest);
        
        
        var sql = "INSERT INTO dcd_analise (idManifest, agCliente, contaCliente, cpfcnpjCliente, nomeCliente, abertManifest, fechaManifest, hrAbertManifest, hrFechaManifest, textoManifest, canalManifest, senti_manifest, score_senti, lang_manifest, produtoManifest) VALUES ('"+idManifest+"', '"
            +agCliente+"', '"+contaCliente+"', '"+cpfcnpjCliente+"', '"+nomeCliente+"', '"
            +abertManifest+"', '"+fechaManifest+"', '"+hrAbertManifest+"', '"+hrFechaManifest+"', '"
            +textoManifest+"', '"+canalManifest+"', '"+sentiManifest+"',  '"+sentiScore+"',  '"
            +langManifest + "',  '"+produtoManifest+"')";
        
            connection.query(sql, function (error, results, fields) {
            if (error) throw error;
            console.log("Registro inserido");
        });
    }

}

function message(workspace_id, message) {
    return new Promise((resolve, reject) => {
        conversation.message({
            workspace_id: "xxxxxxx", //----->Your Watson Coversation Service Workspace ID  here
            input: { 'text': message }
        }, function (err, response) {
            if (err)
                reject(err);
            else
                resolve(response);
                //console.log(JSON.stringify(response, null, 2));
                
        });
        
    }).catch((error) => {
        console.log('erro');
    });
}

function analyze(message) {
    return new Promise((resolve, reject) => {
        var parameters = {
            'text': message,
            'features': {
                'sentiment': {},
                //eu posso trazer entidades, keywords e mais coisas seguindo a estrutura abaixo
                // 'entities': {
                //     'emotion': {},
                //     'sentiment': {},
                //     'limit': 2
                // },
                // 'keywords': {
                //     'emotion': {},
                //     'sentiment': {},
                //     'limit': 2
                // }
            }
        };
        natural_language_understanding.analyze(parameters, function (err, response) {
            if (err)
                reject(err);
            else
                resolve(response);
                
        });

    }).catch((error) => {
        console.log('erro');
    });
}

function translate(message) {
    return new Promise((resolve, reject) => {
        language_translator.translate({
            text: message,
            source: 'pt',
            target: 'en'
        }, function (err, translation) {
            if (err)
                reject(err);
            else
                var textoManifestTrad = JSON.stringify(translation.translations[0].translation, null, 2);
                console.log(JSON.stringify(translation.translations[0].translation, null, 2));
                resolve(textoManifestTrad);
                
                
        });
    }).catch((error) => {
        console.log('erro');
    });
}