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
    const queryString = req.query.name;
    console.log(queryString);

    try{
        if(queryString){
            const games =  await connection.query(`SELECT * FROM games WHERE games.name iLIKE'${queryString}%'`);
            res.send(games.rows);
        } else {
            const games =  await connection.query('SELECT * FROM games');
            res.send(games.rows);
        }
        
    } catch(err){
        console.log(err);
    }
})

server.post("/games", async (req, res) =>{
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;
   
    try{
        // const verify = await connection.query(`
        //     SELECT games.name, categories.id AS "categoriesId"
        //     FROM games
        //     JOIN categories 
        //     ON games."categoryId" = categories.id
        // `)
    

        const isNameUsed = await connection.query('SELECT name FROM games WHERE name = $1', [name]);
        if(isNameUsed.rows.length !== 0){
            return res.sendStatus(409);
        }

        const isCategoryExistent = await connection.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
        if(isCategoryExistent.rows.length === 0){
            return res.sendStatus(400);
        }

        if(name === "" || stockTotal < 1 || pricePerDay < 1){
            return res.sendStatus(400);
        }

        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', [name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);

    } catch(err){
        console.log(err);
    }
})

server.get("/customers", async (req, res) =>{
    const queryString = req.query.cpf;
    console.log(queryString);

    try{
        if(queryString){
            const customers =  await connection.query(`SELECT * FROM customers WHERE customers.cpf LIKE'${queryString}%'`);
            res.send(customers.rows);
        } else {
            const customers =  await connection.query('SELECT * FROM customers');
            res.send(customers.rows);
        }

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
        cpf: Joi.string().length(11).alphanum().required(),
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
        name: Joi.string().required(),
        cpf: Joi.string().length(11).alphanum().required(),
        phone: Joi.string().min(10).max(11).required(),
        birthday: Joi.date().less('now').required(),
    })

    const validation = schema.validate(req.body)

    if(!validation.error){
        try{
            const isCpfUsed = await connection.query('SELECT * FROM customers WHERE cpf = $1', [cpf]);
            console.log(isCpfUsed.rows)
            if(isCpfUsed.rows.length !== 0 && isCpfUsed.rows[0].id !== id){
                return res.sendStatus(409);
            }

            await connection.query('UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5', [name, phone, cpf, birthday, id]);
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
        const rentals =  await connection.query(`
            SELECT rentals.*, 
            jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
            jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', games."categoryId", 'categoryName', categories.name) AS game            
            FROM rentals 
            JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON categories.id = games."categoryId"
        `);
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

    const rental = await connection.query('SELECT * FROM rentals WHERE id = $1', [id]);
    console.log(rental.rows)
    if(rental.rows.length === 0){
        return res.sendStatus(404);
    } else if(rental.rows[0].returnDate !== null){
        return res.sendStatus(400);
    }

    const returnDate = dayjs();
    const incialDate = (rental.rows[0].rentDate);
    const pricePerDay = (rental.rows[0].originalPrice)/(rental.rows[0].daysRented);
    const lateDays = Math.ceil((new Date(returnDate).getTime() - new Date(incialDate).getTime())/86400000);
    const fee = (lateDays - 1)* pricePerDay;

    try{    
        await connection.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3`, [returnDate, fee, id]);
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
    if(paidRental.rows.returnDate === null){
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