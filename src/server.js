const express = require('express');
const os = require('os')
const app = express();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const conversor = require('./convert')
const bodyParser = require('body-parser');
const config = require('./config/system-life');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dbserver:dbpass@cluster.mongodb.net/conversor?retryWrites=true&w=majority";
let client;

MongoClient.connect(uri, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    client = db;
    console.log("MongoDB connected!");
});

app.use(config.middlewares.healthMid);
app.use('/', config.routers);
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 

app.get('/fahrenheit/:valor/celsius', (req, res) => {

    let valor = req.params.valor;
    let celsius = conversor.fahrenheitCelsius(valor);
    client.db("test").collection("conversions").insertOne({ "type": "Fahrenheit to Celsius", "value": celsius, "maquina": os.hostname() }, (err, result) => {
        if (err) throw err;
        console.log("Conversion saved to MongoDB");
    });
    res.json({ "celsius": celsius, "maquina": os.hostname() });
});

app.get('/celsius/:valor/fahrenheit', (req, res) => {

    let valor = req.params.valor;
    let fahrenheit = conversor.celsiusFahrenheit(valor);
    client.db("test").collection("conversions").insertOne({ "type": "Celsius to Fahrenheit", "value": fahrenheit, "maquina": os.hostname() }, (err, result) => {
        if (err) throw err;
        console.log("Conversion saved to MongoDB");
    });	
    res.json({ "fahrenheit": fahrenheit, "maquina": os.hostname() });
});

app.get('/', (req, res) => {

    res.render('index',{valorConvertido: ''});
});

app.post('/', (req, res) => {
    let resultado = '';

    if (req.body.valorRef) {
        if (req.body.selectTemp == 1) {
            resultado = conversor.celsiusFahrenheit(req.body.valorRef)
        } else {
            resultado = conversor.fahrenheitCelsius(req.body.valorRef)
        }
    }

    res.render('index', {valorConvertido: resultado});
 });

app.listen(8080, () => {
    console.log("Servidor rodando na porta 8080!!!");
});
