import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },

  },
  {
    timestamps: true,
  }
);
userSchema.pre("save",async function(){
  if(!this.isModified('password')) return 
    this.password=await bcrypt.hash(this.password,10)
})

// Password compare method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const UserModel = mongoose.model("users", userSchema);

export default UserModel;