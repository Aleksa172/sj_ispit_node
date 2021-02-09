const express = require('express');
const mysql = require('mysql');

// Koristimo pool da bi automatski aquire-ovao i release-ovao konekcije
const pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'skript2_aleksasmi'
});

// Instanciramo ruter
const route = express.Router();

function makeErrorResponse(msg) {
    return {
        result: 'err',
        msg: msg
    }
}

function makeSuccessResponse(data) {
    return {
        result: 'ok',
        data
    }
}

// Middleware da parsira json request-ove
route.use(express.json());

route.get("/gamestats", (req, res) => {
    pool.query('SELECT * FROM games_game', (err, rows) => {
        res.send(makeSuccessResponse(rows))
    })
})

module.exports = route;