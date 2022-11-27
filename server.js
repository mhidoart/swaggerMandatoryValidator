const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');


const fs = require('fs');

var app = express();

app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

app.listen(3000, () => {
    console.log('Express server start at port: 3000');
});

/*
{
    endPoints:{
        "/example":{
            "POST": {
                body:[],
                headers:[],
                query:[]
            }
        }
    }
}
*/
requestToBeValidated = {
    headers: [],
    body: [],
    query: []
}
//read swagger 


function getVerbsOfEndPoints(swagger, endpoint) {
    return Object.keys(swagger.paths[endpoint])
}

function getMandatoryParams(swagger, endpoint, verb) {
    var struct = {
        header: [],
        path: [],
        query: [],
        body: [],
        other: []
    }
    let params = swagger.paths[endpoint][verb].parameters

    params.forEach(p => {
        try {
            switch (p.in) {
                case 'body':
                    p.required == true ? struct.body.push(p) : {}
                    break;
                case 'query':
                    p.required == true ? struct.query.push(p) : {}
                    break;
                case 'path':
                    p.required == true ? struct.path.push(p) : {}
                    break;
                case 'header':
                    p.required == true ? struct.header.push(p) : {}
                    break
                default:
                    p.required == true ? struct.other.push(p) : {}
            }
        } catch (error) {
            console.log(endpoint + " has no param in ( " + verb + " )");
        }
    });

    //console.log(struct);
    return struct
}



function parseSwagger(swagger) {
    let structValidation = {
        paths: []
    }
    let paths = Object.keys(swagger.paths)
    paths.forEach(element => {
        let verbs = getVerbsOfEndPoints(swagger, element);
        //loop over verbs to get params
        structValidation.paths[element] = []

        verbs.forEach(v => {
            structValidation.paths[element][v.toUpperCase()] = getMandatoryParams(swagger, element, v)
        });
    });

    //console.log(structValidation);
    return structValidation

}

function parseRequest(req) {
    let reqBody = {
        method: [req.query.method],
        endPont: [req.query.endPoint],
        headers: [req.headers],
        query: [req.query],
        body: [req.body],
        pathP: [req.params]
    }
    //console.log(reqBody);
    return reqBody
}

function validate(structVal, requestStruct) {
    let missingValues = {
        headers: [],
        query: [],
        body: [],
        pathP: []
    }
    // check for mandatory body
    let params = structVal.paths[requestStruct.endPont][requestStruct.method]
    params.path.forEach(element => {
        let exist = false

        requestStruct.pathP.forEach(p => {
            if (element.name == p.name) {
                exist = true
            }
        });
        if (exist == false) {
            missingValues.pathP.push(element)
        }
    });


    return missingValues;
}

app.post('/checkMandatory', (req, res) => {
    let rawdata = fs.readFileSync('./swaggers/petClinic.json');
    let swagger = JSON.parse(rawdata);
    let structVal = parseSwagger(swagger)
    let requestStruct = parseRequest(req)
    let missing = validate(structVal, requestStruct)


    res.status(200).send({ message: 'hey', missing: missing })
});
app.get('/checkMandatory', (req, res) => {
    res.status(200).end();
    return res
});



