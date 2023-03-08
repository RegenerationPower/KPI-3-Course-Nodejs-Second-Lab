const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const http = require("http");

const url = 'https://www.bbc.com/ukrainian';
const dir = './news';

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
            $('p:not(.bbc-1e1hq0), span').each((i, elem) => {
                const text = $(elem).text();
                const excluded = ['BBC News', '©', 'Подкасти', 'Фотогалереї', 'Поточна сторінка,', 'Блог психолога',
                    'Подивитись все', 'Здоров\'я', 'Top story - Ukrainian', 'Наука і технології', ', Тривалість ',
                    'Журнал ВВС', 'Суспільство', 'Вибір редакції', 'Відео', 'Розділи', 'Війна з Росією', 'Історії',
                    'Книга року BBC', 'Економіка', 'Читайте також', 'Огляд преси', 'Політика', 'Наш YouTube', 'Докладно'];
                if (!excluded.some((s) => text.includes(s))) {
                    console.log(text);
                    const filename = `${dir}/${counter}.txt`;
                    fs.writeFile(filename, text, (err) => {
                        if (err) throw err;
                        console.log(`File ${filename} saved`);
                    });
                    counter++;
                }
            });

            const server = http.createServer();
            const PORT = 8081;

            server.on('connection', handleConnection);
            server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));

            function handleConnection(socket) {
                const files = fs.readdirSync(dir).sort((a, b) => {
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (numA < numB) return -1;
                    if (numA > numB) return 1;
                    return 0;
                });
                // const files = fs.readdirSync(dir);
                const response = files.join('\n');
                if (socket.writable) {
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Length: ${response.length}\r\n\r\n${response}`);
                    socket.end();
                }

                socket.on('error', (error) => {
                    console.error(`Socket error happened: ${error.message}`);
                });
            }
        });
    })
}

scrapeData();
setInterval(scrapeData, 60000);
