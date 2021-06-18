import express from 'express';
import pg from 'pg';
import Joi from 'joi';
import dayjs from 'dayjs';


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

    //  FAZER ROLE DE PARAMETRO NA QUERY STRING

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

server.get("/customers", async (req, res) =>{
    //  FAZER ROLE DE PARAMETRO NA QUERY STRING

    try{
        const customers =  await connection.query('SELECT * FROM customers');
        res.send(customers.rows);
    } catch(err){
        console.log(err);
    }
})

server.get("/customers/:id", async (req, res) =>{
    const id = req.params.id;

    try{
        const customers =  await connection.query('SELECT * FROM customers WHERE id = $1' ,[id]);
        if(customers.rows.length === 0){
            res.sendStatus(404)
        } else {
            res.send(customers.rows);
        }
    } catch(err){
        console.log(err);
    }
})

server.post("/customers", async (req, res) =>{
    const name = req.body.name;
    const phone = parseInt(req.body.phone);
    const cpf = parseInt(req.body.cpf);
    const birthday = req.body.birthday;

    const schema = Joi.object({
        name: Joi.string().required(),
        cpf: Joi.string().length(11).required(),
        phone: Joi.string().min(10).max(11).required(),
        birthday: Joi.date().less('now').required(),
    })

    const validation = schema.validate(req.body)

    if(!validation.error){
        try{
            const isCpfUsed = await connection.query('SELECT cpf FROM customers WHERE cpf = $1', [cpf]);
            if(isCpfUsed.rows.length !== 0){
                return res.sendStatus(409);
            }
          
            await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)', [name, phone, cpf, birthday]);
            res.sendStatus(201);
    
        } catch(err){
            console.log(err);
        }
    } else{
        res.sendStatus(400);
    }   
})

server.put("/customers/:id", async (req, res) =>{
    const id = req.params.id;
    const name = req.body.name;
    const phone = parseInt(req.body.phone);
    const cpf = parseInt(req.body.cpf);
    const birthday = req.body.birthday;

    const schema = Joi.object({
        name: Joi.string().name().required(),
        cpf: Joi.string().length(11).required(),
        phone: Joi.string().min(10).max(11).required(),
        birthday: Joi.date().less('now').required(),
    })

    const validation = schema.validate(req.body)

    if(!validation.error){
        try{
            const isCpfUsed = await connection.query('SELECT cpf FROM customers WHERE cpf = $1', [cpf]);
            if(isCpfUsed.rows.length !== 0){
                return res.sendStatus(409);
            }

            await connection.query('UPDATE customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)', [name, phone, cpf, birthday]);
            res.sendStatus(200);

        } catch(err){
            console.log(err);
        }
    } else{
        res.sendStatus(400);

    }
})

server.get("/rentals", async (req, res) =>{

    try{
        const rentals =  await connection.query('SELECT * FROM rentals');
        res.send(rentals.rows);
    } catch(err){
        console.log(err);
    }
    
})

server.post("/rentals", async (req, res) =>{
    const {customerId, gameId, daysRented } = req.body
    const rentDate = dayjs();
    const originalPrice = (15000*daysRented);
    const returnDate = null;
    const delayFee = null;
    

    const isCustomerExistent = await connection.query('SELECT id FROM customers WHERE id = $1', [customerId]);
    if(isCustomerExistent.rows.length === 0){
        return res.sendStatus(400);
    }

    const isGameExistent = await connection.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if(isGameExistent.rows.length === 0){
        return res.sendStatus(400);
    }

    if(daysRented < 1 ){
        return res.sendStatus(400);
    }

    try{    
        await connection.query('INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)', [customerId, gameId, daysRented, rentDate, originalPrice, returnDate, delayFee]);
        res.sendStatus(201);

    } catch(err){
        console.log(err);
    }
})

server.post("/rentals/:id/return", async (req,res) =>{
    const id = req.params.id;
    const returnDate = dayjs();

    const isRentalExistent = await connection.query('SELECT id FROM rentals WHERE id = $1', [id]);
    if(isRentalExistent.rows.length === 0){
        return res.sendStatus(404);
    }

    const paidRental = await connection.query('SELECT * FROM rentals WHERE id = $1', [id]);
    if(paidRental.rows.returnDate !== null){
        return res.sendStatus(400);
    }

    try{    
        await connection.query(`UPDATE rentals SET "returnDate" = $1 WHERE id = $2`, [returnDate, id]);
        res.sendStatus(201);

    } catch(err){
        console.log(err);
    }
})

server.delete("/rentals/:id", async (req, res) =>{
    const id = req.params.id;

    const isRentalExistent = await connection.query('SELECT id FROM rentals WHERE id = $1', [id]);
    if(isRentalExistent.rows.length === 0){
        return res.sendStatus(404);
    }

    const paidRental = await connection.query('SELECT * FROM rentals WHERE id = $1', [id]);
    if(paidRental.rows.returnDate == null){
        return res.sendStatus(400);
    }

    try{    
        await connection.query('DELETE FROM rentals WHERE id = $1',[id]);
        res.sendStatus(201);

    } catch(err){
        console.log(err);
    }
})

server.listen(4000, () => {
  console.log("server listening at 4000 ");
}); 