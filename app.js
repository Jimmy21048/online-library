
const express = require('express');
const mongoose = require('mongoose');
const Book = require('./models/Books');
const mysql = require('mysql');

const app = express();


const connection = mysql.createConnection({
    host: "behzkxx5kjeqbtk0abwj-mysql.services.clever-cloud.com",
    port: "3306",
    user: "uz3lpolek6uahs2r",
    password: "uz3lpolek6uahs2r",
    database: "behzkxx5kjeqbtk0abwj"
});
connection.connect((err) => {
    if(err) {
        console.log(err);
        return;
    }
    console.log('connected');
    app.listen(3000);
})

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.render('home');
})
app.get('/library',(req, res) => {
    const query = "SELECT book_name, book_publisher, COUNT(*) AS book_count FROM books GROUP BY book_name;";
    connection.query(query, (err, results) => {
        if(err) {
            console.log(err);
            return;
        }
        res.render('library', {books: results});
    });
})

app.post('/addBook', (req, res) => {
    const query = "INSERT INTO books (book_name, book_publisher) VALUES (?,?);";
    const dr = req.body;
    const values = [`${dr.bookName}`, `${dr.bookPublisher}`];
    connection.query(query,values,(err) => {
        if(err) {
            console.log(err);
            return;
        }
        res.redirect('library');
    })
})
app.use((req, res) => {
    res.status(404).render('404');
})