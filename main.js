const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.bbc.com/ukrainian';
let counter = 1;

const dir = './news';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
} else {
    fs.readdirSync(dir).forEach(file => {
        fs.unlinkSync(`${dir}/${file}`);
    });
}

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
    });
}).on('error', (error) => {
    console.error(`Error happened: ${error.message}`);
});
