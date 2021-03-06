'use strict';

var mongoose = require('mongoose');

var BankAccountSchema = mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    pin: {
        type: Number,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 100.00
    },
    transferHistory: [String]
});

var BankAccount = mongoose.model('BankAccount', BankAccountSchema);

module.exports = BankAccount;
