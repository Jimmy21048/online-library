
const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const socketIo = require('socket.io');
const http = require('http');


const app = express();


app.use(session({
    secret: 'ibook-library-session',
    resave: false,
    saveUninitialized: true
}));

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // port: process.env.PORT
});


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));



const server = http.createServer(app);
const io = socketIo(server);

// 
io.on('connection', (socket) => {
    console.log('client connected');

    socket.on('dataUpdate', (message) => {
        // console.log(message);
        connection.query("INSERT INTO community (member_id, chat) VALUES (?, ?)", [message.id, message.chat], (err) => {
            if(err) {
                console.log(err);
                return;
            }

            connection.query("SELECT community.member_id, member_username, chat FROM community INNER JOIN members ON community.member_id = members.member_id ORDER BY id ASC", (err, results) => {
                if(err) {
                    console.log(err);
                    return;
                }
                console.log(results);
                io.emit('dataUpdate', results);
            })
        })
    })
})

app.post('/borrowBook', (req, res) => {
    const di = req.body;
    const name = req.params.uname;
    const query = "INSERT INTO borrows (member_id, book_id, borrow_date) VALUES (?,?,CURDATE());";
    const values = [di.bookBorrower, di.bookBorrow];
    connection.query(query, values, (err) => {
        if(err) {
            console.log(err);
            return;
        }
    })
    
    res.redirect(`/logMember`);

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
                    req.session.adminAuthenticated = true;
                    res.redirect('library');
                } else {
                    return res.render('login', {message : "Invalid username or password!"});
                }
            })
            
        } else {
            let result =await bcrypt.compare(data.pwd, results[0].member_password);
            if(result) {
                req.session.authenticated = true;
                req.session.userInfo = results;
                return res.redirect(`/logMember`);
            } else {
                return res.render('login', {message : "Invalid username or password!"});
            }
        }
    })

})

app.get('/logMember', (req, res) => {
    if(req.session.authenticated) {
        const userInfo = req.session.userInfo[0];
        const details = {
            member_id : userInfo.member_id,
            member_username : userInfo.member_username,
            member_email : userInfo.member_email
        }
        const query0 = "SELECT book_id, book_name, book_count FROM books;";
        connection.query(query0, (err, allBooks) => {
            if(err) {
                console.log(err);
                return;
            }
            const query1 = "SELECT book_name, DATE_FORMAT(borrow_date, '%Y-%m-%d') as date_borrowed FROM borrows INNER JOIN books ON borrows.book_id = books.book_id WHERE member_id = ?;";
            const values1 = [userInfo.member_id];
            connection.query(query1, values1, (err, borrowedBooks) => {
                if(err) {
                    console.log(err);
                    return;
                }
                return res.render(`userClient`, {details, borrowedBooks, books: allBooks});
                        
            })
                    
        });
    } else {
        return res.redirect('/');
    }

});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
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
//look at
app.post('/addChat/:id', (req, res) => {
    const id = req.params.id;
    const dv = req.body;
    const query = "INSERT INTO community (member_id, community_name, chat) VALUES (?, ?, ?);";
    const values = [id, dv.uname, dv.text];
    connection.query(query, values, (err) => {
        if(err) {
            console.log(err);
            return;
        }

        res.redirect(`/community/${id}`);
    })
})

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
    if(req.session.adminAuthenticated) {
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
                res.render('library', {books: results, members: results1});
            })
        });
    } else {
        return res.redirect('/');
    }
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
        // console.log(results);
        res.render('book', {results});
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

app.get('/community/:id', (req, res) => {
    const id = req.params.id;

    const query = "SELECT community.member_id, member_username, chat FROM community INNER JOIN members ON community.member_id = members.member_id;";
    connection.query(query, (err, results) => {
        if(err) {
            console.log(err);
            return;
        }
        // console.log(results);
        const query1 = "SELECT member_username FROM members WHERE member_id =?";
        const values1 = [id];
        connection.query(query1, values1, (err, results1) => {
            if(err) {
                console.log(err);
                return;
            }
            // console.log(results1);
            let uname = "";
            results1.forEach((u) => {
                 uname = u.member_username;
            })
            // console.log(uname);
            res.render('community', {chats: results,uname, id});
        })
        
    })
})



app.use((req, res) => {
    res.status(404).render('404');
})

connection.connect((err) => {
    if(err) {
        console.log(err);
        return;
    }
    console.log('connected');
    server.listen(3000, () => {
        console.log('listening at port 3000');
    });
})