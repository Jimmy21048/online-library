const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookSchema = new Schema({
    bookName : String,
    bookPublisher : String
},{timestamps: true});

const Book = mongoose.model('book', bookSchema);
module.exports = Book;