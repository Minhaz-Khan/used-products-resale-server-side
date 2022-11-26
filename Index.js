const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.drtwsrz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const categoreCollections = client.db('carClub').collection('categories');
        const carsPostCollections = client.db('carClub').collection('carsPost')
        const userCollections = client.db('carClub').collection('users')

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const fiter = { email: email }
            const user = await userCollections.findOne(fiter);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token })

            }
            res.status(403).send({ accessToken: '' })

        })
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

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollections.insertOne(user);
            res.send(result)

        })


        // app.put('/carspost/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { categoriesId: id };
        //     const options = { upsert: true }
        //     const updateDoc = {
        //         $set: {
        //             categories: 'Mercedes',
        //         }
        //     }
        //     const result = await carsPostCollections.updateMany(query, updateDoc, options);

        //     res.send(result)
        // })
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