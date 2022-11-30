const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
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
        const wishlistCollections = client.db('carClub').collection('mywishlist');

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

        app.get('/myproduct', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const query = { sellerEmail: email }
            const user = await userCollections.findOne(filter);
            if (user.userType === 'Seller') {
                const result = await carsPostCollections.find(query).toArray();
                return res.send(result);
            }
            res.status(403).send({ message: 'forbiden access' })
        })
        app.delete('/myproduct/:id', verifyJWT, async (req, res) => {
            const email = req.decoded.email;
            const id = req.params.id;
            const filter = { email: email };
            const query = { _id: ObjectId(id) };
            const user = await userCollections.findOne(filter);
            if (user.userType === 'Seller') {
                const result = await carsPostCollections.deleteOne(query);
                return res.send(result)
            }
            res.status(403).send({ message: 'forbiden access' })
        })

        app.put('/myproduct/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await userCollections.findOne(filter);
            const option = { upsert: true }
            const updateDoc = {
                $set: { status: 'avilable' }
            }
            if (user.userType === 'Seller') {
                const result = await carsPostCollections.updateOne(query, updateDoc, option)
                return res.send(result)

            }
            res.status(403).send({ message: 'forbiden access' })

        })
        app.get('/myproduct/advertis', async (req, res) => {
            const filter = { status: 'avilable' };
            const AdvertisItem = await carsPostCollections.find(filter).toArray();
            res.send(AdvertisItem);
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

        app.get('/users/allseller', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            const filter = { email: email }
            if (!email === decodedEmail) {
                return res.status(403).send({ message: 'forbiden access' })
            }
            const user = await userCollections.findOne(filter);
            if (user.userType === 'Admin') {
                const query = { userType: 'Seller' }
                const allseller = await userCollections.find(query).toArray();
                return res.send(allseller);
            }
            res.status(403).send({ message: 'You are not adimn' })


        })
        app.get('/users/allbuyer', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            const filter = { email: email }
            if (!email === decodedEmail) {
                return res.status(403).send({ message: 'forbiden access' })
            }
            const user = await userCollections.findOne(filter);
            if (user.userType === 'Admin') {
                const query = { userType: 'Buyer' }
                const allseller = await userCollections.find(query).toArray();
                return res.send(allseller);
            }
            res.status(403).send({ message: 'You are not adimn' })
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollections.deleteOne(query);
            res.send(result);
        })
        app.put('/users/verify/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail };
            const user = await userCollections.findOne(filter)
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    verifyStatus: 'verified'
                }
            }
            if (user.userType === 'Admin') {
                const result = await userCollections.updateOne(query, updateDoc, option)
                return res.send(result)
            }
            res.status(403).send({ message: 'forbiden access' })
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollections.findOne(query);
            res.send(user)
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


        app.get('/bookings/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await bookingCollections.findOne(query);
            res.send(booking);
        })

        app.put('/mywishlist', verifyJWT, async (req, res) => {
            const wishlist = req.body;
            const option = { upsert: true }
            const result = await wishlistCollections.insertOne(wishlist, option);
            res.send(result);
        })
        app.get('/mywishlist', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await wishlistCollections.find(query).toArray();
            res.send(result);
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