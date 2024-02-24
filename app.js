
const express = require('express');
const mysql = require('mysql');
require('dotenv').config();

const app = express();


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.PORT
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
    const query = "SELECT book_id, book_name FROM books;";
    connection.query(query, (err, results) => {
        if(err) {
            console.log(err);
            return;
        }
        const query1 = "SELECT member_fname, member_lname, member_id FROM members;";
        connection.query(query1, (err, results1) => {
            if(err) {
                console.log(err);
                return;
            }
            res.render('library', {books: results, members: results1});
        })
    });


})


//specific book page
app.get('/library/book/:id', (req, res) => {
    const id = req.params.id;

    const query = "SELECT book_name, book_author, book_lang, book_pages, book_year, book_rating, book_rating, book_subject, book_publisher, book_description, book_category FROM books WHERE book_id = ?;";
    const values = [id];
    connection.query(query, values, (err, results) => {
        if(err) {
            console.log(err);
            return;
        }
        res.render('book', {result : results});
    })

})

//specific user
app.get('/library/user/:id', (req, res) => {
    const id = req.params.id;

    const query = "SELECT * FROM members WHERE member_id = ?;";
    const values = [id];

    connection.query(query, values, (err, result) => {
        if(err) {
            console.log(err);
            return;
        }
        // console.log(result);
        res.render('user', {details: result});
    })
})

//regist users
app.post('/addMember', (req, res) => {
    const data = req.body;

    const query0 = "SELECT member_fname, member_lname, member_national_id FROM members WHERE member_national_id = ?;";
    const values0 = [data.userId];
    connection.query(query0, values0, (err, result) => {
        if(err) {
            console.log(err);
            return;
        }
        if(result.length === 0) {
            const query = "INSERT INTO members (member_fname, member_lname, member_email, member_national_id) VALUES (?, ?, ?, ?);";
            const values = [data.userFname, data.userLname, data.userEmail, data.userId];
            connection.query(query, values, (err) => {
                if(err) {
                    console.log(err);
                    return;
                }
                
            })
        
            const query1 = "SELECT member_fname, member_lname, member_id FROM members WHERE member_fname = ? AND member_email = ?;";
            const values1 = [data.userFname, data.userEmail];
            connection.query(query1, values1, (err, result) => {
                if(err) {
                    console.log(err);
                    return;
                }
                res.render('regist', {details: result, userExists: 0});
            })
            // connection.end();
        } else {
            res.render('regist', {details: result, userExists: 1});
        }
    })


})

app.post('/addBook', (req, res) => {
    // console.log(req.body);
    const id0 = req.body;
    const query = "SELECT * FROM books WHERE book_id = ?;";
    const values0 = [id0.bKey];
    connection.query(query, values0,(err, results) => {
        if(results.length >0) {
            res.redirect('library');
        }
        else {
            const query1 = "INSERT INTO books (book_id, book_name, book_author, book_lang, book_pages, book_year, book_rating, book_publisher, book_description,book_category) VALUES (?,?,?,?,?,?,?,?,?,?);";
            const dr = req.body;
            const values = [dr.bKey, dr.bName, dr.author, dr.lang, dr.pages, dr.year, dr.rating, dr.publisher, dr.description, dr.category];
            connection.query(query1,values,(err) => {
                if(err) {
                    console.log(err);
                    return;
                }
                res.redirect('library');
            })
        }
    })


})
app.use((req, res) => {
    res.status(404).render('404');
})