const dotenv = require("dotenv");
dotenv.config()
console.log(process.env.DB_PASSWORD)

const oracledb = require('oracledb');

oracledb.initOracleClient({ libDir: './instantclient_21_3' });

async function run() {

    let connection;

    try {

        connection = await oracledb.getConnection({ user: "admin", password: process.env.DB_PASSWORD, connectionString: "chesspuzzles_high" });

        const result = await connection.execute(`SELECT * FROM PUZZLES WHERE PUZZLEID = '0000D'`);

        console.dir(result.rows, { depth: null });

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

run();