const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');


const fs = require('fs');

var app = express();
var router = express.Router();

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

app.listen(3000, () => {
    console.log('Express server start at port: 3000');
});

app.post('/checkMandatory', (req, res) => {
    /*
    console.log(req.query);
    console.log(req.params);
    console.log(req.body);
    console.log(req.headers);
    */
    let missing = checkParams(req.query.endPoint, req.query.method, req.headers, req.query, req.body)

    res.status(200).send({ message: 'hey', missing: missing })
});
app.get('/checkMandatory', (req, res) => {
    res.status(200).end();
    return res
});


let rawdata = fs.readFileSync('./swaggers/petClinic.json');
let data = JSON.parse(rawdata);

let validationSchema = extractParams(data)
// parsing algorithm 
function extractParams(data) {
    let paths = Object.keys(data.paths)
    let validationSchema = {};
    validationSchema.paths = {};
    paths.forEach(path => {
        validationSchema.paths[path] = {}
        let verbs = Object.keys(data.paths[path])

        //console.log(path);
        verbs.forEach(v => {
            v = v.toUpperCase()
            validationSchema.paths[path][v] = { parameters: [] }
            //console.log("--> " + v);

            try {
                //console.log(data.paths[path][v].parameters);
                let params = data.paths[path][v.toLocaleLowerCase()].parameters

                //loop over params to have only mandatory params
                params.forEach(p => {
                    if (p.required) {
                        // adding required params 
                        validationSchema.paths[path][v].parameters.push(p)
                    }


                });

            } catch (error) {

            }


        });

    });
    return validationSchema;
}

//console.log(JSON.stringify(validationSchema));


//validation

function validate(requestBody) {
    let requestBodyParams = extractParams(requestBody);
    //console.log(requestBodyParams);
    return requestBodyParams;
}

function compare(requestBody, validationSchema) {
    let missing = []
    let paths = Object.keys(validationSchema.paths)
    paths.forEach(p => {
        let verbs = Object.keys(validationSchema.paths[p])
        verbs.forEach(v => {
            let mandatory = validationSchema.paths[p][v].parameters
            let requestBodyParams = requestBody.paths[p][v].parameters
            mandatory.forEach(field => {
                let exist = false;
                requestBodyParams.forEach(rbField => {
                    if (field.name == rbField.name) {
                        exist = true
                    }
                });
                if (exist == false) {
                    missing.push(field)
                }
            });
        });

    });
    return missing;
}

let requestBody = JSON.parse(fs.readFileSync('./swaggers/missing.json'));

//let res = compare(validate(requestBody), validationSchema)
//console.log("missing params");
//console.log(res);
function checkParams(endpoint, method, headers, query, body) {
    console.log("endpoint " + endpoint);
    console.log("method " + method);
    console.log("headers " + JSON.stringify(headers));
    console.log("query " + JSON.stringify(query));
    console.log("body " + JSON.stringify(body));
    let mandatory = validationSchema.paths[endpoint][method].parameters
    let missing = []
    mandatory.forEach(element => {
        let exist = false;
        Object.keys(query).forEach(k => {
            if (k == element.name) {
                exist = true
            }
        });
        if (exist == false) {
            missing.push(element)
        }
    });
    return missing;


}
