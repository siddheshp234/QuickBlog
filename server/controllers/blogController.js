/* import fs from 'fs'
import imagekit from '../configs/imageKit.js';
import Blog from '../models/Blog.js';

export const addBlog = async (req, res)=> {
    try{
        const {title, subTitle, description, category, isPublished} = JSON.parse(req.body.blog);
        const imageFile = req.file;

        //Check if all fields are present
        if(!title || !description || !category || !imageFile){
            return res.json({success: false, message: "Missing required fields" })
        }

        const fileBuffer = await fs.readFileSync(imageFile.path)

        //Upload Image to ImageKit
        const response = await imagekit.upload({
            file: fileBuffer, 
            fileName: imageFile.originalname,
            folder: "/blogs"
        })

        // optimization through imagekit URL tranformation
        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                {quality: 'auto'}, //Auto compression
                {format: 'webp'}, // Convert to modern format
                {width: '1280'} // Width resizing
            ]
        });

        const image = optimizedImageUrl;

        await Blog.create({title, subTitle, description, category, image, isPublished})

        res.json({success: true, message: "Blog added successfully"})

    }catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}
    */
// blogController.js
// blogController.js
// blogController.js
import mongoose from "mongoose";
import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Blog from '../models/Blog.js';
import Comment from "../models/Comment.js";
import main from "../configs/gemini.js";

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const addBlog = async (req, res) => {
    try {
        // Ensure blog data exists
        if (!req.body.blog) {
            return res.status(400).json({ success: false, message: "Blog data is missing" });
        }

        // Parse JSON safely
        let blogData;
        try {
            blogData = JSON.parse(req.body.blog);
        } catch {
            return res.status(400).json({ success: false, message: "Invalid blog JSON" });
        }

        const { title, subTitle, description, category, isPublished } = blogData;
        const imageFile = req.file;

        // Validate required fields
        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Validate uploaded file
        if (!imageFile || !imageFile.path) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded or file field name is incorrect"
            });
        }

        // Read file buffer
        const fileBuffer = await fs.promises.readFile(imageFile.path);

        // Upload to ImageKit
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/blogs'
        });

        // Get optimized URL
        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                { quality: 'auto' },
                { format: 'webp' },
                { width: '1280' }
            ]
        });

        // Save blog in MongoDB
        const blog = await Blog.create({
            title,
            subTitle,
            description,
            category,
            image: optimizedImageUrl,
            isPublished
        });

        // Delete local file after upload
        fs.unlink(imageFile.path, (err) => {
            if (err) console.error('Failed to delete local file:', err);
        });

        res.json({ success: true, message: 'Blog added successfully', blog });

    } catch (error) {
        console.error('Add blog error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/* export const getALLBlogs = async (req, res)=>{
    try {
        const blogs = await Blog.find({isPublished: true})
        res.json({ success: true, blogs })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}
    */

export const getALLBlogs = async (req, res) => {
    try {
        // Fetch all blogs (admin needs to see everything)
        const blogs = await Blog.find().sort({ createdAt: -1 }); // newest first

        res.json({
            success: true,
            blogs: Array.isArray(blogs) ? blogs : [] // always return array
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


export const getBlogById = async (req,res)=>{
    try{
        const { blogId } = req.params;
        const blog = await Blog.findById(blogId)
        if(!blog){
            return res.json({ success: false, message: "Blog not found"});
        }
        res.json({ success: true, blog })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
} 

export const deleteBlogById = async (req,res)=>{
    try{
        const { id } = req.body;
        await Blog.findByIdAndDelete(id);

        //Delete all comments on this blog
        await Comment.deleteMany({blog: id});

        res.json({ success: true, message: 'Blog deleted successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
} 

export const togglePublish = async (req, res) => {
    try{
        const{ id } = req.body;
        const blog = await Blog.findById(id);
        blog.isPublished = !blog.isPublished;
        await blog.save();
        res.json({ success: true, message: 'Blog status updated' })
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const addComment = async (req, res) =>{
    try{
        const {blog, name, content } = req.body;
        await Comment.create({blog, name, content});
        res.json({success: true, message: 'Comment added for review'})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

/*
export const getBlogComments = async (req, res) =>{
    try{
        const {blogId } = req.body;
        const comments = await Comment.find({blog: blogId, isApproved: true}).sort({createdAt: -1});
        res.json({ success: true, comments }) 
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}
*/
export const getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.body;
        const comments = await Comment.find({
            blog: blogId,
            isApproved: true
        }).sort({ createdAt: -1 }); // ✅ fixed typo

        res.json({ success: true, comments }); // ✅ res.json not req.json
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/*
export const generateContent = async (req, res)=>{
    try {
        const {prompt} = req.body;
        const content = await main(prompt + 'Generate a blog content for this topic in simple text format')
        res.json({success: false, content})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}
*/
export const generateContent = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        const content = await main(
            prompt + " Generate a blog content for this topic in simple text format"
        );

        res.json({ success: true, content });
    } catch (error) {
        console.error("GenerateContent error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
