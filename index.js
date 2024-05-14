const express = require('express')
const app = express()
const Razorpay = require('razorpay');
const port = process.env.PORT || 5000
const cors = require('cors')
const crypto = require("crypto");
require("dotenv").config();


// middleware
app.use(cors());  
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// mongodb configurations



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://slp_4th_sem:QQ6ZQFB0AmTuN2jK@cluster.mideftk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster.mideftk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //create a collection of documents

    const bookCollections = client.db("BookInventory").collection("books");
    
    //insert a book to the db : post method

    app.post("/upload-book", async(req,res) =>{
        const data = req.body;
        const result = await bookCollections.insertOne(data);
        res.send(result);
    })

    // get all books from db

    // app.get("/all-books", async(req,res)=>{
    //     const books = bookCollections.find();
    //     const result = await books.toArray();
    //     res.send(result);
    // })

    // update a book data: patch or update methods
    app.patch("/book/:id", async(req,res) => {
        const id = req.params.id;
        // console.log(id);
        const updateBookData = req.body;
        const filter = {_id: new ObjectId(id)};
        const options = {upsert: true};

        const updateDoc = {
            $set: {
                ...updateBookData
            }   
        }

        //update
        const result = await bookCollections.updateOne(filter, updateDoc, options);
        res.send(result);
    })

    //delete a book data
    app.delete("/book/:id", async(req,res) =>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await bookCollections.deleteOne(filter);
        res.send(result);
    })

    //find by category
    app.get("/all-books",async(req, res)=>{
      let query = {};
      if(req.query?.category){
        query = {category: req.query.category}
      }
      const result = await bookCollections.find(query).toArray();
      res.send(result);
    })

    //get a single book data
    app.get("/book/:id", async(req,res) =>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await bookCollections.findOne(filter);
        res.send(result);
    })

    //for payment of a book
    app.post("/order", async (req, res) => {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_SECRET,
        });
    
        const options = req.body;
        const order = await razorpay.orders.create(options);
    
        if (!order) {
          return res.status(500).send("Error");
        }
    
        res.json(order);
      } catch (err) {
        console.log(err);
        res.status(500).send("Error");
      }
    });
    
    // app.post("/order/validate", async (req, res) => {
    //   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    //     req.body;
    
    //   const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    //   //order_id + "|" + razorpay_payment_id
    //   sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    //   const digest = sha.digest("hex");
    //   if (digest !== razorpay_signature) {
    //     return res.status(400).json({ msg: "Transaction is not legit!" });
    //   }
    
    //   res.json({
    //     msg: "success",
    //     orderId: razorpay_order_id,
    //     paymentId: razorpay_payment_id,
    //   });
    // });
    
  

    // Send a ping to confirm a successful connection
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
