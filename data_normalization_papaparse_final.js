const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://abiturient.tsu.ru/rating?usg=1&p=01.03.02_%D0%9E_%D0%91_%D0%9E%D0%9F_00000171&l=1&f=18&d=01.03.02&b=%D0%91%D1%8E%D0%B4%D0%B6%D0%B5%D1%82&ef=1';

const columnsToDelete = [0, 1, 2, 3, 5, 6];

axios.get(url)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const table = $('table');
    let proh_ball = null;

    if (!table.length) {
      console.log('Таблица не найдена');
    } else {
      const tableData = [];

      table.find('tbody tr').each((_, row) => {
        const rowData = [];
        $(row).find('td, th').each((colIndex, cell) => {
          if (!columnsToDelete.includes(colIndex)) {
            let content = $(cell).text().trim();

            if (colIndex === 4) { if (content === 'На общих основаниях') { content = 1; } else { content = 0; } } 
            
            if (typeof(content)==='string') {content = content.replace(/[^0-9]/g, '');}
            if (content === '') {content = 0}
            
            if (([4, 7, 8, 9, 11].includes(colIndex) && parseInt(content) === 0)||($(row).hasClass('rating-color-red'))) {
                return false;
            }
 
            rowData.push(content);

            // Обработка последнего столбца
            if (colIndex === $(row).find('td, th').length - 1) {
                // Изменяем данные последнего столбца, если они не равны 0
                if (rowData[rowData.length - 1] != 0 ) { 
                  rowData[rowData.length - 1] = 1; 
                  proh_ball = parseInt(rowData[rowData.length - 2]); // Update proh_ball 
                };
            }
          }
        });

        // Добавляем все строки, а фильтрацию проведем позже
        tableData.push(rowData.join(','));
      });

      // Теперь удалим строки, не соответствующие условиям
      const filteredTableData = tableData.filter(row => {
        const columns = row.split(',');
        return !(columns[columns.length - 1] == 0 && parseInt(columns[columns.length - 2]) < proh_ball) && columns.length >= 7;
      });

      const csvContent = filteredTableData.join('\n');
      
      fs.writeFileSync('table_data.csv', csvContent, 'utf-8');
      console.log('Таблица сохранена в CSV-файле "table_data.csv"');
    }
  })
  .catch(error => {
    console.log('Ошибка при загрузке страницы:', error);
  });