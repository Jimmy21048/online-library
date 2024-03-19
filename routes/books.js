const connection = require('../config');
const books = {
    addBook: (req, res) => {
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
    
    },
    borrowBook: (req, res) => {
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
    },
    addCopy: (req, res) => {
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
    }
}

module.exports = books;