import createServer from "./server";

// Dummy temp comment
createServer({})
    .then((server) => server.start())
    .then(() => process.send && process.send("online"))
    .then(() => console.log("*** SERVER STARTED ***"))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
