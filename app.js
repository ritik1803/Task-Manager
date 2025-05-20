const express = require('express');
const path = require('path');
const userModel= require('./models/User');
const jwt= require ('jsonwebtoken')
const taskModel= require('./models/task');
const {body, validationResult}= require('express-validator')


const bodyParser = require('body-parser');
const fs= require('fs')
const app = express();
const bcrypt= require('bcryptjs');
const cookieParser = require('cookie-parser');

const mongoose = require("mongoose");

// Prevent multiple connections
if (mongoose.connection.readyState === 0) {
  mongoose.connect(
    "mongodb+srv://singhritik2251:RO8VUXKEs4nOJyT4@cluster0.ijongm1.mongodb.net/first?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
}


app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
    const tasks = await taskModel.find({});
    res.render('index', { tasks });
});

app.get('/login',  (req,res)=>{
    res.render('login')
});
app.get('/register', (req,res)=>{
    res.render('register')
})


app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        let user= await userModel.findOne({email:req.user.email });
        let tasks= await taskModel.find({userId:req.user.userid });
        res.render('profile',{user,tasks });
    } catch(error) {
        console.error('Error fetching profile data:',error);
        res.status(500).send('Server error');
    }
});


app.post('/register',[
    body('email').isEmail().withMessage("ENter a valid email address"),
    body('password').isLength({min:6}).withMessage("Password must be contains at least 6 char")
    ], async(req,res)=>{
    const errors= validationResult(req);
    const {email,password,username,name}= req.body;

    let errorMsg= errors.array().map(err=>err.msg).join(', ');
    if(!errors.isEmpty()){
        return res.render('register',{
            error:errorMsg,email:email||"",username:username||"",name:name||""
                });
    }
    if (!username||!name) {
        return res.render('register', {
            error: "Please fill in all data fields",email:email|| "",username:username||"",name:name || ""
        });
    }
    let user=await userModel.findOne({email });
    if (user) {
        return res.render('register', { 
            error:"Email already registered.",email,username,name
        });
    }
    bcrypt.genSalt(2,(err,salt)=>{
        bcrypt.hash(req.body.password, salt,async (err,hash)=>{
          let user= await userModel.create({
                username,email,name,password: hash
            });
            let token=jwt.sign({
                email:email,userid:user._id
            },"RDJ");
            res.cookie("token",token);
           // console.log(token);
            res.redirect("/profile")
        })
    })
});




app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            let token= jwt.sign({email:email, userid:user._id},"RDJ");
            res.cookie("token",token)
            return res.status(200).redirect("/profile");
            
        } else {
            
            return res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send("Something went wrong");
    }
});



app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})


function isLoggedIn(req, res, next) {
    const token = req.cookies.token; 

    if (!token) {
        return res.redirect("/login");
    } else {
        try {
            let data = jwt.verify(token, "RDJ");
            req.user = data;
            next();
        } catch (err) {
            console.error('Token verification error:', err);
            res.send("Invalid token");
        }
    }
}



// app.post('/profile/create', async (req, res) => {
//     let user= await userModel.findOne({email:req.user.email});
//     let {details}= req.body
//    // const { title, details } = req.body;
//    // const newTask = new taskModel({ title, details });
//     let task= await taskModel.create({
//         user: user._id,
//         title
//     })
//     user.tasks.push(task._id);
//     await newTask.save();
//     res.redirect('/profile');
// });


app.post('/profile/create', isLoggedIn, async (req, res) => {
    const { title, details } = req.body;
    try {
        const newTask = new taskModel({ title, details, userId: req.user.userid });
        await newTask.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Server error');
    }
});


app.get('/profile/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await taskModel.findOne({ _id: req.params.id, userId: req.user.userid });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        res.render('edit', { task });
    } catch (error) {
        console.error('Error fetching task for edit:', error);
        res.status(500).send('Server error');
    }
});

app.post('/profile/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const { title, details } = req.body;
        const updatedTask = await taskModel.findOneAndUpdate(
            {_id: req.params.id, userId: req.user.userid},{ title, details },{new: true }
        );
        if (!updatedTask) {
            return res.status(404).send('Task not found');
        }
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Server error');
    }
});




app.get('/profile/show/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await taskModel.findOne({ _id: req.params.id, userId: req.user.userid });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        res.render('show', { task });
    } catch (error) {
        console.error('Error fetching task for show:', error);
        res.status(500).send('Server error');
    }
});

app.post('/profile/delete', isLoggedIn, async (req, res) => {
    const { id } = req.body;
    try {
        await taskModel.findOneAndDelete({ _id: id, userId: req.user.userid });
        res.redirect('/profile');
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Server error');
    }
});

app.get('/profile/download/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await taskModel.findOne({ _id: req.params.id, userId: req.user.userid });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        const filePath = path.join(__dirname, 'files', `${task.title}.txt`);
        fs.writeFile(filePath, task.details, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).send("Server error while writing file");
            }
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error while downloading file:', err);
                    return res.status(500).send("Server error while downloading file");
                } else {
                    console.log(`File ${task.title}.txt downloaded successfully`);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting file:', unlinkErr);
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error in /profile/download/:id route:', error);
        res.status(500).send('Server error');
    }
});


app.listen(3001, () => {
    console.log('Server running on port 3001');
});
const express = require('express');
const path = require('path');
const userModel= require('./models/User');
const jwt= require ('jsonwebtoken')
const taskModel= require('./models/task');
const {body, validationResult}= require('express-validator')


const bodyParser = require('body-parser');
const fs= require('fs')
const app = express();
const bcrypt= require('bcryptjs');
const cookieParser = require('cookie-parser');

// const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/first')
//     .then(() => console.log("Connected to MongoDB"));


// const fileSchema = new mongoose.Schema({
//     title: String,
//     details: String
// });

//const Task = mongoose.model('Task', fileSchema);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
    const tasks = await taskModel.find({});
    res.render('index', { tasks });
});

app.get('/login',  (req,res)=>{
    res.render('login')
});
app.get('/register', (req,res)=>{
    res.render('register')
})


app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        let user= await userModel.findOne({email:req.user.email });
        let tasks= await taskModel.find({userId:req.user.userid });
        res.render('profile',{user,tasks });
    } catch(error) {
        console.error('Error fetching profile data:',error);
        res.status(500).send('Server error');
    }
});


app.post('/register',[
    body('email').isEmail().withMessage("ENter a valid email address"),
    body('password').isLength({min:6}).withMessage("Password must be contains at least 6 char")
    ], async(req,res)=>{
    const errors= validationResult(req);
    const {email,password,username,name}= req.body;

    let errorMsg= errors.array().map(err=>err.msg).join(', ');
    if(!errors.isEmpty()){
        return res.render('register',{
            error:errorMsg,email:email||"",username:username||"",name:name||""
                });
    }
    if (!username||!name) {
        return res.render('register', {
            error: "Please fill in all data fields",email:email|| "",username:username||"",name:name || ""
        });
    }
    let user=await userModel.findOne({email });
    if (user) {
        return res.render('register', { 
            error:"Email already registered.",email,username,name
        });
    }
    bcrypt.genSalt(2,(err,salt)=>{
        bcrypt.hash(req.body.password, salt,async (err,hash)=>{
          let user= await userModel.create({
                username,email,name,password: hash
            });
            let token=jwt.sign({
                email:email,userid:user._id
            },"RDJ");
            res.cookie("token",token);
           // console.log(token);
            res.redirect("/profile")
        })
    })
});




app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            let token= jwt.sign({email:email, userid:user._id},"RDJ");
            res.cookie("token",token)
            return res.status(200).redirect("/profile");
            
        } else {
            
            return res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send("Something went wrong");
    }
});



app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})


function isLoggedIn(req, res, next) {
    const token = req.cookies.token; 

    if (!token) {
        return res.redirect("/login");
    } else {
        try {
            let data = jwt.verify(token, "RDJ");
            req.user = data;
            next();
        } catch (err) {
            console.error('Token verification error:', err);
            res.send("Invalid token");
        }
    }
}



// app.post('/profile/create', async (req, res) => {
//     let user= await userModel.findOne({email:req.user.email});
//     let {details}= req.body
//    // const { title, details } = req.body;
//    // const newTask = new taskModel({ title, details });
//     let task= await taskModel.create({
//         user: user._id,
//         title
//     })
//     user.tasks.push(task._id);
//     await newTask.save();
//     res.redirect('/profile');
// });


app.post('/profile/create', isLoggedIn, async (req, res) => {
    const { title, details } = req.body;
    try {
        const newTask = new taskModel({ title, details, userId: req.user.userid });
        await newTask.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Server error');
    }
});


app.get('/profile/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await taskModel.findOne({ _id: req.params.id, userId: req.user.userid });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        res.render('edit', { task });
    } catch (error) {
        console.error('Error fetching task for edit:', error);
        res.status(500).send('Server error');
    }
});

app.post('/profile/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const { title, details } = req.body;
        const updatedTask = await taskModel.findOneAndUpdate(
            {_id: req.params.id, userId: req.user.userid},{ title, details },{new: true }
        );
        if (!updatedTask) {
            return res.status(404).send('Task not found');
        }
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Server error');
    }
});




app.get('/profile/show/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await taskModel.findOne({ _id: req.params.id, userId: req.user.userid });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        res.render('show', { task });
    } catch (error) {
        console.error('Error fetching task for show:', error);
        res.status(500).send('Server error');
    }
});

app.post('/profile/delete', isLoggedIn, async (req, res) => {
    const { id } = req.body;
    try {
        await taskModel.findOneAndDelete({ _id: id, userId: req.user.userid });
        res.redirect('/profile');
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Server error');
    }
});

app.get('/profile/download/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await taskModel.findOne({ _id: req.params.id, userId: req.user.userid });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        const filePath = path.join(__dirname, 'files', `${task.title}.txt`);
        fs.writeFile(filePath, task.details, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).send("Server error while writing file");
            }
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error while downloading file:', err);
                    return res.status(500).send("Server error while downloading file");
                } else {
                    console.log(`File ${task.title}.txt downloaded successfully`);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting file:', unlinkErr);
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error in /profile/download/:id route:', error);
        res.status(500).send('Server error');
    }
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});
