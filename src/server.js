import express from 'express';
import pg from 'pg';

const { Pool } = pg;

const connection = new Pool ({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
})

const server = express();
server.use(express.json());


server.get("/categories", async (req, res) =>{
   try{
        const categories =  await connection.query('SELECT * FROM categories');
        res.send(categories.rows);
    } catch(err){
        console.log(err);
    }
})

server.post("/categories", async (req, res) =>{
    const name = req.body.name
    try{
        const isNameUsed = await connection.query('SELECT name FROM categories WHERE name = $1', [name]);
        if(isNameUsed.rows.length !== 0){
            return res.sendStatus(409);
        }

        if(name === ""){
            return res.sendStatus(400);
        } 

        await connection.query('INSERT INTO categories (name) VALUES ($1)', [name]);
        res.sendStatus(201);

    } catch(err){
        console.log(err);
    }
})

server.get("/games", async (req, res) =>{
    try{
        const games =  await connection.query('SELECT * FROM games');
        res.send(games.rows);
    } catch(err){
        console.log(err);
    }
})
server.post("/games", async (req, res) =>{
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;
   
    try{
        const isNameUsed = await connection.query('SELECT name FROM games WHERE name = $1', [name]);
        if(isNameUsed.rows.length !== 0){
            return res.sendStatus(409);
        }

        if(name === "" || stockTotal < 1 || pricePerDay < 1){
            return res.sendStatus(400);
        }

        const isCategoryExistent = await connection.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
        if(isCategoryExistent.rows.length === 0){
            return res.sendStatus(400);
        }

        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', [name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);

    } catch(err){
        console.log(err);
    }
})


server.listen(4000, () => {
  console.log("server listening at 4000 ");
}); 