const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (e, decoded) => {
        if (e) {
            return res.status(403).send({ message: 'forbidden' })
        }
        req.decoded = decoded;
        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.drtwsrz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const categoreCollections = client.db('carClub').collection('categories');
        const carsPostCollections = client.db('carClub').collection('carsPost');
        const userCollections = client.db('carClub').collection('users');
        const bookingCollections = client.db('carClub').collection('bookings');

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
        app.get('/carspost/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { categoriesId: id }
            const result = await carsPostCollections.find(query).toArray();
            res.send(result)
        })
        app.post('/addProduct', verifyJWT, async (req, res) => {
            const product = req.body;
            const email = req.query.email;
            const filter = { email: email }
            const user = await userCollections.findOne(filter);
            if (user.userType === 'Seller') {
                const result = await carsPostCollections.insertOne(product);
                return res.send(result)
            }
            res.status(403).send({ message: 'forbiden access ' })
        })

        app.get('/myproduct', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const filter = { email: email };
            const query = { sellerEmail: email }
            const user = await userCollections.findOne(filter);
            if (user.userType === 'Seller') {
                const result = await carsPostCollections.find(query).toArray();
                return res.send(result);
            }
            res.status(403).send({ message: 'forbiden access' })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const email = user.email;
            const filter = {
                email: email
            }
            const oldUser = await userCollections.findOne(filter);
            if (oldUser) {
                return res.send('user already exsist')
            }
            const result = await userCollections.insertOne(user);
            res.send(result)

        })
        app.get('/users/type/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const user = await userCollections.findOne(filter);
            res.send({ userType: user?.userType })
        })

        app.post('/bookings', verifyJWT, async (req, res) => {
            const booking = req.body;
            const result = await bookingCollections.insertOne(booking);
            res.send(result);
        })
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { buyerEmail: email };
                const result = await bookingCollections.find(query).toArray();
                return res.send(result);
            }
            res.status(403).send({ message: 'forbidden access' })

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