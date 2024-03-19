const connection = require('../config');

const library = {
    libraryHome: (req, res) => {
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
    },
    libraryBook: (req, res) => {
        const id = req.params.id;

        const query = "SELECT book_name, book_author, book_lang, book_pages, book_year, book_rating, book_rating, book_subject, book_publisher, book_description, book_category FROM books WHERE book_id = ?;";
        const values = [id];
        connection.query(query, values, (err, results) => {
            if(err) {
                console.log(err);
                return;
            }
            res.render('book', {results});
        })
    },
    libraryUser: (req, res) => {
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
    }
}

module.exports = library;