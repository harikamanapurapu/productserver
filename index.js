const express=require('express')
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const cors=require('cors')
const dotenv=require('dotenv')
dotenv.config()

const app=express()

app.use(bodyParser.json())
app.use(express.static('./public'))
app.use(cors())

const User= mongoose.model( 'User',{
    name:String,
    email:String,
    mobile:Number,
    password:String,
})




app.post('/signup', async (req,res)=>{

    try{
        const {name,email,mobile,password}=req.body

        const existingUser=await User.findOne({email})

        if(existingUser){
            res.send("User already exists,please Sign in")
            return;
        }
        const encryptedPassword= await bcrypt.hash(password,10)
        const user= {name,email,mobile,password:encryptedPassword}
        await User.create(user)
        const jwtToken=jwt.sign(user,process.env.JWT_SECRET,{expiresIn:"1h"})
        res.send({status:"success",jwtToken})
    }
    catch(error){
        console.log(error)
        res.send(error)

    }
    
})



app.post('/login', async (req,res)=>{

    try{
        const {email,password}=req.body

        const userInDb=await User.findOne({email})

        if(!userInDb){
            res.send("User doesnot exist..Please sign up")
            return;
        }
        const didPasswordMatch= await bcrypt.compare(password,userInDb.password)
        if(didPasswordMatch){
            const jwtToken=jwt.sign({...userInDb},process.env.JWT_SECRET,{expiresIn:"1h"})
            res.send({message:"Login succesful",jwtToken})
        }
        else{
            res.send("Invalid password")
        }
    }
    catch(error){
        console.log(error)
        res.send(error)
    }
    
})

// const addProduct= mongoose.model( 'addProduct',{
//     companyName:String,
//     category:String,
//     logoUrl:String,
//     linkofProduct:String,
//     description:String,
// })

const addProductSchema = mongoose.Schema({
    companyName: String,
    category: String,
    logoUrl: String,
    linkofProduct: String,
    description: String,
    upvotes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  });
  
const addProduct = mongoose.model('addProduct', addProductSchema);
  

app.post('/Addproduct', (req,res) => {
    const {companyName,category,logoUrl,linkofProduct,description}=req.body
    const Product= {companyName,category,logoUrl,linkofProduct,description}
    addProduct.create(Product).then(()=>{
        res.send('added success')
    }).catch((error)=>{
        res.send(error)
    })
})

app.get('/Viewproducts', async (req,res)=>{
        try {
          const productsList = await addProduct.find({});
          res.status(200).json(productsList);
        } catch (err) {
          console.error('Error fetching job details:', err);
          res.status(500).json({ error: 'Error fetching job details' });
        }
})

app.patch('/Editproduct/:productId', async (req, res) => {
    const productId = req.params.productId;
    const { companyName, category, logoUrl, linkofProduct, description } = req.body;

    try {
        // Find the product by its ID in the database
        const product = await addProduct.findById(productId);
        console.log('Received Product ID:', productId);
        // Check if the product with the given ID exists
        if (!product) {
            return res.status(404).send('Product not found');
        }
        // Update the product fields with the new data
        product.companyName = companyName;
        product.category = category;
        product.logoUrl = logoUrl;
        product.linkofProduct = linkofProduct;
        product.description = description;
        // Save the updated product to the database
        await product.save();
        res.send('Product updated successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error occurred while updating the product');
    }
});


app.patch('/UpvoteProduct/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
      // Find the product by its ID in the database
      const product = await addProduct.findById(productId);
      if (!product) {
        return res.status(404).send('Product not found');
      }
      // Increment the upvotes count and save the product
      product.upvotes += 1;
      await product.save();
      res.send('Product upvoted successfully');
    } catch (error) {
      console.log(error);
      res.status(500).send('Error occurred while upvoting the product');
    }
  });


  app.patch('/CommentProduct/:productId', async (req, res) => {
  const productId = req.params.productId;
  const { text } = req.body;
  try {
    // Find the product by its ID in the database
    const product = await addProduct.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    // Add the new comment to the comments array
    product.comments.push({ text });
    await product.save();
    res.send('Comment posted successfully');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error occurred while posting the comment');
  }
});

  





app.get('/', (req,res)=>{
    res.send("everything is working fine")
})

app.listen(process.env.PORT, ()=>{
    mongoose.connect(process.env.MONGODB_URL)
      .then(()=>console.log(`Server running on http://localhost:${process.env.PORT}`))
      .catch((error)=>console.log(error))

})