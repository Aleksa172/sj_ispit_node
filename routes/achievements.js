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

route.get("/most-owned-games", (req, res) => {
    pool.query(`SELECT game_id, games_game.name, COUNT(games_game.id) as own_count FROM players_playeruser_games
        INNER JOIN games_game ON (games_game.id = players_playeruser_games.game_id)
        GROUP BY game_id
        ORDER BY COUNT(games_game.id) DESC`, (err, rows) => {
            res.send(makeSuccessResponse(rows))
        })
})

route.get("/hardest-achievements", (req, res) => {
    pool.query(`SELECT skript2_aleksasmi.games_achievement.id, skript2_aleksasmi.games_achievement.name, skript2_aleksasmi.games_achievement.game_id, COUNT(skript2_aleksasmi.games_achievement.id) as obtained_count FROM skript2_aleksasmi.games_achievement
    LEFT JOIN players_playeruser_achievements ON ( games_achievement.id = players_playeruser_achievements.achievement_id)
    GROUP BY skript2_aleksasmi.games_achievement.id
    ORDER BY COUNT(skript2_aleksasmi.games_achievement.id) ASC`, (err, rows) => {
        res.send(makeSuccessResponse(rows))
    })
})

module.exports = route;