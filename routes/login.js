
const connection = require('../config');
const bcrypt = require('bcryptjs');

const authenticate = {
    signup: (req, res) => {
        res.render('signup', {message: ''});
    },
    login: (req, res) => {
        res.render('login', {message: ''});
    },
    loginGet: (req, res) => {
        if(req.session.authenticated) {
            const userInfo = req.session.userInfo[0];
            const details = {
                member_id : userInfo.member_id,
                member_username : userInfo.member_username,
                member_email : userInfo.member_email,
                member_picture: userInfo.member_picture
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
    
    },
    loginPost: (req, res) => {
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
    },
    addMember: (req, res) => {
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
    },
    settings: (req, res) => {
        if(req.session.authenticated) {
            const details = req.session.userInfo[0];
            let changeUsername = req.session.cannotChangeUsername ? req.session.cannotChangeUsername : '';
            let changeUsername1 = req.session.changedUsername ? req.session.changedUsername : '';
            req.session.cannotChangeUsername = '';
            req.session.changedUsername = '';
            res.render('settings', {details, changeUsername, changeUsername1});
            
        } else {
            res.redirect('/');
        }
    },
    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/');
    }
}

module.exports = authenticate;