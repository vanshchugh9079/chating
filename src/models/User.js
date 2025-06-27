import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define the schema
const userSchema = new Schema({
    type: {
        type: String,
        enum: ["public", "private"],
        required: true,
        default: "public"
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        sparse: true
    },
    password: {
        type: String,
        select: false // Avoid sending password by default
    },
    avatar: {
        public_id: {
            type: String,
            default: () => Date.now().toString()
        },
        url: {
            type: String,
            default: "https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352156-stock-illustration-default-placeholder-profile-icon.jpg"
        }
    },
    follower: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    following: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    post: [{
        type: Schema.Types.ObjectId,
        ref: "Post"
    }],
    reel: [{
        type: Schema.Types.ObjectId,
        ref: "Reel"
    }],
    token: {
        type: String
    },
    request: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    notification: [{
        type: Schema.Types.ObjectId,
        ref: "Notification"
    }],
    savedPost: [{
        type: Schema.Types.ObjectId,
        ref: "Post"
    }],
    savedReel: [{
        type: Schema.Types.ObjectId,
        ref: "Reel"
    }],
    isOnline: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// 🔐 Hash password before saving (if modified)
userSchema.pre("save", async function (next) {
    if (this.isModified("password") && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// 🔐 Compare password
userSchema.methods.comparePassword = async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
};

// 🔐 Generate JWT token
userSchema.methods.generateToken = async function () {
    const token = jwt.sign(
        { id: this._id },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRY }
    );
    this.token = token;
    await this.save();
};

const User = model("User", userSchema);
export default User;
