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
    try{
        await connection.query('INSERT INTO categories (name) VALUES ($1)', [req.body.name]);
        console.log(categories);
    } catch(err){
        console.log(err);
    }

})

server.get("/", async (req, res) =>{

})

server.get("/", async (req, res) =>{

})

server.get("/", async (req, res) =>{

})


server.listen(4000, () => {
  console.log("server listening at 4000 ");
}); 