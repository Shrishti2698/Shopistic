import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name:{ // each user gonna have name
    type: String,
    required: [true, "Nmae is required"]  // for custom msg, use square brackets
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    cartItems: [  // array of objects
        {
            quantity: {
                type: Number,
                default: 1,
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        },
    ],
    role: {
        type: String,
        enum: ["customer", "admin"],  // user can have only these values; we'll see in this proj that who to make user "admin"
        default: "customer",
    },
},
{
    timestamps: true,
}
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
if (!this.isModified("password")) return next();   // remember middleware next()??

try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();   // then calling next function
} catch (error) {
    next(error);
}
});

// comparing the passwords
// becrypt not only hashes the password but it can also compare/match the passwords
userSchema.methods.comparePassword = async function (password) {
return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
