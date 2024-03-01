
const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // port: process.env.PORT
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

app.get('/signup', (req, res) => {
    res.render('signup', {message: ''});
})
app.get('/login', (req, res) => {
    res.render('login', {message: ''});
})

let myBooks = [];
app.get('/library',(req, res) => {
    const query = "SELECT book_id, book_name, book_count FROM books;";
    connection.query(query, (err, results) => {
        if(err) {
            console.log(err);
            return;
        }
        const query1 = "SELECT member_username, member_id FROM members;";
        connection.query(query1, (err, results1) => {
            if(err) {
                console.log(err);
                return;
            }
            myBooks = results;
            // console.log(results1);
            res.render('library', {books: results, members: results1});
        })
    });


})


//specific book page
app.get('/library/book/:id', (req, res) => {
    const id = req.params.id;
    // console.log(myBooks);

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

    const query = "SELECT member_id, member_username, member_email FROM members WHERE member_id = ?;";
    const values = [id];

    connection.query(query, values, (err, result) => {
        if(err) {
            console.log(err);
            return;
        }
        const query1 = "SELECT book_name, DATE_FORMAT(borrow_date, '%Y-%m-%d') as date_borrowed FROM borrows INNER JOIN books ON borrows.book_id = books.book_id WHERE member_id = ?;";
        const values1 = [id];
        connection.query(query1, values1, (err, result1) => {
            if(err) {
                console.log(err);
                return;
            }
            res.render('user', {details: result, books: myBooks, booksBorrowed: result1});
        })

    })
})
app.post('/borrowBook', (req, res) => {
    const di = req.body;

    const query = "INSERT INTO borrows (member_id, book_id, borrow_date) VALUES (?,?,CURDATE());";
    const values = [di.bookBorrower, di.bookBorrow];
    connection.query(query, values, (err) => {
        if(err) {
            console.log(err);
            return;
        }
    })
    res.redirect('/login');

})

//regist users
app.post('/addMember', (req, res) => {
    const data = req.body;
    const query = "SELECT member_username FROM members WHERE member_email = ?;";
    const values = [data.userEmail];
    connection.query(query, values, async (err, results) => {
        if(err) {
            console.log(err);
            return;
        }

        if(results.length > 0) {
            return res.render('signup', {message: 'This email is already registered!'});
        }
        else if(data.pwd !== data.pwdConfirm) {
            return res.render('signup', {message: 'Passwords do not match!'});
        }
        else if(data.pwd.length < 5) {
            return res.render('signup', {message: 'Password must be more than 5 characters!'});
        } else {

            let hashedPassword = await bcrypt.hash(data.pwd, 8);
            const query1 = "INSERT INTO members (member_username, member_email, member_password) VALUES (?, ?, ?);";
            const values1 = [data.userName, data.userEmail, hashedPassword];
            connection.query(query1, values1, (err) => {
                if(err) {
                    console.log(err);
                    return;
                }
                return res.render('login', {message: 'Sign up succesful, Login'});
            })
        }
        

        
    })
})

app.post('/logMember', (req, res) => {
    const data = req.body;
    
    const query = "SELECT * FROM members WHERE member_email = ? OR member_username = ?;";
    const values = [data.userEmail, data.userEmail];
    connection.query(query, values, async (err, results) => {
        if(err) {
            console.log(err);
            return;
        }

        if(results.length < 1) {
            const queryAdmin = "SELECT username FROM admin WHERE username = ? AND pwd = ?;";
            const valuesAdmin = [data.userEmail, data.pwd];
            connection.query(queryAdmin, valuesAdmin, (err, resultAdmin) => {
                if(err) {
                    console.log(err);
                    return;
                }
      
                if(resultAdmin.length > 0) {
                    res.redirect('library');
                } else {
                    return res.render('login', {message : "Invalid username or password!"});
                }
            })
            
        } else {
            let result =await bcrypt.compare(data.pwd, results[0].member_password);
            if(result) {

                const query = "SELECT book_id, book_name, book_count FROM books;";
                connection.query(query, (err, allBooks) => {
                    if(err) {
                        console.log(err);
                        return;
                    }

                    const query1 = "SELECT book_name, DATE_FORMAT(borrow_date, '%Y-%m-%d') as date_borrowed FROM borrows INNER JOIN books ON borrows.book_id = books.book_id WHERE member_id = ?;";
                    const values1 = [results[0].member_id];
                    connection.query(query1, values1, (err, borrowedBooks) => {
                        if(err) {
                            console.log(err);
                            return;
                        }
                        return res.render('userClient', {details: results[0], borrowedBooks, books: allBooks});
                    })
                });
               
            } else {
                return res.render('login', {message : "Invalid username or password!"});
            }
        }
    })

})

app.post('/addBook', (req, res) => {
    const id0 = req.body;
    const query = "SELECT * FROM books WHERE book_id = ?;";
    const values0 = [id0.bKey];
    connection.query(query, values0,(err, results) => {
        if(results.length >0) {
            res.redirect('library');
        }
        else {
            const query1 = "INSERT INTO books (book_id, book_name, book_author, book_lang, book_pages, book_year, book_rating, book_publisher, book_count, book_description,book_category) VALUES (?,?,?,?,?,?,?,?,?,?,?);";
            const dr = req.body;
            const values = [dr.bKey, dr.bName, dr.author, dr.lang, dr.pages, dr.year, dr.rating, dr.publisher, 1, dr.description, dr.category];
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
app.post("/addCopy", (req, res) => {
    // console.log(req.body);
    const di = req.body;
    const query = "UPDATE books SET book_count = ? WHERE book_id = ?;";
    const values = [di.bookNum, di.selectBook];
    connection.query(query, values, (err) => {
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