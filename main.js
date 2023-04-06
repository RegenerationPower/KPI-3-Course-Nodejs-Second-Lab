const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const http = require("http");

const url = 'https://www.bbc.com/ukrainian';
const dir = './news';

const server = http.createServer();
const PORT = 8082;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
} else {
    fs.readdirSync(dir).forEach(file => {
        fs.unlinkSync(`${dir}/${file}`);
    });
}

function scrapeData() {
    let counter = 1;

    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const $ = cheerio.load(data);
            const elements = $('main, a.focusIndicatorDisplayInlineBlock');
            elements.each((i, elem) => {
                if (i < elements.length - 4) { // Ігноруємо останні 4 елементи з посиланнями на соц мережі
                    const text = $(elem).text();
                    // Ігноруємо перший файл, у якому міститься уся інфа з мейну
                    if (counter > 1) {
                        const filename = `${dir}/${counter - 1}.txt`;
                        fs.writeFile(filename, text, { encoding: 'utf-8' }, (err) => {
                            if (err) throw err;
                            console.log(`File ${filename} saved`);
                        });
                    }
                    counter++;
                }
            });

            console.log("");
            server.on('connection', handleConnection);

            function handleConnection(socket) {
                socket.on('data', (data) => {
                    const url = data.toString().split(' ')[1];
                    if (url === '/') {
                        const files = fs.readdirSync(dir).sort((a, b) => {
                            const A = parseInt(a);
                            const B = parseInt(b);
                            if (A < B) return -1;
                            if (A > B) return 1;
                            return 0;
                        });

                        let html = '<!DOCTYPE html><html lang="en-GB"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>Lab2</title></head><body><ul>';

                        files.forEach(file => {
                            const id = parseInt(file.split('.')[0]);
                            html += `<li><a href="/${id}">Новина ${id}</a></li>`;
                        });

                        html += '</ul>';
                        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}`);
                        socket.end();

                    } else {
                        const fileNumber = parseInt(url.split('/')[1]);
                        const filename = `${dir}/${fileNumber}.txt`;

                        fs.readFile(filename, (err, content) => {
                            if (err) {
                                console.error(err);
                                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                                socket.end();
                            } else {
                                socket.write(`HTTP/1.1 200 OK\r\nContent-Length: ${content.length}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${content}`);
                                socket.end();
                            }
                        });
                    }
                });
            }
            setTimeout(scrapeData, 60000);
        });
    }).on('error', (err) => {
        console.error(`Error while scraping data: ${err.message}`);
        setTimeout(scrapeData, 60000);
    });
}

scrapeData();
