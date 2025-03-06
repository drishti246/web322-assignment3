const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginHistory: [{
        dateTime: {
            type: Date,
            default: Date.now
        },
        userAgent: {
            type: String
        }
    }]
});

let User;

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.MONGO_DB_URI);
        db.on('error', (err) => reject(err));
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }
        bcrypt.hash(userData.password, 10)
            .then(hash => {
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save()
                    .then(() => resolve())
                    .catch(err => {
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject("There was an error creating the user: " + err);
                        }
                    });
            })
            .catch(err => reject("There was an error encrypting the password: " + err));
    });
};

module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .then(users => {
                if (users.length === 0) {
                    reject("Unable to find user: " + userData.userName);
                    return;
                }
                bcrypt.compare(userData.password, users[0].password)
                    .then(result => {
                        if (!result) {
                            reject("Incorrect Password for user: " + userData.userName);
                            return;
                        }
                        let user = users[0];
                        user.loginHistory.push({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent
                        });
                        user.save()
                            .then(() => resolve(user))
                            .catch(err => reject("There was an error verifying the user: " + err));
                    })
                    .catch(err => reject("Error comparing password: " + err));
            })
            .catch(() => reject("Unable to find user: " + userData.userName));
    });
};
