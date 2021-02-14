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

    pool.query(`SELECT skript2_aleksasmi.games_achievement.id, skript2_aleksasmi.games_achievement.name, skript2_aleksasmi.games_achievement.game_id, games_game.name as game_name, COUNT(players_achiobtained.achievement_id) as obtained_count FROM skript2_aleksasmi.games_achievement
    LEFT JOIN players_achiobtained ON ( games_achievement.id = players_achiobtained.achievement_id)
    INNER JOIN games_game ON ( games_game.id = games_achievement.game_id )
    GROUP BY skript2_aleksasmi.games_achievement.id
    ORDER BY COUNT(players_achiobtained.achievement_id) ASC, skript2_aleksasmi.games_achievement.id DESC
    LIMIT `+limit, (err, rows) => {
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

route.get("/most-popular-dates-achievements", (req, res) => {
    // Ako nema argumenata - uzmi trenutni mesec i godinu
    var now = new Date();
    var selectedMonth = now.getMonth()+1
    var selectedYear = now.getFullYear();

    // Ako imamo podatke - moramo ih validirati
    // Uzecemo u obzir samo ako su oba stigla
    if(req.query.month && req.query.year) {
        // Validiramo selectedMonth
        // mora biti broj
        var querySelectedMonth = parseInt(req.query.month);
        // Poslat besmislen parametar - vrati gresku
        if(isNaN(querySelectedMonth) || querySelectedMonth<1 || querySelectedMonth>12) {
            res.send(makeErrorResponse('month must be a valid month'));
            return;
        }
        selectedMonth = querySelectedMonth;

        var querySelectedYear = parseInt(req.query.year);
        // Poslat besmislen parametar - vrati gresku
        if(isNaN(querySelectedYear)) {
            res.send(makeErrorResponse('yeat must be a valid year'));
            return;
        }
        selectedYear = querySelectedYear;

        
    }
    

    var endMonth = selectedMonth+1;
    var endYear  = selectedYear
    if(endMonth>12) {
        endMonth=1
        endYear++;
    }

    pool.query(`SELECT DATE(dateachieved) as date, COUNT(id) as achievements_obtained FROM skript2_aleksasmi.players_achiobtained
        WHERE dateachieved>'${selectedYear}-${selectedMonth}-01' AND dateachieved<'${endYear}-${endMonth}-01'
        GROUP BY DATE(dateachieved)`, (err, rows) => {
            res.send(makeSuccessResponse(rows))
        })
})

route.get("/players-with-most-games", (req, res) => {

    pool.query(`SELECT auth_user.id, auth_user.username, COUNT(players_playeruser_games.game_id) as owned_games FROM auth_user
    INNER JOIN players_playeruser ON (auth_user.id = players_playeruser.id)
    INNER JOIN skript2_aleksasmi.players_playeruser_games ON (players_playeruser_games.playeruser_id = players_playeruser.id)
    GROUP BY auth_user.id
    ORDER BY COUNT(players_playeruser_games.game_id) DESC
    LIMIT 5`, (err, rows) => {
        res.send(makeSuccessResponse(rows))
    })
})

module.exports = route;