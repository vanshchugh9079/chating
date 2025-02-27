import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let schema = new Schema({
    type:{
        type: String,
        enum: ["public", "private"], // Added "admin" type
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String, // Changed to String for better control over format
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        public_id: {
            type: String,
            default:Date.now(),
        },
        url: {
            type: String,
            default: "https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352156-stock-illustration-default-placeholder-profile-icon.jpg"
        }
    },
    follower: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    post:[{
        type: Schema.Types.ObjectId,
        ref: "Post"
    }],
    reel:[
        {
            type:Schema.Types.ObjectId,
            ref:"Reel"
        }
    ],
    token: {
        type: String,
    }
    ,
    request:[
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    notification:[
        {
            type: Schema.Types.ObjectId,
            ref: "Notification"
        }
    ],
    isOnline:{
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

// Hash password before saving, only if password field is modified
schema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    
    next();
});

// Compare passwords
schema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate JWT token
schema.methods.generateToken = async function () {
    const token = await jwt.sign(
        { id: this._id },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRY }
    );
    this.token = token;
    await this.save();
};
let User = model("User", schema);
export default User;
 