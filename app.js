const express = require("express");
const multer = require("multer");
const fs = require("fs");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const port = 3000;


mongoose.connect("mongodb+srv://gisilberhart:thermodynamics@cluster0.jgwzl0f.mongodb.net/")
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));
db.once('open', () => console.log('connected to MongoDB'));

const path = require("path");

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


const imageSchema = new mongoose.Schema({
    name: String,
    data: Buffer,
    contentType: String
});

const Image = mongoose.model('images', imageSchema);

const storage = multer.memoryStorage();
const upload = multer({storage: storage});



let homeImages = [];

//dashboard
app.get("/admin/dashboard", async(req, res) => {

    try {
        const images = await Image.find();
        const base64Images = images.map(image => {
            return {
                name: image.name,
                data: `data:${image.contentType};base64,${image.data.toString('base64')}`
            };
        });

       
        res.render('dashboard', {images: base64Images})

    }catch(err) {
        console.error('Error fetching images: ', err);
        res.status(500).send("Internal Server Error")

    }

});

//upload an image
app.post('/upload', upload.single('image'), (req, res) => {

    const newImage = new Image({
        name: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype
    });

    newImage.save()
        .then((newImage) => {
            console.log("image saved")
        })
        .catch((err) => {
            console.log(err)
    });

    const base64 = {
        name: newImage.name,
        data: `data:${newImage.contentType};base64,${newImage.data.toString('base64')}`
    };

    homeImages.push(base64);
    return;


       
});
//home page
app.get('/homeImages', async (req, res) => {
    try {
        if (homeImages.length == 0) {
            const images = await Image.find();
            homeImages = images.map(image => {
            return {
                name: image.name,
                data: `data:${image.contentType};base64,${image.data.toString('base64')}`
            };
        });
        }
        res.render('index', {images: homeImages})
        //res.status(200).send(homeImages);

    }catch(err) {
        console.error('Error fetching images: ', err);
        res.status(500).send("Internal Server Error")

    }

});
app.get("/delete/:name", async(req, res) => {
    homeImages = homeImages.filter(image => {
        return image.name !== req.params.name;
    });
        await Image.findOneAndDelete({name: req.params.name});
        console.log(homeImages.length);
        res.status(200).send({"message": `${req.params.name} deleted`});


    

});
//contact
app.get("/contact", (req, res) => {
    res.render('contact')
});
app.listen(port, () => {
    console.log("up and listening on 3000");
});

