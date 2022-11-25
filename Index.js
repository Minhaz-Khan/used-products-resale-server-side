const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { query } = require('express');
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.drtwsrz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const categoreCollections = client.db('carClub').collection('categories');
        const carsPostCollections = client.db('carClub').collection('carsPost')


        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoreCollections.find(query).toArray();
            res.send(result);
        })
        app.get('/carspost/:id', async (req, res) => {
            const id = req.params.id;
            const query = { categoriesId: id }
            const result = await carsPostCollections.find(query).toArray();
            res.send(result)
        })
    }
    catch {

    }


}
run().catch(e => console.log(e))


app.get('/', (req, res) => {
    res.send('curClub is on')
})
app.listen(port, () => {
    console.log(`server runing on prot ${port}`);
})