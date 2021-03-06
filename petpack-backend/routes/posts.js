const express = require('express')
const router = express.Router();
const multer = require('multer');
const checkAuth =require("../middleware/check-auth");

const Post = require('../models/post');
const { route } = require('./user');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid mime type");
        if (isValid){
            error = null;
        }
        cb(error, "backend/images");
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name+ '-' + Date.now() + '.' + ext);
    }
});

router.post("", checkAuth, multer({storage: storage}).single("image"), (req, res, next) => {
    
    var imagePathString ='';
    if(req.file!=null){
        const url = req.protocol + '://' + req.get("host");
        imagePathString = url + "/images/" + req.file.filename
    }

    console.log(req.body.timeStamp);
    const post = new Post({
        timeStamp: req.body.timeStamp,
        content: req.body.content,
        imagePath: imagePathString,
        creator: req.userData.userId,
        creatorUsername: req.userData.userName,
        postAvatar: req.body.postAvatar
    });
    post.save().then(createdPost =>{
       res.status(201).json({
            message: 'Post added successfuly!',
            post: {
                ...createdPost,
                id: createdPost._id
            }
        });
    });
});


router.put("/:id", checkAuth,
    multer({storage: storage}).single("image"), 
    (req, res, next) => {
        let imagePath = req.body.imagePath;
        if(req.file) {
            const url = req.protocol + '://' + req.get("host");
            imagePath = url + "/images/" + req.file.filename
        }
        const post = new Post({
            _id: req.body.id,
            title: req.body.title,
            content: req.body.content,
            imagePath: imagePath,
            creator: req.userData.userId,
            creatorUsername: req.userData.userName,
        });
        
        Post.updateOne({_id: req.params.id, creator: req.userData.userId }, post).then(result => {
            if (result.nModified>0){
                res.status(200).json({message: "Update successful"});
            } else {
                res.status(401).json({message: "Not authorized"});
            }

    });
})



router.get("", (req, res, next )=> {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const postQuery = Post.find().sort({timeStamp :-1});
    let fetchedPosts;
    if (pageSize && currentPage) {
        postQuery
            .skip(pageSize * (currentPage - 1))
            .limit(pageSize);
    }
    postQuery
        .then(documents =>{
            fetchedPosts =documents;
            return Post.countDocuments();
        }).then(count => { 
            res.status(200).json({
                message: 'Posts fetched succesfully',
                posts: fetchedPosts,
                maxPosts: count
        });
    });
});

router.get("/users", (req, res , next) => {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const username = req.query.username;
    const postQuery = Post.find({creatorUsername: username}).sort({timeStamp :-1});
    let fetchedPosts;
    if (pageSize && currentPage) {
        postQuery
            .skip(pageSize * (currentPage - 1))
            .limit(pageSize);
    }
    postQuery
        .then(documents =>{
            fetchedPosts =documents;
            return Post.countDocuments();
        }).then(count => { 
            res.status(200).json({
                message: 'Posts fetched succesfully',
                posts: fetchedPosts,
                maxPosts: count
        });
    });
})


router.get("/:id", (req, res, next) => {
    Post.findById(req.params.id).then(post => {
        if (post) {
             res.status(200).json(post);
        } else {
            res.status(404).json({ message: 'Post not found'});
        }
    });
});

router.delete("/:id", checkAuth, (req, res, next) => {
    Post.deleteOne({_id: req.params.id, creator: req.userData.userId}).then(results => {
        if (results.n >0){
            res.status(200).json({message: "Deletion successful"});
        } else {
            res.status(401).json({message: "Not authorized"});
        }
    });
});

module.exports = router;