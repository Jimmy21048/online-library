const connection = require('../config');
const bcrypt = require('bcryptjs');

const community = {
    addChat: (req, res) => {
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
    },
    communityMember: (req, res) => {
        const id = req.params.id;

        const query = "SELECT community.member_id, member_username, chat FROM community INNER JOIN members ON community.member_id = members.member_id;";
        connection.query(query, (err, results) => {
            if(err) {
                console.log(err);
                return;
            }
            const query1 = "SELECT member_username FROM members WHERE member_id =?";
            const values1 = [id];
            connection.query(query1, values1, (err, results1) => {
                if(err) {
                    console.log(err);
                    return;
                }
                let uname = "";
                results1.forEach((u) => {
                     uname = u.member_username;
                })
                res.render('community', {chats: results,uname, id});
            })
            
        })
    },
    changeUsername: async (req, res) => {
        const data = req.body;
        const sessData = req.session.userInfo[0];
        let doChange = await bcrypt.compare(data.pwd,sessData.member_password);
        if(doChange) {
            const query = "UPDATE members SET member_username = ? WHERE member_id = ?;";
            const values = [data.uname, sessData.member_id];
            connection.query(query, values, (err) => {
                if(err) {
                    console.log(err);
                    return res.send("Could not update info");
                }
                connection.query("SELECT * FROM members WHERE member_id = ?", [sessData.member_id], (err, results) => {
                    if(err) {
                        console.log(err);
                        return res.send("Could not load data");
                    }
                    if(req.session.authenticated) {
                        req.session.userInfo = results;
                        req.session.changedUsername = "Username changed succesfully";
                        res.redirect('/settings');
                    }
                    
                })
                
            })
        } else {
            req.session.cannotChangeUsername = "Cannot change username, Check password!";
            res.redirect('/settings');
        }
    },
    deleteAccount: (req, res) => {
        const data = req.body;
        const sessData = req.session.userInfo[0];
    
        connection.query("SELECT member_password FROM members WHERE member_id = ? AND member_username = ?", [sessData.member_id, data.uname], async (err, result) => {
            if(err) {
                console.log(err);
                return res.send('Could not complete the operation');
            }
            
            const accMatch = await bcrypt.compare(data.pwd, result[0].member_password);
            if(accMatch) {
                connection.query("DELETE FROM members WHERE member_id = ?", [sessData.member_id], (err) => {
                    if(err) {
                        console.log(err);
                        return res.send('could not complete operation');
                    }
                    res.redirect('/logout');
                })
            }
        })
    },
    changeProfile: (req, res) => {

    },
    back: (req, res) => {
        res.redirect(`/logMember`);
    }
}

module.exports = community;