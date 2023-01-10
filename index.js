const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');

app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


let guser = "NOT logged in";

mongoose.connect("mongodb://localhost:27017/TodoApp", {
  useNewUrlParser: "true",
})
mongoose.connection.on("error", err => {
  console.log("err", err)
})
mongoose.connection.on("connected", (err, res) => {
  console.log("mongoose is connected")
})

const dataschema = new mongoose.Schema({ username: String, password: String,todos:[{type:String}] });
const data = mongoose.model('data', dataschema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'main.html'));
})

app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'login.html'));
})

app.post('/login',async(req,res)=>{
    const {username , password} = req.body;
    const user = await data.findOne({ username : username , password:password});
    if(user){
        guser = user.username;
        gpass = user.password;
        res.redirect('/app');
    }else{
        const erru = "Wrong input try again";
        res.render("other.ejs",{erru});
    }
})

app.post('/register',async(req,res)=>{
    const {username , password} = req.body;
    const user = await data.findOne({ username : username });
    if(user){
        const erru = "USER ALREADY EXISTS";
        res.render('other.ejs',{erru}); //fix this 
    }else{
        const erru = "ACCOUNT CREATED";
        res.render('other.ejs', {erru});
        data.insertMany({username : username,password:password});
    }
})

app.get('/register',(req,res)=>{
    res.sendFile(path.join(__dirname,'register.html'));
})

app.get('/app',(req,res)=>{
    res.render('app.ejs',{guser});
})

app.post('/app',async(req,res)=>{
    res.render('app.ejs' , {guser});
    const {task} = req.body;
    const check = await data.findOneAndUpdate({username:guser} , {$push:{todos:task}});
})

app.get('/show',async(req,res)=>{
    const showdata = await data.find({username:guser});
    const alen = showdata[0].todos.length;
    res.render('show.ejs',{showdata , alen , guser});
    // console.log(showdata[0].todos);
});

app.get('/remove/:id',async(req,res)=>{
    const remid = req.params.id;
    let remdata = await data.findOne({username:guser});
    remdata.todos.splice(remid,1);
    const remdata2 = remdata.todos;
    await data.replaceOne({username:guser},{todos:remdata2,username:guser,password:gpass});
    // console.log(remdata2);
    res.redirect("/show");
})

app.get('/logout',(req,res)=>{
    guser = 'NO USER';
    res.redirect("/");
})

app.get("/changepassword",(req,res)=>{
      res.render("change.ejs",{guser});
})

app.post('/changepassword',async(req,res)=>{
    if(guser==="NOT logged in"){
        res.redirect('/');
    }else if(guser===req.body.username){
        await data.replaceOne({username:req.body.username},{username:guser,password:req.body.password});
        res.redirect("/app");
    }else{
        res.redirect("/");
    }
})


app.listen(3000);