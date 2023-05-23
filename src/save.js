const fs = require("fs");

module.exports = save = (store) => {
    fs.writeFile('gamers.json','[' + store.map(store => JSON.stringify(store)).join(',\n') + ']', 'utf8', (err) => {
        if (err) {
            console.error(err);
        }
    });
}