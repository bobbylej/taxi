"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Mongoose = require("mongoose");
const Bcrypt = require("bcryptjs");
exports.UserSchema = new Mongoose.Schema({
    email: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true }
}, {
    timestamps: true
});
function hashPassword(password) {
    if (!password) {
        return null;
    }
    return Bcrypt.hashSync(password, Bcrypt.genSaltSync(8));
}
exports.UserSchema.methods.validatePassword = function (requestPassword) {
    return Bcrypt.compareSync(requestPassword, this.password);
};
exports.UserSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    user.password = hashPassword(user.password);
    return next();
});
exports.UserSchema.pre('findOneAndUpdate', function () {
    const password = hashPassword(this.getUpdate().$set.password);
    if (!password) {
        return;
    }
    this.findOneAndUpdate({}, { password: password });
});
exports.UserModel = Mongoose.model('User', exports.UserSchema);
//# sourceMappingURL=user.js.map