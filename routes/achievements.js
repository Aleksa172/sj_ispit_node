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

// Namerno ne prikazujemo igre koje nemaju vlasnike
route.get("/most-owned-games", (req, res) => {
    pool.query(`SELECT game_id as id, games_game.name, COUNT(players_playeruser_games.playeruser_id) as own_count FROM players_playeruser_games
        INNER JOIN games_game ON (games_game.id = players_playeruser_games.game_id)
        GROUP BY game_id
        ORDER BY COUNT(players_playeruser_games.playeruser_id) DESC`, (err, rows) => {
            res.send(makeSuccessResponse(rows))
        })
})

route.get("/hardest-achievements", (req, res) => {
    pool.query(`SELECT skript2_aleksasmi.games_achievement.id, skript2_aleksasmi.games_achievement.name, skript2_aleksasmi.games_achievement.game_id, COUNT(players_achiobtained.achievement_id) as obtained_count FROM skript2_aleksasmi.games_achievement
    LEFT JOIN players_achiobtained ON ( games_achievement.id = players_achiobtained.achievement_id)
    GROUP BY skript2_aleksasmi.games_achievement.id
    ORDER BY COUNT(players_achiobtained.achievement_id) ASC`, (err, rows) => {
        res.send(makeSuccessResponse(rows))
    })
})

route.get("/least-owned-games", (req, res) => {
    var limit = 5;
    if(req.query.limit) {
        // Validiramo limit
        // mora biti broj
        var queryLimit = parseInt(req.query.limit);
        // Poslat besmislen parametar - vrati gresku
        if(isNaN(queryLimit)) {
            res.send(makeErrorResponse('limit must be a valid integer number'));
            return;
        }
        limit = queryLimit;
    }

    pool.query(`SELECT games_game.id, games_game.name, COUNT(players_playeruser_games.playeruser_id) as own_count FROM games_game
        LEFT JOIN players_playeruser_games ON (games_game.id = players_playeruser_games.game_id)
        GROUP BY games_game.id
        ORDER BY COUNT(players_playeruser_games.playeruser_id) ASC
        LIMIT `+limit, (err, rows) => {
            res.send(makeSuccessResponse(rows))
        })
})

module.exports = route;